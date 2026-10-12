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

export interface MedAdherenceConfig extends EndpointConfig {
  personId?: number | string;
  drugConceptIds?: string;
  metric?: 'pdc' | 'mpr' | 'gap_days';
  thresholdGood?: number;
  thresholdWarn?: number;
  windowDays?: number;
}

const DATA_SHAPE = {
  '[*].drug_name': 'string',
  '[*].drug_concept_id': 'number',
  '[*].adherence': 'number (0-1)',
  '[*].gap_days': 'number',
};

const MedicationAdherenceSettings: React.FC<WidgetSettingsProps<MedAdherenceConfig>> = ({ config, onChange }) => {
  const set = <K extends keyof MedAdherenceConfig>(k: K, v: MedAdherenceConfig[K]) => onChange({ ...config, [k]: v });
  const source = config.source ?? 'endpoint';
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
        <label className={labelCls}>Drug Concept IDs (comma separated)</label>
        <input type="text" value={config.drugConceptIds ?? ''} onChange={e => set('drugConceptIds', e.target.value)} placeholder="1503297, 1308216" className={`${inputCls} font-mono`} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={labelCls}>Metric</label>
          <select value={config.metric ?? 'pdc'} onChange={e => set('metric', e.target.value as MedAdherenceConfig['metric'])} className={inputCls}>
            <option value="pdc">PDC (Proportion of Days Covered)</option>
            <option value="mpr">MPR (Medication Possession Ratio)</option>
            <option value="gap_days">Gap Days</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Window (days)</label>
          <input type="number" min={1} value={config.windowDays ?? 365} onChange={e => set('windowDays', Number(e.target.value))} className={inputCls} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={labelCls}>Good Threshold</label>
          <input type="number" min={0} max={1} step={0.05} value={config.thresholdGood ?? 0.8} onChange={e => set('thresholdGood', Number(e.target.value))} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Warn Threshold</label>
          <input type="number" min={0} max={1} step={0.05} value={config.thresholdWarn ?? 0.6} onChange={e => set('thresholdWarn', Number(e.target.value))} className={inputCls} />
        </div>
      </div>
    </div>
  );
};

export default MedicationAdherenceSettings;
export const medAdherenceDefaults: MedAdherenceConfig = { source: 'endpoint', metric: 'pdc', thresholdGood: 0.8, thresholdWarn: 0.6, windowDays: 365 };
export function validateMedAdherenceConfig(c: MedAdherenceConfig): string[] {
  const errors = validateEndpoint(c);
  if (c.thresholdGood != null && c.thresholdWarn != null && c.thresholdWarn >= c.thresholdGood) {
    errors.push('Warn threshold must be lower than good threshold.');
  }
  return errors;
}
