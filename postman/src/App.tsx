import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { AppHeader } from './components/AppHeader';
import { CollectionsPanel } from './components/CollectionsPanel';
import { HistoryPanel } from './components/HistoryPanel';
import { RequestBar } from './components/RequestBar';
import { TabBar } from './components/TabBar';
import { Workspace } from './components/Workspace';
import { MAX_HISTORY_ITEMS } from './constants';
import { cloneRequest, createEmptyRequest, createTab, fallbackState } from './data/defaultState';
import { loadState, saveState } from './storage/localStorage';
import type { EditorTab, RequestCollection, RequestConfig, ResponseData, SavedRequest, TabData } from './types';
import { createId } from './utils/id';
import { downloadJson } from './utils/download';
import { buildFinalUrl, keyValueToObject, prettifyResponseBody, validateUrl } from './utils/request';

function App() {
  const initialState = useMemo(loadState, []);
  const [tabs, setTabs] = useState<TabData[]>(initialState.tabs);
  const [activeTabId, setActiveTabId] = useState(initialState.activeTabId);
  const [collections, setCollections] = useState<RequestCollection[]>(initialState.collections);
  const [history, setHistory] = useState<SavedRequest[]>(initialState.history);
  const [darkMode, setDarkMode] = useState(initialState.darkMode);
  const [loading, setLoading] = useState(false);
  const [collectionName, setCollectionName] = useState('');
  const [selectedCollectionId, setSelectedCollectionId] = useState(initialState.collections[0]?.id ?? '');
  const [savedRequestName, setSavedRequestName] = useState('');
  const [activeEditor, setActiveEditor] = useState<EditorTab>('params');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? tabs[0] ?? createTab(1);
  const activeRequest = activeTab.request;
  const activeResponse = activeTab.response;
  const urlError = validateUrl(activeRequest.url);
  const finalUrl = urlError ? '' : buildFinalUrl(activeRequest);

  useEffect(() => {
    saveState({ tabs, activeTabId, collections, history, darkMode });
    document.documentElement.dataset.theme = darkMode ? 'dark' : 'light';
  }, [tabs, activeTabId, collections, history, darkMode]);

  useEffect(() => {
    if (!collections.some((collection) => collection.id === selectedCollectionId)) {
      setSelectedCollectionId(collections[0]?.id ?? '');
    }
  }, [collections, selectedCollectionId]);

  const updateActiveTab = (updater: (tab: TabData) => TabData) => {
    setTabs((previousTabs) => previousTabs.map((tab) => (tab.id === activeTabId ? updater(tab) : tab)));
  };

  const updateActiveRequest = (patch: Partial<RequestConfig>) => {
    updateActiveTab((tab) => ({
      ...tab,
      request: { ...tab.request, ...patch }
    }));
  };

  const loadRequestIntoActiveTab = (request: RequestConfig) => {
    updateActiveTab((tab) => ({
      ...tab,
      request: cloneRequest(request),
      response: undefined
    }));
  };

  const renameActiveTab = (request: RequestConfig) => {
    const candidate = request.url.trim() || request.method;
    const title = candidate.length > 24 ? `${candidate.slice(0, 24)}…` : candidate;
    updateActiveTab((tab) => ({ ...tab, title }));
  };

  const addTab = () => {
    const nextTab = createTab(tabs.length + 1);
    setTabs((previousTabs) => [...previousTabs, nextTab]);
    setActiveTabId(nextTab.id);
  };

  const closeTab = (tabId: string) => {
    setTabs((previousTabs) => {
      if (previousTabs.length === 1) {
        const nextTab = createTab(1);
        setActiveTabId(nextTab.id);
        return [nextTab];
      }

      const nextTabs = previousTabs.filter((tab) => tab.id !== tabId);
      if (activeTabId === tabId && nextTabs[0]) {
        setActiveTabId(nextTabs[0].id);
      }
      return nextTabs;
    });
  };

  const clearActiveRequest = () => {
    updateActiveTab((tab) => ({
      ...tab,
      request: {
        ...createEmptyRequest(),
        url: '',
        params: [],
        headers: [],
        body: ''
      },
      response: undefined
    }));
  };

  const saveToHistory = (request: RequestConfig, status?: number) => {
    const historyItem: SavedRequest = {
      ...cloneRequest(request),
      id: createId(),
      name: `${request.method} ${request.url}`,
      createdAt: new Date().toISOString(),
      status
    };
    setHistory((previous) => [historyItem, ...previous].slice(0, MAX_HISTORY_ITEMS));
  };

  const sendRequest = async () => {
    const validationError = validateUrl(activeRequest.url);
    if (validationError) {
      updateActiveTab((tab) => ({
        ...tab,
        response: { error: validationError }
      }));
      return;
    }

    if (activeRequest.bodyMode === 'json' && activeRequest.body.trim()) {
      try {
        JSON.parse(activeRequest.body);
      } catch {
        updateActiveTab((tab) => ({
          ...tab,
          response: { error: 'Request body is not valid JSON. Switch to Raw or fix the JSON before sending.' }
        }));
        return;
      }
    }

    const requestSnapshot = cloneRequest(activeRequest);
    const requestUrl = buildFinalUrl(requestSnapshot);
    const headers = keyValueToObject(requestSnapshot.headers);

    if (requestSnapshot.bodyMode === 'json' && requestSnapshot.body.trim()) {
      const hasContentType = Object.keys(headers).some((key) => key.toLowerCase() === 'content-type');
      if (!hasContentType) headers['Content-Type'] = 'application/json';
    }

    const canSendBody = requestSnapshot.method !== 'GET';
    const startedAt = performance.now();

    setLoading(true);
    updateActiveTab((tab) => ({ ...tab, response: undefined }));

    try {
      const response = await fetch(requestUrl, {
        method: requestSnapshot.method,
        headers,
        body: canSendBody && requestSnapshot.body.trim() ? requestSnapshot.body : undefined
      });

      const text = await response.text();
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      const result: ResponseData = {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        body: prettifyResponseBody(text, response.headers.get('content-type')),
        elapsedMs: Math.round(performance.now() - startedAt),
        sizeBytes: new Blob([text]).size
      };

      updateActiveTab((tab) => ({ ...tab, response: result }));
      saveToHistory(requestSnapshot, response.status);
      renameActiveTab(requestSnapshot);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown network error';
      updateActiveTab((tab) => ({
        ...tab,
        response: {
          error: `Request failed: ${message}. The browser may also block some requests because of CORS.`
        }
      }));
      saveToHistory(requestSnapshot);
    } finally {
      setLoading(false);
    }
  };

  const createCollection = () => {
    const name = collectionName.trim();
    if (!name) return;

    const collection: RequestCollection = { id: createId(), name, requests: [] };
    setCollections((previous) => [...previous, collection]);
    setSelectedCollectionId(collection.id);
    setCollectionName('');
  };

  const deleteCollection = (collectionId: string) => {
    setCollections((previous) => previous.filter((collection) => collection.id !== collectionId));
  };

  const saveRequestToCollection = () => {
    const collectionId = selectedCollectionId || collections[0]?.id;
    if (!collectionId) return;

    const request: SavedRequest = {
      ...cloneRequest(activeRequest),
      id: createId(),
      name: savedRequestName.trim() || `${activeRequest.method} ${activeRequest.url || 'Untitled request'}`,
      createdAt: new Date().toISOString(),
      status: activeResponse?.status
    };

    setCollections((previous) =>
      previous.map((collection) =>
        collection.id === collectionId ? { ...collection, requests: [request, ...collection.requests] } : collection
      )
    );
    setSavedRequestName('');
  };

  const deleteSavedRequest = (collectionId: string, requestId: string) => {
    setCollections((previous) =>
      previous.map((collection) =>
        collection.id === collectionId
          ? { ...collection, requests: collection.requests.filter((request) => request.id !== requestId) }
          : collection
      )
    );
  };

  const exportCollections = () => downloadJson('api-client-collections.json', { collections });

  const exportSingleCollection = (collection: RequestCollection) => {
    const safeName = collection.name.toLowerCase().replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'collection';
    downloadJson(`${safeName}.json`, { collections: [collection] });
  };

  const importCollections = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const importedCollections = (Array.isArray(parsed) ? parsed : parsed.collections) as Partial<RequestCollection>[];

        if (!Array.isArray(importedCollections)) {
          throw new Error('JSON file must contain a collections array.');
        }

        const normalized: RequestCollection[] = importedCollections.map((collection) => ({
          id: createId(),
          name: String(collection.name || 'Imported Collection'),
          requests: Array.isArray(collection.requests)
            ? collection.requests.map((request) => ({
                ...cloneRequest(request),
                id: createId(),
                name: String(request.name || `${request.method || 'GET'} ${request.url || 'Imported request'}`),
                createdAt: request.createdAt || new Date().toISOString(),
                status: request.status
              }))
            : []
        }));

        setCollections((previous) => [...previous, ...normalized]);
        if (normalized[0]) setSelectedCollectionId(normalized[0].id);
      } catch (error) {
        updateActiveTab((tab) => ({
          ...tab,
          response: { error: error instanceof Error ? error.message : 'Could not import collections JSON.' }
        }));
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const clearAllLocalData = () => {
    const next = fallbackState();

    setTabs(next.tabs);
    setActiveTabId(next.activeTabId);
    setCollections(next.collections);
    setHistory(next.history);
    setDarkMode(next.darkMode);
    setSelectedCollectionId(next.collections[0]?.id ?? '');
  };

  return (
    <main className="app-shell">
      <AppHeader
        darkMode={darkMode}
        onToggleTheme={() => setDarkMode((value) => !value)}
        onResetLocalData={clearAllLocalData}
      />

      <TabBar tabs={tabs} activeTabId={activeTabId} onSelectTab={setActiveTabId} onAddTab={addTab} onCloseTab={closeTab} />

      <RequestBar
        request={activeRequest}
        urlError={urlError}
        finalUrl={finalUrl}
        loading={loading}
        onRequestChange={updateActiveRequest}
        onSend={sendRequest}
        onClear={clearActiveRequest}
      />

      <div className="layout-grid">
        <aside className="sidebar">
          <CollectionsPanel
            collections={collections}
            collectionName={collectionName}
            selectedCollectionId={selectedCollectionId}
            savedRequestName={savedRequestName}
            fileInputRef={fileInputRef}
            onCollectionNameChange={setCollectionName}
            onSelectedCollectionChange={setSelectedCollectionId}
            onSavedRequestNameChange={setSavedRequestName}
            onCreateCollection={createCollection}
            onExportCollections={exportCollections}
            onExportSingleCollection={exportSingleCollection}
            onImportCollections={importCollections}
            onSaveRequest={saveRequestToCollection}
            onDeleteCollection={deleteCollection}
            onDeleteSavedRequest={deleteSavedRequest}
            onLoadRequest={loadRequestIntoActiveTab}
          />

          <HistoryPanel
            history={history}
            onClearHistory={() => setHistory([])}
            onDeleteHistoryItem={(historyItemId) =>
              setHistory((previous) => previous.filter((historyItem) => historyItem.id !== historyItemId))
            }
            onLoadRequest={loadRequestIntoActiveTab}
          />
        </aside>

        <Workspace
          activeEditor={activeEditor}
          request={activeRequest}
          response={activeResponse}
          loading={loading}
          onEditorChange={setActiveEditor}
          onRequestChange={updateActiveRequest}
        />
      </div>
    </main>
  );
}

export default App;
