import type { TabData } from '../types';

type TabBarProps = {
  tabs: TabData[];
  activeTabId: string;
  onSelectTab: (tabId: string) => void;
  onAddTab: () => void;
  onCloseTab: (tabId: string) => void;
};

export function TabBar({ tabs, activeTabId, onSelectTab, onAddTab, onCloseTab }: TabBarProps) {
  return (
    <nav className="tabs" aria-label="Request tabs">
      {tabs.map((tab) => (
        <button
          className={`tab ${tab.id === activeTabId ? 'active' : ''}`}
          type="button"
          key={tab.id}
          onClick={() => onSelectTab(tab.id)}
        >
          <span>{tab.title}</span>
          <span
            className="tab-close"
            onClick={(event) => {
              event.stopPropagation();
              onCloseTab(tab.id);
            }}
            aria-label="Close tab"
          >
            ×
          </span>
        </button>
      ))}
      <button className="add-tab" type="button" onClick={onAddTab} aria-label="Add tab">
        +
      </button>
    </nav>
  );
}
