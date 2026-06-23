import type { ResponseData } from '../types';
import { statusClass } from '../utils/status';

type ResponsePanelProps = {
  response?: ResponseData;
  loading: boolean;
};

export function ResponsePanel({ response, loading }: ResponsePanelProps) {
  return (
    <section className="panel response-panel">
      <div className="panel-title-row">
        <h2>Response</h2>
        {loading && (
          <span className="loading-pill">
            <span className="spinner" /> Loading
          </span>
        )}
      </div>

      {!response && !loading && <p className="muted empty-state">Send a request to see status code, headers, and response content.</p>}

      {response?.error && (
        <div className="error-box" role="alert">
          {response.error}
        </div>
      )}

      {response && !response.error && (
        <div className="response-content">
          <div className="response-meta">
            <span className={`status-pill ${statusClass(response.status)}`}>
              Status {response.status} {response.statusText}
            </span>
            <span>{response.elapsedMs} ms</span>
            <span>{response.sizeBytes} bytes</span>
          </div>

          <details className="response-details">
            <summary>Response Headers</summary>
            <pre>{JSON.stringify(response.headers, null, 2)}</pre>
          </details>

          <pre className="body-output">{response.body || '(empty response)'}</pre>
        </div>
      )}
    </section>
  );
}
