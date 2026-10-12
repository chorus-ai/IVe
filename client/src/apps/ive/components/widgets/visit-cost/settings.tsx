import React from 'react';
import type { WidgetSettingsProps } from '../types';

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

export interface VisitCostConfig extends EndpointConfig {
  visitId?: number | string;
  personId?: number | string;
  currency?: string;
  breakdown?: 'category' | 'department' | 'cpt';
  showInsuranceSplit?: boolean;
  staticTotal?: number;
  staticPaid?: number;
}

const DATA_SHAPE = {
  total: 'number',
  paid: 'number',
  outstanding: 'number',
  '[*].category': 'string',
  '[*].amount': 'number',
};

const VisitCostSettings: React.FC<WidgetSettingsProps<VisitCostConfig>> = ({ config, onChange }) => {
  const set = <K extends keyof VisitCostConfig>(k: K, v: VisitCostConfig[K]) => onChange({ ...config, [k]: v });
  const source = config.source ?? 'endpoint';
  return (
    <div className="space-y-4">
      <SourceToggle value={source} onChange={v => set('source', v)} />
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={labelCls}>Visit ID</label>
          <input type="number" value={config.visitId ?? ''} onChange={e => set('visitId', e.target.value ? Number(e.target.value) : undefined)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Person ID</label>
          <input type="number" value={config.personId ?? ''} onChange={e => set('personId', e.target.value ? Number(e.target.value) : undefined)} className={inputCls} />
        </div>
      </div>
      {source === 'endpoint' ? (
        <>
          <EndpointFields config={config} onChange={onChange} />
          <DataShape shape={DATA_SHAPE} />
        </>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelCls}>Total</label>
            <input type="number" min={0} value={config.staticTotal ?? ''} onChange={e => set('staticTotal', e.target.value ? Number(e.target.value) : undefined)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Paid</label>
            <input type="number" min={0} value={config.staticPaid ?? ''} onChange={e => set('staticPaid', e.target.value ? Number(e.target.value) : undefined)} className={inputCls} />
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={labelCls}>Currency</label>
          <select value={config.currency ?? 'USD'} onChange={e => set('currency', e.target.value)} className={inputCls}>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
            <option value="JPY">JPY</option>
            <option value="MNT">MNT</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Breakdown</label>
          <select value={config.breakdown ?? 'category'} onChange={e => set('breakdown', e.target.value as VisitCostConfig['breakdown'])} className={inputCls}>
            <option value="category">Category</option>
            <option value="department">Department</option>
            <option value="cpt">CPT Code</option>
          </select>
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
        <input type="checkbox" checked={config.showInsuranceSplit ?? true} onChange={e => set('showInsuranceSplit', e.target.checked)} className="rounded border-slate-300 text-primary focus:ring-primary" />
        Show insurance vs patient split
      </label>
    </div>
  );
};

export default VisitCostSettings;
export const visitCostDefaults: VisitCostConfig = { source: 'endpoint', currency: 'USD', breakdown: 'category', showInsuranceSplit: true };
export function validateVisitCostConfig(c: VisitCostConfig): string[] {
  const errors = validateEndpoint(c);
  if ((c.source ?? 'endpoint') === 'static' && c.staticPaid != null && c.staticTotal != null && c.staticPaid > c.staticTotal) {
    errors.push('Paid cannot exceed total.');
  }
  return errors;
}
