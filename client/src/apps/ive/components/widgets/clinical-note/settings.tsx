import React from 'react';
import type { WidgetSettingsProps } from '../types';

export type ClinicalNotesSource = 'text' | 'endpoint';

export interface ClinicalNotesConfig {
  source?: ClinicalNotesSource;
  /** Raw note text shown when source === 'text' */
  noteText?: string;
  /** Endpoint returning the note text (plain string or { text: string }) when source === 'endpoint' */
  endpoint?: string;
  method?: 'GET' | 'POST';
  body?: string;
}

export const CLINICAL_NOTES_DATA_SHAPE = {
  // Endpoint response: either a plain string, or an object with a `text` field.
  response: 'string | { text: string }',
} as const;

const inputCls =
  'w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 outline-none';
const labelCls = 'text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 ';

const ClinicalNotesSettings: React.FC<WidgetSettingsProps<ClinicalNotesConfig>> = ({ config, onChange }) => {
  const set = <K extends keyof ClinicalNotesConfig>(k: K, v: ClinicalNotesConfig[K]) =>
    onChange({ ...config, [k]: v });

  const source = config.source ?? 'text';

  return (
    <div className="space-y-4">
      <div>
        <label className={labelCls}>Source</label>
        <div className="flex gap-2">
          {(['text', 'endpoint'] as ClinicalNotesSource[]).map(opt => {
            const active = source === opt;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => set('source', opt)}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-bold border transition-colors ${
                  active
                    ? 'bg-primary text-white border-primary'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-primary/40'
                }`}
              >
                {opt === 'text' ? 'Raw Text' : 'Endpoint'}
              </button>
            );
          })}
        </div>
      </div>

      {source === 'text' ? (
        <div>
          <label className={labelCls}>Note Text</label>
          <textarea
            rows={10}
            value={config.noteText ?? ''}
            onChange={e => set('noteText', e.target.value)}
            placeholder="Paste the clinical note here..."
            className={`${inputCls} font-serif leading-relaxed`}
          />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-[100px_1fr] gap-2">
            <div>
              <label className={labelCls}>Method</label>
              <select
                value={config.method ?? 'GET'}
                onChange={e => set('method', e.target.value as 'GET' | 'POST')}
                className={inputCls}
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Endpoint</label>
              <input
                type="text"
                value={config.endpoint ?? ''}
                onChange={e => set('endpoint', e.target.value)}
                placeholder="/api/ive/notes/123"
                className={`${inputCls} font-mono`}
              />
            </div>
          </div>

          {config.method === 'POST' && (
            <div>
              <label className={labelCls}>Body (JSON)</label>
              <textarea
                rows={3}
                value={config.body ?? ''}
                onChange={e => set('body', e.target.value)}
                placeholder='{ "noteId": 123 }'
                className={`${inputCls} font-mono`}
              />
            </div>
          )}

          <details className="text-xs text-slate-500 dark:text-slate-400">
            <summary className="cursor-pointer font-bold uppercase tracking-wider">Expected response</summary>
            <pre className="mt-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg overflow-x-auto">
{JSON.stringify(CLINICAL_NOTES_DATA_SHAPE, null, 2)}
            </pre>
          </details>
        </>
      )}
    </div>
  );
};

export default ClinicalNotesSettings;

export const clinicalNotesDefaults: ClinicalNotesConfig = {
  source: 'text',
  noteText: '',
  method: 'GET',
};

export function validateClinicalNotesConfig(c: ClinicalNotesConfig): string[] {
  const errors: string[] = [];
  const source = c.source ?? 'text';
  if (source === 'text') {
    if (!c.noteText || !c.noteText.trim()) errors.push('Note text is required.');
  } else {
    if (!c.endpoint) errors.push('Endpoint is required.');
  }
  return errors;
}
