import type { EditorTab, RequestConfig, ResponseData } from '../types';
import { BodyEditor } from './BodyEditor';
import { KeyValueEditor } from './KeyValueEditor';
import { ResponsePanel } from './ResponsePanel';

type WorkspaceProps = {
  activeEditor: EditorTab;
  request: RequestConfig;
  response?: ResponseData;
  loading: boolean;
  onEditorChange: (editor: EditorTab) => void;
  onRequestChange: (patch: Partial<RequestConfig>) => void;
};

export function Workspace({ activeEditor, request, response, loading, onEditorChange, onRequestChange }: WorkspaceProps) {
  return (
    <section className="workspace">
      <div className="editor-tabs" role="tablist" aria-label="Request editors">
        <button className={activeEditor === 'params' ? 'active' : ''} type="button" onClick={() => onEditorChange('params')}>
          Parameters
        </button>
        <button className={activeEditor === 'headers' ? 'active' : ''} type="button" onClick={() => onEditorChange('headers')}>
          Headers
        </button>
        <button className={activeEditor === 'body' ? 'active' : ''} type="button" onClick={() => onEditorChange('body')}>
          Body
        </button>
      </div>

      {activeEditor === 'params' && (
        <KeyValueEditor
          title="Query Parameters"
          rows={request.params}
          placeholderKey="page"
          placeholderValue="1"
          onChange={(params) => onRequestChange({ params })}
        />
      )}

      {activeEditor === 'headers' && (
        <KeyValueEditor
          title="Headers"
          rows={request.headers}
          placeholderKey="Authorization"
          placeholderValue="Bearer token"
          onChange={(headers) => onRequestChange({ headers })}
        />
      )}

      {activeEditor === 'body' && <BodyEditor request={request} onRequestChange={onRequestChange} />}

      <ResponsePanel response={response} loading={loading} />
    </section>
  );
}
