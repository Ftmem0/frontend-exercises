import { METHODS } from '../constants';
import type { HttpMethod, RequestConfig } from '../types';

type RequestBarProps = {
  request: RequestConfig;
  urlError: string | null;
  finalUrl: string;
  loading: boolean;
  onRequestChange: (patch: Partial<RequestConfig>) => void;
  onSend: () => void;
  onClear: () => void;
};

export function RequestBar({ request, urlError, finalUrl, loading, onRequestChange, onSend, onClear }: RequestBarProps) {
  return (
    <section className="request-card">
      <div className="request-line">
        <select
          value={request.method}
          onChange={(event) => onRequestChange({ method: event.target.value as HttpMethod })}
          aria-label="HTTP method"
        >
          {METHODS.map((method) => (
            <option key={method} value={method}>
              {method}
            </option>
          ))}
        </select>
        <input
          className={urlError ? 'input-error' : ''}
          type="url"
          value={request.url}
          onChange={(event) => onRequestChange({ url: event.target.value })}
          placeholder="https://api.example.com/v1/users"
          aria-label="Request URL"
        />
        <button className="primary-button" type="button" onClick={onSend} disabled={loading}>
          {loading ? 'Sending…' : 'Send'}
        </button>
        <button className="secondary-button" type="button" onClick={onClear}>
          Clear
        </button>
      </div>
      {urlError ? <p className="error-text">{urlError}</p> : <p className="final-url">Final URL: {finalUrl}</p>}
    </section>
  );
}
