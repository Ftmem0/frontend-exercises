import type { ChangeEvent, RefObject } from 'react';
import type { RequestCollection, RequestConfig } from '../types';

type CollectionsPanelProps = {
  collections: RequestCollection[];
  collectionName: string;
  selectedCollectionId: string;
  savedRequestName: string;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onCollectionNameChange: (name: string) => void;
  onSelectedCollectionChange: (collectionId: string) => void;
  onSavedRequestNameChange: (name: string) => void;
  onCreateCollection: () => void;
  onExportCollections: () => void;
  onExportSingleCollection: (collection: RequestCollection) => void;
  onImportCollections: (event: ChangeEvent<HTMLInputElement>) => void;
  onSaveRequest: () => void;
  onDeleteCollection: (collectionId: string) => void;
  onDeleteSavedRequest: (collectionId: string, requestId: string) => void;
  onLoadRequest: (request: RequestConfig) => void;
};

export function CollectionsPanel({
  collections,
  collectionName,
  selectedCollectionId,
  savedRequestName,
  fileInputRef,
  onCollectionNameChange,
  onSelectedCollectionChange,
  onSavedRequestNameChange,
  onCreateCollection,
  onExportCollections,
  onExportSingleCollection,
  onImportCollections,
  onSaveRequest,
  onDeleteCollection,
  onDeleteSavedRequest,
  onLoadRequest
}: CollectionsPanelProps) {
  return (
    <section className="panel">
      <div className="panel-title-row">
        <h2>Collections</h2>
        <button className="small-button" type="button" onClick={onExportCollections}>
          Export all
        </button>
      </div>

      <div className="inline-form">
        <input
          type="text"
          value={collectionName}
          onChange={(event) => onCollectionNameChange(event.target.value)}
          placeholder="New collection name"
        />
        <button className="secondary-button" type="button" onClick={onCreateCollection}>
          Create
        </button>
      </div>

      <input
        ref={fileInputRef}
        className="hidden-file"
        type="file"
        accept="application/json,.json"
        onChange={onImportCollections}
      />
      <button className="secondary-button full-width" type="button" onClick={() => fileInputRef.current?.click()}>
        Import JSON
      </button>

      <div className="save-box">
        <select value={selectedCollectionId} onChange={(event) => onSelectedCollectionChange(event.target.value)}>
          {collections.map((collection) => (
            <option key={collection.id} value={collection.id}>
              {collection.name}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={savedRequestName}
          onChange={(event) => onSavedRequestNameChange(event.target.value)}
          placeholder="Request name"
        />
        <button className="primary-button full-width" type="button" onClick={onSaveRequest}>
          Save current request
        </button>
      </div>

      <div className="collection-list">
        {collections.map((collection) => (
          <details key={collection.id} open className="collection-item">
            <summary>
              <span>{collection.name}</span>
              <span className="count">{collection.requests.length}</span>
            </summary>
            <div className="collection-actions">
              <button className="small-button" type="button" onClick={() => onExportSingleCollection(collection)}>
                Export
              </button>
              <button className="small-button danger" type="button" onClick={() => onDeleteCollection(collection.id)}>
                Delete
              </button>
            </div>
            {collection.requests.length === 0 ? (
              <p className="muted">No saved requests.</p>
            ) : (
              collection.requests.map((request) => (
                <article className="saved-row" key={request.id}>
                  <button type="button" onClick={() => onLoadRequest(request)}>
                    <strong>{request.name}</strong>
                    <span>
                      {request.method} · {request.url}
                    </span>
                  </button>
                  <button className="icon-button danger" type="button" onClick={() => onDeleteSavedRequest(collection.id, request.id)}>
                    ×
                  </button>
                </article>
              ))
            )}
          </details>
        ))}
      </div>
    </section>
  );
}
