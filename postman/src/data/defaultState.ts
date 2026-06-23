import type { KeyValue, RequestCollection, RequestConfig, StorageShape, TabData } from '../types';
import { createId } from '../utils/id';

export const emptyKeyValue = (): KeyValue => ({
  id: createId(),
  key: '',
  value: '',
  enabled: true
});

export const createEmptyRequest = (): RequestConfig => ({
  method: 'GET',
  url: 'https://jsonplaceholder.typicode.com/posts/1',
  params: [],
  headers: [{ id: createId(), key: 'Accept', value: 'application/json', enabled: true }],
  body: '{\n  "title": "foo",\n  "body": "bar",\n  "userId": 1\n}',
  bodyMode: 'json'
});

export const createTab = (index: number): TabData => ({
  id: createId(),
  title: `Tab ${index}`,
  request: createEmptyRequest()
});

export const defaultCollections = (): RequestCollection[] => [
  {
    id: createId(),
    name: 'Default Collection',
    requests: []
  }
];

export const fallbackState = (): StorageShape => {
  const tab = createTab(1);

  return {
    tabs: [tab],
    activeTabId: tab.id,
    collections: defaultCollections(),
    history: [],
    darkMode: false
  };
};

export const cloneRequest = (request: RequestConfig): RequestConfig => ({
  method: request.method,
  url: request.url,
  params: request.params.map((item) => ({ ...item, id: createId() })),
  headers: request.headers.map((item) => ({ ...item, id: createId() })),
  body: request.body,
  bodyMode: request.bodyMode
});
