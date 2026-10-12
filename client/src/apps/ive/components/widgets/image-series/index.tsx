import React, { useState } from 'react';
import WidgetFrame from '../WidgetFrame';
import type { WidgetComponentProps } from '../types';
import chestXray from '../../../assets/chest-xray.jpg';
import cardiacMri from '../../../assets/cardiac-mri.jpg';

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

export type ImageSeriesConfig = CohortWidgetConfig;

/**
 * Study viewer placeholder: the bundled sample studies rendered as a small
 * series. Window/level variants are CSS filters until the DICOM pipeline
 * provides real series.
 */
const SLICES = [
  { label: 'XR 1',  src: chestXray,  study: 'CHEST XR',    filter: 'none' },
  { label: 'XR 2',  src: chestXray,  study: 'CHEST XR',    filter: 'brightness(1.3) contrast(1.1)' },
  { label: 'XR 3',  src: chestXray,  study: 'CHEST XR',    filter: 'invert(1) grayscale(1)' },
  { label: 'MRI 1', src: cardiacMri, study: 'CARDIAC MRI', filter: 'none' },
  { label: 'MRI 2', src: cardiacMri, study: 'CARDIAC MRI', filter: 'brightness(1.35) contrast(1.15)' },
  { label: 'MRI 3', src: cardiacMri, study: 'CARDIAC MRI', filter: 'contrast(1.5) brightness(0.85)' },
];

const ImageSeriesWidget: React.FC<WidgetComponentProps<ImageSeriesConfig>> = ({
  title, config: _config, isEditMode, onRemove, onEdit,
}) => {
  const [active, setActive] = useState(0);
  const slice = SLICES[active];

  return (
    <WidgetFrame title={title} isEditMode={isEditMode} onRemove={onRemove} onEdit={onEdit}>
      <div className="p-4 h-full flex flex-col">
        <div className="flex items-center gap-2 mb-3 shrink-0">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-500 text-white">{SLICES.length}</span>
          <span className="text-[10px] text-slate-400 uppercase tracking-widest">sample studies · mock series</span>
        </div>

        <div className="flex-1 min-h-0 flex gap-2">
          {/* min-h keeps the viewer usable when the frame has no height preset (h: 'auto'). */}
          <div className="flex-1 min-w-0 min-h-[280px] rounded-lg bg-black flex items-center justify-center overflow-hidden relative">
            <img
              src={slice.src}
              alt={`${slice.study} ${slice.label}`}
              className="max-w-full max-h-full object-contain"
              style={{ filter: slice.filter }}
            />
            <div className="absolute top-2 left-3 text-amber-300/80 text-[10px] font-mono leading-tight">
              <div>STUDY · {slice.study}</div>
              <div>{slice.label} · {active + 1} / {SLICES.length}</div>
            </div>
          </div>

          {/* Not `block`: a legacy m2d stylesheet hijacks that class into a fixed overlay. */}
          <div className="w-16 shrink-0 overflow-y-auto custom-scrollbar space-y-1.5">
            {SLICES.map((s, i) => (
              <button
                key={s.label}
                type="button"
                onClick={() => setActive(i)}
                className={`w-full h-16 rounded overflow-hidden bg-black border-2 transition-colors ${
                  i === active ? 'border-blue-500' : 'border-transparent hover:border-slate-400'
                }`}
                title={`${s.study} · ${s.label}`}
              >
                <img src={s.src} alt={s.label} className="w-full h-full object-cover" style={{ filter: s.filter }} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </WidgetFrame>
  );
};

export default ImageSeriesWidget;
