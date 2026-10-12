import React from 'react';
import type { WidgetSettingsProps } from '../types';

export interface TableColumnConfig {
  field: string;
  label?: string;
  align?: 'left' | 'right' | 'center';
  format?: 'text' | 'number' | 'date' | 'badge';
}

export interface GenericTableConfig {
  endpoint?: string;
  method?: 'GET' | 'POST';
  body?: string;
  columns?: TableColumnConfig[];
  rowLimit?: number;
  statusField?: string;
  statusColorMap?: Record<string, string>;
  zebra?: boolean;
  dense?: boolean;
  sortField?: string;
  sortDir?: 'asc' | 'desc';
}

export const GENERIC_TABLE_DATA_SHAPE = {
  // Array of rows. Each row has the keys named in columns[*].field.
  '[*].<field>': 'string | number | date',
} as const;

const inputCls =
  'w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 outline-none';
const labelCls = 'text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 ';

const FORMATS: TableColumnConfig['format'][] = ['text', 'number', 'date', 'badge'];
const ALIGNS: TableColumnConfig['align'][] = ['left', 'center', 'right'];

const GenericTableSettings: React.FC<WidgetSettingsProps<GenericTableConfig>> = ({ config, onChange }) => {
  const set = <K extends keyof GenericTableConfig>(k: K, v: GenericTableConfig[K]) =>
    onChange({ ...config, [k]: v });

  const cols = config.columns ?? [];

  const updateCol = (i: number, patch: Partial<TableColumnConfig>) => {
    const next = cols.map((c, idx) => (idx === i ? { ...c, ...patch } : c));
    set('columns', next);
  };
  const addCol = () => set('columns', [...cols, { field: '', label: '', align: 'left', format: 'text' }]);
  const removeCol = (i: number) => set('columns', cols.filter((_, idx) => idx !== i));
  const moveCol = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= cols.length) return;
    const next = [...cols];
    [next[i], next[j]] = [next[j], next[i]];
    set('columns', next);
  };

  return (
    <div className="space-y-4">
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
            placeholder="/api/ive/..."
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
            placeholder='{ "personId": 123 }'
            className={`${inputCls} font-mono`}
          />
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className={labelCls}>Columns</label>
          <button
            type="button"
            onClick={addCol}
            className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Add Column
          </button>
        </div>
        {cols.length === 0 && (
          <p className="text-xs italic text-slate-400 dark:text-slate-500 py-2">No columns. Add one to render the table.</p>
        )}
        <div className="space-y-2">
          {cols.map((c, i) => (
            <div key={i} className="border border-slate-200 dark:border-slate-700 rounded-lg p-2 space-y-2 bg-slate-50/40 dark:bg-slate-800/30">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={c.field}
                  onChange={e => updateCol(i, { field: e.target.value })}
                  placeholder="field name"
                  className={`${inputCls} font-mono`}
                />
                <input
                  type="text"
                  value={c.label ?? ''}
                  onChange={e => updateCol(i, { label: e.target.value })}
                  placeholder="display label"
                  className={inputCls}
                />
              </div>
              <div className="grid grid-cols-[1fr_1fr_auto_auto_auto] gap-2 items-center">
                <select
                  value={c.format ?? 'text'}
                  onChange={e => updateCol(i, { format: e.target.value as TableColumnConfig['format'] })}
                  className={inputCls}
                >
                  {FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
                <select
                  value={c.align ?? 'left'}
                  onChange={e => updateCol(i, { align: e.target.value as TableColumnConfig['align'] })}
                  className={inputCls}
                >
                  {ALIGNS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                <button
                  type="button"
                  onClick={() => moveCol(i, -1)}
                  disabled={i === 0}
                  className="p-1 text-slate-500 hover:text-primary disabled:opacity-30"
                  title="Move up"
                >
                  <span className="material-symbols-outlined text-base">arrow_upward</span>
                </button>
                <button
                  type="button"
                  onClick={() => moveCol(i, 1)}
                  disabled={i === cols.length - 1}
                  className="p-1 text-slate-500 hover:text-primary disabled:opacity-30"
                  title="Move down"
                >
                  <span className="material-symbols-outlined text-base">arrow_downward</span>
                </button>
                <button
                  type="button"
                  onClick={() => removeCol(i)}
                  className="p-1 text-red-500 hover:text-red-600"
                  title="Remove"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={labelCls}>Row Limit</label>
          <input
            type="number"
            min={1}
            value={config.rowLimit ?? ''}
            onChange={e => set('rowLimit', e.target.value ? Number(e.target.value) : undefined)}
            placeholder="50"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Status Field (for badge color)</label>
          <input
            type="text"
            value={config.statusField ?? ''}
            onChange={e => set('statusField', e.target.value)}
            placeholder="status"
            className={inputCls}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={labelCls}>Sort Field</label>
          <input
            type="text"
            value={config.sortField ?? ''}
            onChange={e => set('sortField', e.target.value)}
            placeholder="date"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Sort Direction</label>
          <select
            value={config.sortDir ?? 'desc'}
            onChange={e => set('sortDir', e.target.value as 'asc' | 'desc')}
            className={inputCls}
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            checked={config.zebra ?? false}
            onChange={e => set('zebra', e.target.checked)}
            className="rounded border-slate-300 text-primary focus:ring-primary"
          />
          Zebra Striping
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            checked={config.dense ?? false}
            onChange={e => set('dense', e.target.checked)}
            className="rounded border-slate-300 text-primary focus:ring-primary"
          />
          Dense Rows
        </label>
      </div>

      <details className="text-xs text-slate-500 dark:text-slate-400">
        <summary className="cursor-pointer font-bold uppercase tracking-wider">Required data shape</summary>
        <pre className="mt-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg overflow-x-auto">
{JSON.stringify(GENERIC_TABLE_DATA_SHAPE, null, 2)}
        </pre>
      </details>
    </div>
  );
};

export default GenericTableSettings;

export const genericTableDefaults: GenericTableConfig = {
  method: 'GET',
  columns: [],
  rowLimit: 50,
  sortDir: 'desc',
};

export function validateGenericTableConfig(c: GenericTableConfig): string[] {
  const errors: string[] = [];
  if (!c.endpoint) errors.push('Endpoint is required.');
  if (!c.columns || c.columns.length === 0) errors.push('At least one column is required.');
  c.columns?.forEach((col, i) => {
    if (!col.field) errors.push(`Column ${i + 1}: field name is required.`);
  });
  return errors;
}
