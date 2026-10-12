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

export interface TimelineConfig extends EndpointConfig {
  personId?: number | string;
  eventTypes?: string[];
  rangeStart?: string;
  rangeEnd?: string;
  density?: 'compact' | 'comfortable';
  showMilestones?: boolean;
}

const EVENT_TYPES = ['visit', 'condition', 'drug', 'procedure', 'measurement', 'observation', 'note'];

const DATA_SHAPE = {
  '[*].event_type': 'string',
  '[*].date': 'date',
  '[*].label': 'string',
  '[*].value': 'string | number',
};

const TimelineSummarySettings: React.FC<WidgetSettingsProps<TimelineConfig>> = ({ config, onChange }) => {
  const set = <K extends keyof TimelineConfig>(k: K, v: TimelineConfig[K]) => onChange({ ...config, [k]: v });
  const source = config.source ?? 'endpoint';
  const types = config.eventTypes ?? EVENT_TYPES;
  const toggle = (t: string) => {
    const s = new Set(types);
    if (s.has(t)) s.delete(t); else s.add(t);
    set('eventTypes', [...s]);
  };
  return (
    <div className="space-y-4">
      <SourceToggle value={source} onChange={v => set('source', v)} />
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
      <div>
        <label className={labelCls}>Event Types</label>
        <div className="flex flex-wrap gap-2">
          {EVENT_TYPES.map(t => {
            const on = types.includes(t);
            return (
              <button key={t} type="button" onClick={() => toggle(t)} className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${on ? 'bg-primary text-white border-primary' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'}`}>{t}</button>
            );
          })}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={labelCls}>Range Start</label>
          <input type="date" value={config.rangeStart ?? ''} onChange={e => set('rangeStart', e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Range End</label>
          <input type="date" value={config.rangeEnd ?? ''} onChange={e => set('rangeEnd', e.target.value)} className={inputCls} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 items-end">
        <div>
          <label className={labelCls}>Density</label>
          <select value={config.density ?? 'comfortable'} onChange={e => set('density', e.target.value as TimelineConfig['density'])} className={inputCls}>
            <option value="comfortable">Comfortable</option>
            <option value="compact">Compact</option>
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
          <input type="checkbox" checked={config.showMilestones ?? true} onChange={e => set('showMilestones', e.target.checked)} className="rounded border-slate-300 text-primary focus:ring-primary" />
          Show milestones
        </label>
      </div>
    </div>
  );
};

export default TimelineSummarySettings;
export const timelineDefaults: TimelineConfig = { source: 'endpoint', eventTypes: EVENT_TYPES, density: 'comfortable', showMilestones: true };
export function validateTimelineConfig(c: TimelineConfig): string[] {
  const errors = validateEndpoint(c);
  if (c.rangeStart && c.rangeEnd && c.rangeStart > c.rangeEnd) errors.push('Range start must be before end.');
  return errors;
}
