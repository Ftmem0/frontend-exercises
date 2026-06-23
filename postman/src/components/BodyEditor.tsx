import type { RequestConfig } from '../types';

type BodyEditorProps = {
  request: RequestConfig;
  onRequestChange: (patch: Partial<RequestConfig>) => void;
};

export function BodyEditor({ request, onRequestChange }: BodyEditorProps) {
  return (
    <section className="panel stacked-panel">
      <div className="panel-title-row">
        <h2>Request Body</h2>
        <div className="segmented-control" role="group" aria-label="Body mode">
          <button
            className={request.bodyMode === 'json' ? 'active' : ''}
            type="button"
            onClick={() => onRequestChange({ bodyMode: 'json' })}
          >
            JSON
          </button>
          <button
            className={request.bodyMode === 'raw' ? 'active' : ''}
            type="button"
            onClick={() => onRequestChange({ bodyMode: 'raw' })}
          >
            Raw
          </button>
        </div>
      </div>
      <textarea
        value={request.body}
        onChange={(event) => onRequestChange({ body: event.target.value })}
        placeholder={request.bodyMode === 'json' ? '{\n  "key": "value"\n}' : 'Raw request body'}
      />
      {request.method === 'GET' && <p className="muted">The browser fetch API will not send a body for GET requests in this client.</p>}
    </section>
  );
}
