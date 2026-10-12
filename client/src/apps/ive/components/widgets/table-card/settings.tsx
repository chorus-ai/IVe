import React from 'react';
import type { WidgetSettingsProps } from '../types';
import { TABLE_CARDS, type OmopTables } from '../../../types';

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

export interface TableCardConfig {
  tableKey?: keyof OmopTables;
  personId?: number | string;
  visitId?: number | string;
  showIcon?: boolean;
  showDescription?: boolean;
  showRowCount?: boolean;
  accent?: string;
}

const OmopTableCardSettings: React.FC<WidgetSettingsProps<TableCardConfig>> = ({ config, onChange }) => {
  const set = <K extends keyof TableCardConfig>(k: K, v: TableCardConfig[K]) => onChange({ ...config, [k]: v });
  return (
    <div className="space-y-4">
      <div>
        <label className={labelCls}>OMOP Table</label>
        <select value={config.tableKey ?? ''} onChange={e => set('tableKey', e.target.value as keyof OmopTables)} className={inputCls}>
          <option value="">— Select —</option>
          {TABLE_CARDS.map(c => <option key={c.key} value={c.key}>{c.name}</option>)}
        </select>
      </div>
      <div>
        <label className={labelCls}>Accent Color</label>
        <input type="color" value={config.accent ?? '#136dec'} onChange={e => set('accent', e.target.value)} className="w-full h-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg" />
      </div>
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
          <input type="checkbox" checked={config.showIcon ?? true} onChange={e => set('showIcon', e.target.checked)} className="rounded border-slate-300 text-primary focus:ring-primary" />
          Show icon
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
          <input type="checkbox" checked={config.showDescription ?? true} onChange={e => set('showDescription', e.target.checked)} className="rounded border-slate-300 text-primary focus:ring-primary" />
          Show description
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
          <input type="checkbox" checked={config.showRowCount ?? true} onChange={e => set('showRowCount', e.target.checked)} className="rounded border-slate-300 text-primary focus:ring-primary" />
          Show row count
        </label>
      </div>
    </div>
  );
};

export default OmopTableCardSettings;
export const tableCardDefaults: TableCardConfig = { showIcon: true, showDescription: true, showRowCount: true, accent: '#136dec' };
export function validateTableCardConfig(c: TableCardConfig): string[] {
  return c.tableKey ? [] : ['OMOP table is required.'];
}
