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

export interface InterventionConfig extends EndpointConfig {
  personId?: number | string;
  categories?: string[];
  minConfidence?: number;
  maxSuggestions?: number;
  staticSuggestions?: Array<{ title: string; rationale: string; confidence: number; category: string }>;
}

const ALL_CATEGORIES = ['medication', 'lifestyle', 'screening', 'referral', 'monitoring'];
const DATA_SHAPE = {
  '[*].title': 'string',
  '[*].rationale': 'string',
  '[*].confidence': 'number (0-1)',
  '[*].category': 'string',
};

const InterventionSuggestionsSettings: React.FC<WidgetSettingsProps<InterventionConfig>> = ({ config, onChange }) => {
  const set = <K extends keyof InterventionConfig>(k: K, v: InterventionConfig[K]) => onChange({ ...config, [k]: v });
  const source = config.source ?? 'endpoint';
  const categories = config.categories ?? ALL_CATEGORIES;
  const toggle = (c: string) => {
    const s = new Set(categories);
    if (s.has(c)) s.delete(c); else s.add(c);
    set('categories', [...s]);
  };
  const suggestions = config.staticSuggestions ?? [];
  const addSug = () => set('staticSuggestions', [...suggestions, { title: '', rationale: '', confidence: 0.8, category: 'medication' }]);
  const removeSug = (i: number) => set('staticSuggestions', suggestions.filter((_, idx) => idx !== i));
  const updateSug = (i: number, patch: Partial<InterventionConfig['staticSuggestions'][number]>) =>
    set('staticSuggestions', suggestions.map((s, idx) => idx === i ? { ...s, ...patch } : s));

  return (
    <div className="space-y-4">
      <SourceToggle value={source} onChange={v => set('source', v)} />
      <div>
        <label className={labelCls}>Person ID</label>
        <input type="number" value={config.personId ?? ''} onChange={e => set('personId', e.target.value ? Number(e.target.value) : undefined)} className={inputCls} />
      </div>
      {source === 'endpoint' ? (
        <>
          <EndpointFields config={config} onChange={onChange} />
          <DataShape shape={DATA_SHAPE} />
        </>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className={labelCls}>Static Suggestions</label>
            <button type="button" onClick={addSug} className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">add</span>Add
            </button>
          </div>
          <div className="space-y-2">
            {suggestions.map((s, i) => (
              <div key={i} className="border border-slate-200 dark:border-slate-700 rounded-lg p-2 space-y-2 bg-slate-50/40 dark:bg-slate-800/30">
                <input type="text" value={s.title} onChange={e => updateSug(i, { title: e.target.value })} placeholder="title" className={inputCls} />
                <textarea value={s.rationale} onChange={e => updateSug(i, { rationale: e.target.value })} rows={2} placeholder="rationale" className={inputCls} />
                <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
                  <select value={s.category} onChange={e => updateSug(i, { category: e.target.value })} className={inputCls}>
                    {ALL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <input type="number" min={0} max={1} step={0.05} value={s.confidence} onChange={e => updateSug(i, { confidence: Number(e.target.value) })} className={inputCls} />
                  <button type="button" onClick={() => removeSug(i)} className="p-1 text-red-500 hover:text-red-600">
                    <span className="material-symbols-outlined text-base">close</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div>
        <label className={labelCls}>Categories</label>
        <div className="flex flex-wrap gap-2">
          {ALL_CATEGORIES.map(c => {
            const on = categories.includes(c);
            return (
              <button key={c} type="button" onClick={() => toggle(c)} className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${on ? 'bg-primary text-white border-primary' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'}`}>{c}</button>
            );
          })}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={labelCls}>Min Confidence</label>
          <input type="number" min={0} max={1} step={0.05} value={config.minConfidence ?? 0.5} onChange={e => set('minConfidence', Number(e.target.value))} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Max Suggestions</label>
          <input type="number" min={1} value={config.maxSuggestions ?? 5} onChange={e => set('maxSuggestions', Number(e.target.value))} className={inputCls} />
        </div>
      </div>
    </div>
  );
};

export default InterventionSuggestionsSettings;
export const interventionDefaults: InterventionConfig = { source: 'endpoint', categories: ALL_CATEGORIES, minConfidence: 0.5, maxSuggestions: 5, staticSuggestions: [] };
export const validateInterventionConfig = validateEndpoint;
