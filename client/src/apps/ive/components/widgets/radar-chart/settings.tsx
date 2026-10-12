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

export interface RadarAxis { label: string; max?: number; }

export interface RadarConfig extends EndpointConfig {
  axes?: RadarAxis[];
  staticValues?: number[];
  color?: string;
  fillOpacity?: number;
  scale?: 'linear' | 'log';
}

const DATA_SHAPE = {
  '[*].axis': 'string (matches axes[].label)',
  '[*].value': 'number',
};

const RadarChartSettings: React.FC<WidgetSettingsProps<RadarConfig>> = ({ config, onChange }) => {
  const set = <K extends keyof RadarConfig>(k: K, v: RadarConfig[K]) => onChange({ ...config, [k]: v });
  const source = config.source ?? 'static';
  const axes = config.axes ?? [];
  const values = config.staticValues ?? [];

  const updateAxis = (i: number, patch: Partial<RadarAxis>) => set('axes', axes.map((a, idx) => idx === i ? { ...a, ...patch } : a));
  const addAxis = () => {
    set('axes', [...axes, { label: '', max: 100 }]);
    set('staticValues', [...values, 0]);
  };
  const removeAxis = (i: number) => {
    set('axes', axes.filter((_, idx) => idx !== i));
    set('staticValues', values.filter((_, idx) => idx !== i));
  };
  const updateValue = (i: number, v: number) => set('staticValues', values.map((x, idx) => idx === i ? v : x));

  return (
    <div className="space-y-4">
      <SourceToggle value={source} onChange={v => set('source', v)} />
      {source === 'endpoint' && (
        <>
          <EndpointFields config={config} onChange={onChange} />
          <DataShape shape={DATA_SHAPE} />
        </>
      )}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className={labelCls}>Axes</label>
          <button type="button" onClick={addAxis} className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">add</span>Add Axis
          </button>
        </div>
        <div className="space-y-2">
          {axes.map((a, i) => (
            <div key={i} className="grid grid-cols-[1fr_80px_80px_auto] gap-2 items-center">
              <input type="text" value={a.label} onChange={e => updateAxis(i, { label: e.target.value })} placeholder="label" className={inputCls} />
              <input type="number" value={a.max ?? ''} onChange={e => updateAxis(i, { max: Number(e.target.value) })} placeholder="max" className={inputCls} />
              {source === 'static' ? (
                <input type="number" value={values[i] ?? 0} onChange={e => updateValue(i, Number(e.target.value))} placeholder="value" className={inputCls} />
              ) : <span />}
              <button type="button" onClick={() => removeAxis(i)} className="p-1 text-red-500 hover:text-red-600">
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={labelCls}>Color</label>
          <input type="color" value={config.color ?? '#136dec'} onChange={e => set('color', e.target.value)} className="w-full h-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg" />
        </div>
        <div>
          <label className={labelCls}>Fill Opacity</label>
          <input type="number" min={0} max={1} step={0.05} value={config.fillOpacity ?? 0.3} onChange={e => set('fillOpacity', Number(e.target.value))} className={inputCls} />
        </div>
      </div>
      <div>
        <label className={labelCls}>Scale</label>
        <select value={config.scale ?? 'linear'} onChange={e => set('scale', e.target.value as 'linear' | 'log')} className={inputCls}>
          <option value="linear">Linear</option>
          <option value="log">Logarithmic</option>
        </select>
      </div>
    </div>
  );
};

export default RadarChartSettings;
export const radarDefaults: RadarConfig = { source: 'static', axes: [], staticValues: [], color: '#136dec', fillOpacity: 0.3, scale: 'linear' };
export function validateRadarConfig(c: RadarConfig): string[] {
  const errors = validateEndpoint(c);
  if (!c.axes || c.axes.length < 3) errors.push('At least 3 axes are required.');
  c.axes?.forEach((a, i) => { if (!a.label) errors.push(`Axis ${i + 1} label is required.`); });
  return errors;
}
