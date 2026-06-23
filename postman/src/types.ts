export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type BodyMode = 'raw' | 'json';
export type EditorTab = 'params' | 'headers' | 'body';

export type KeyValue = {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
};

export type RequestConfig = {
  method: HttpMethod;
  url: string;
  params: KeyValue[];
  headers: KeyValue[];
  body: string;
  bodyMode: BodyMode;
};

export type ResponseData = {
  status?: number;
  statusText?: string;
  headers?: Record<string, string>;
  body?: string;
  elapsedMs?: number;
  sizeBytes?: number;
  error?: string;
};

export type TabData = {
  id: string;
  title: string;
  request: RequestConfig;
  response?: ResponseData;
};

export type SavedRequest = RequestConfig & {
  id: string;
  name: string;
  createdAt: string;
  status?: number;
};

export type RequestCollection = {
  id: string;
  name: string;
  requests: SavedRequest[];
};

export type StorageShape = {
  tabs: TabData[];
  activeTabId: string;
  collections: RequestCollection[];
  history: SavedRequest[];
  darkMode: boolean;
};
