import type { RequestConfig, SavedRequest } from '../types';
import { formatDateTime } from '../utils/date';

type HistoryPanelProps = {
  history: SavedRequest[];
  onClearHistory: () => void;
  onDeleteHistoryItem: (historyItemId: string) => void;
  onLoadRequest: (request: RequestConfig) => void;
};

export function HistoryPanel({ history, onClearHistory, onDeleteHistoryItem, onLoadRequest }: HistoryPanelProps) {
  return (
    <section className="panel">
      <div className="panel-title-row">
        <h2>History</h2>
        <button className="small-button danger" type="button" onClick={onClearHistory}>
          Clear
        </button>
      </div>
      {history.length === 0 ? (
        <p className="muted">Sent requests will appear here.</p>
      ) : (
        <div className="history-list">
          {history.map((item) => (
            <article className="history-item" key={item.id}>
              <button type="button" onClick={() => onLoadRequest(item)}>
                <strong>{item.method}</strong>
                <span>{item.url}</span>
                <small>
                  {formatDateTime(item.createdAt)} {item.status ? `· ${item.status}` : ''}
                </small>
              </button>
              <button className="icon-button danger" type="button" onClick={() => onDeleteHistoryItem(item.id)}>
                ×
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
