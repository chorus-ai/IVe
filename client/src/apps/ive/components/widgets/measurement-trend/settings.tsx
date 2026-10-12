import React from 'react';
import type { WidgetSettingsProps } from '../types';
import RequestTemplateSection from './RequestTemplateSection';
import type { MeasurementTrendConfig } from './index';

/**
 * Shared config + settings primitives for the person-scoped (subject) OMOP
 * widgets. These widgets query the OMOP endpoints (`/api/omop/<table>`)
 * internally; the config only carries the domain parameters (Person ID,
 * date range, table…) that scope those queries.
 */

export interface CohortWidgetConfig {
  personId?: number | string;
  startDate?: string;
  endDate?: string;
  table?: string;
  conceptCol?: string;
  color?: string;
  topN?: number;
  limit?: number;
}

// Defaults mirror the first record of the sample cohort so the widgets render
// out of the box; the per-widget settings panel overrides these.
export const DEFAULT_PERSON_ID = 4009;
export const DEFAULT_START_DATE = '2020-03-14';
export const DEFAULT_END_DATE = '2020-04-13';

export const personOf = (config?: CohortWidgetConfig) =>
  config?.personId ?? DEFAULT_PERSON_ID;

interface Props {
  config: CohortWidgetConfig;
  onChange: (next: CohortWidgetConfig) => void;
}

export const setter =
  <C extends CohortWidgetConfig>(config: C, onChange: (n: C) => void) =>
  <K extends keyof C>(k: K, v: C[K]) =>
    onChange({ ...config, [k]: v });

export const PersonIdField: React.FC<Props> = ({ config, onChange }) => {
  const set = setter(config, onChange);
  return (
    <div>
      <label className={labelCls}>Person ID</label>
      <input
        type="number"
        value={config.personId ?? ''}
        onChange={(e) => set('personId', e.target.value ? Number(e.target.value) : undefined)}
        className={inputCls}
        placeholder="e.g. 4009"
      />
    </div>
  );
};

export const requirePerson = (c: CohortWidgetConfig): string[] =>
  c.personId == null || c.personId === '' ? ['Person ID is required.'] : [];

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

const MeasurementTrendSettings: React.FC<WidgetSettingsProps<MeasurementTrendConfig>> = ({ config, onChange }) => {
  const set = <K extends keyof MeasurementTrendConfig>(k: K, v: MeasurementTrendConfig[K]) =>
    onChange({ ...config, [k]: v });

  return (
    <div className="space-y-4">
      <PersonIdField config={config} onChange={onChange} />
      <div>
        <label className={labelCls}>Measurement Concept IDs</label>
        <input
          type="text"
          value={config.conceptIds ?? ''}
          onChange={(e) => set('conceptIds', e.target.value || undefined)}
          placeholder="e.g. 3018405, 3047181 (comma-separated)"
          className={`${inputCls} font-mono`}
        />
      </div>
      <div>
        <label className={labelCls}>Or Source Value Contains</label>
        <input
          type="text"
          value={config.sourceValue ?? ''}
          onChange={(e) => set('sourceValue', e.target.value || undefined)}
          placeholder="e.g. Lactate (used when no concept IDs)"
          className={inputCls}
        />
      </div>
      <div className="grid grid-cols-[1fr_120px] gap-2">
        <div>
          <label className={labelCls}>Max Points</label>
          <input
            type="number"
            min={2}
            value={config.limit ?? 100}
            onChange={(e) => set('limit', Number(e.target.value))}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Color</label>
          <input
            type="color"
            value={config.color ?? '#136dec'}
            onChange={(e) => set('color', e.target.value)}
            className={`${inputCls} h-[38px] p-1`}
          />
        </div>
      </div>

      <RequestTemplateSection
        request={config.request}
        onChange={(next) => set('request', next)}
        placeholders={['personId', 'conceptIds (number[])', 'sourceValue']}
        endpointPlaceholder="/api/omop/measurement/search?page=1&pageSize=0"
        bodyPlaceholder='{ "person_id": {{personId}}, "measurement_concept_id": {{conceptIds}} }'
      />
    </div>
  );
};

export default MeasurementTrendSettings;
