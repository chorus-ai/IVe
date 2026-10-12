import React from 'react';
import type { WidgetSettingsProps } from '../types';
import { OMOP_TABLE_CARDS, type OmopTables } from '../../../types';

export type DataSource = 'static' | 'endpoint';

export interface EndpointConfig {
  source?: DataSource;
  endpoint?: string;
  method?: 'GET' | 'POST';
  body?: string;
}

export const inputCls =
  'w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 outline-none';
export const labelCls = 'text-xs font-bold text-slate-500 uppercase tracking-wider mb-1';

interface SourceToggleProps {
  value: DataSource;
  onChange: (v: DataSource) => void;
  staticLabel?: string;
  endpointLabel?: string;
}

export const SourceToggle: React.FC<SourceToggleProps> = ({
  value,
  onChange,
  staticLabel = 'Static',
  endpointLabel = 'Endpoint',
}) => (
  <div>
    <label className={labelCls}>Source</label>
    <div className="flex gap-2">
      {([
        { val: 'static' as const, label: staticLabel },
        { val: 'endpoint' as const, label: endpointLabel },
      ]).map(opt => {
        const active = value === opt.val;
        return (
          <button
            key={opt.val}
            type="button"
            onClick={() => onChange(opt.val)}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-bold border transition-colors ${
              active
                ? 'bg-primary text-white border-primary'
                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-primary/40'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  </div>
);

interface EndpointFieldsProps {
  config: EndpointConfig;
  onChange: (next: EndpointConfig) => void;
}

export const EndpointFields: React.FC<EndpointFieldsProps> = ({ config, onChange }) => {
  const set = <K extends keyof EndpointConfig>(k: K, v: EndpointConfig[K]) =>
    onChange({ ...config, [k]: v });
  return (
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
    </>
  );
};

export const DataShape: React.FC<{ shape: Record<string, string> }> = ({ shape }) => (
  <details className="text-xs text-slate-500 dark:text-slate-400">
    <summary className="cursor-pointer font-bold uppercase tracking-wider">Expected response</summary>
    <pre className="mt-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg overflow-x-auto">
{JSON.stringify(shape, null, 2)}
    </pre>
  </details>
);

/** Common validator: when source is endpoint, endpoint string is required */
export function validateEndpoint(c: EndpointConfig): string[] {
  if ((c.source ?? 'static') === 'endpoint' && !c.endpoint) return ['Endpoint is required.'];
  return [];
}

export interface DomainTableConfig extends EndpointConfig {
  personId?: number | string;
  domain?: keyof OmopTables;
  columns?: string[];
  rowLimit?: number;
  sortField?: string;
  sortDir?: 'asc' | 'desc';
}

const DATA_SHAPE = { '[*].<column>': 'OMOP CDM column value' };

const OmopDomainTableSettings: React.FC<WidgetSettingsProps<DomainTableConfig>> = ({ config, onChange }) => {
  const set = <K extends keyof DomainTableConfig>(k: K, v: DomainTableConfig[K]) => onChange({ ...config, [k]: v });
  const source = config.source ?? 'endpoint';
  const card = OMOP_TABLE_CARDS.find(c => c.key === config.domain);
  const availableCols = card?.columns ?? [];
  const cols = config.columns ?? [];
  const toggleCol = (c: string) => {
    const s = new Set(cols);
    if (s.has(c)) s.delete(c); else s.add(c);
    set('columns', [...s]);
  };
  return (
    <div className="space-y-4">
      <SourceToggle value={source} onChange={v => set('source', v)} />
      <div>
        <label className={labelCls}>OMOP Domain</label>
        <select value={config.domain ?? ''} onChange={e => set('domain', e.target.value as keyof OmopTables)} className={inputCls}>
          <option value="">— Select —</option>
          {OMOP_TABLE_CARDS.map(c => <option key={c.key} value={c.key}>{c.name}</option>)}
        </select>
      </div>
      <div>
        <label className={labelCls}>Person ID</label>
        <input type="number" value={config.personId ?? ''} onChange={e => set('personId', e.target.value ? Number(e.target.value) : undefined)} className={inputCls} />
      </div>
      {source === 'endpoint' && (
        <>
          <EndpointFields config={config} onChange={onChange} />
          <DataShape shape={DATA_SHAPE} />
        </>
      )}
      {availableCols.length > 0 && (
        <div>
          <label className={labelCls}>Columns ({cols.length} selected)</label>
          <div className="flex flex-wrap gap-1 max-h-40 overflow-y-auto p-2 border border-slate-200 dark:border-slate-700 rounded-lg">
            {availableCols.map(c => {
              const on = cols.includes(c);
              return (
                <button key={c} type="button" onClick={() => toggleCol(c)} className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-colors ${on ? 'bg-primary text-white border-primary' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'}`}>{c}</button>
              );
            })}
          </div>
        </div>
      )}
      <div className="grid grid-cols-[1fr_1fr_120px] gap-2">
        <div>
          <label className={labelCls}>Sort Field</label>
          <input type="text" value={config.sortField ?? ''} onChange={e => set('sortField', e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Direction</label>
          <select value={config.sortDir ?? 'desc'} onChange={e => set('sortDir', e.target.value as 'asc' | 'desc')} className={inputCls}>
            <option value="asc">Asc</option>
            <option value="desc">Desc</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Row Limit</label>
          <input type="number" min={1} value={config.rowLimit ?? 100} onChange={e => set('rowLimit', Number(e.target.value))} className={inputCls} />
        </div>
      </div>
    </div>
  );
};

export default OmopDomainTableSettings;
export const domainTableDefaults: DomainTableConfig = { source: 'endpoint', rowLimit: 100, sortDir: 'desc' };
export function validateDomainTableConfig(c: DomainTableConfig): string[] {
  const errors = validateEndpoint(c);
  if (!c.domain) errors.push('OMOP domain is required.');
  return errors;
}
