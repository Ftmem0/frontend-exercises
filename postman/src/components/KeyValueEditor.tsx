import { emptyKeyValue } from '../data/defaultState';
import type { KeyValue } from '../types';

type KeyValueEditorProps = {
  title: string;
  rows: KeyValue[];
  placeholderKey: string;
  placeholderValue: string;
  onChange: (rows: KeyValue[]) => void;
};

export function KeyValueEditor({ title, rows, placeholderKey, placeholderValue, onChange }: KeyValueEditorProps) {
  const updateRow = (id: string, patch: Partial<KeyValue>) => {
    onChange(rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const removeRow = (id: string) => {
    onChange(rows.filter((row) => row.id !== id));
  };

  return (
    <section className="panel stacked-panel">
      <div className="panel-title-row">
        <h2>{title}</h2>
        <button className="secondary-button" type="button" onClick={() => onChange([...rows, emptyKeyValue()])}>
          + Add
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="muted empty-state">No {title.toLowerCase()} yet. Add a key/value row.</p>
      ) : (
        <div className="kv-list">
          {rows.map((row) => (
            <div className="kv-row" key={row.id}>
              <label className="checkbox-cell" title="Enable/disable row">
                <input
                  type="checkbox"
                  checked={row.enabled}
                  onChange={(event) => updateRow(row.id, { enabled: event.target.checked })}
                />
              </label>
              <input
                type="text"
                value={row.key}
                placeholder={placeholderKey}
                onChange={(event) => updateRow(row.id, { key: event.target.value })}
              />
              <input
                type="text"
                value={row.value}
                placeholder={placeholderValue}
                onChange={(event) => updateRow(row.id, { value: event.target.value })}
              />
              <button className="icon-button danger" type="button" onClick={() => removeRow(row.id)} aria-label="Delete row">
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
