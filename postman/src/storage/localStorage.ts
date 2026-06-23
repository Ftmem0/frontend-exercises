import { STORAGE_KEY } from '../constants';
import { fallbackState } from '../data/defaultState';
import type { StorageShape } from '../types';

export const loadState = (): StorageShape => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallbackState();

    const parsed = JSON.parse(raw) as Partial<StorageShape>;
    const fallback = fallbackState();
    const tabs = Array.isArray(parsed.tabs) && parsed.tabs.length > 0 ? parsed.tabs : fallback.tabs;

    return {
      tabs,
      activeTabId: parsed.activeTabId && tabs.some((tab) => tab.id === parsed.activeTabId) ? parsed.activeTabId : tabs[0].id,
      collections: Array.isArray(parsed.collections) ? parsed.collections : fallback.collections,
      history: Array.isArray(parsed.history) ? parsed.history : [],
      darkMode: Boolean(parsed.darkMode)
    };
  } catch {
    return fallbackState();
  }
};

export const saveState = (state: StorageShape) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};
