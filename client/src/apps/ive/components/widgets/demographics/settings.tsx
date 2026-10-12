import React from 'react';
import type { WidgetSettingsProps } from '../types';
import type { DemographicsConfig } from './index';

const inputCls =
  'w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 outline-none';
const labelCls = 'text-xs font-bold text-slate-500 uppercase tracking-wider mb-1';

/** Matches DemographicsData in ./index.tsx. */
const DATA_SHAPE = {
  'gender[]': '{ label: string, percentage: number }',
  avgAge: 'number',
  total: 'number',
};

const DemographicsSettings: React.FC<WidgetSettingsProps<DemographicsConfig>> = ({ config, onChange }) => {
  const set = <K extends keyof DemographicsConfig>(k: K, v: DemographicsConfig[K]) =>
    onChange({ ...config, [k]: v });
  const source = config.source ?? 'static';
  const showSummary = config.showSummary !== false;

  return (
    <div className="space-y-4">
      <div>
        <label className={labelCls}>Source</label>
        <div className="flex gap-2">
          {([
            { val: 'static' as const, label: 'Sample Data' },
            { val: 'endpoint' as const, label: 'Endpoint' },
          ]).map((opt) => (
            <button
              key={opt.val}
              type="button"
              onClick={() => set('source', opt.val)}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-bold border transition-colors ${
                source === opt.val
                  ? 'bg-primary text-white border-primary'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-primary/40'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {source === 'endpoint' && (
        <>
          <div className="grid grid-cols-[100px_1fr] gap-2">
            <div>
              <label className={labelCls}>Method</label>
              <select
                value={config.method ?? 'GET'}
                onChange={(e) => set('method', e.target.value as 'GET' | 'POST')}
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
                onChange={(e) => set('endpoint', e.target.value)}
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
                onChange={(e) => set('body', e.target.value)}
                className={`${inputCls} font-mono`}
              />
            </div>
          )}
          <details className="text-xs text-slate-500 dark:text-slate-400">
            <summary className="cursor-pointer font-bold uppercase tracking-wider">Expected response</summary>
            <pre className="mt-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg overflow-x-auto">
{JSON.stringify(DATA_SHAPE, null, 2)}
            </pre>
          </details>
        </>
      )}

      <div>
        <label className={labelCls}>Display</label>
        <button
          type="button"
          onClick={() => set('showSummary', !showSummary)}
          className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
            showSummary
              ? 'bg-primary text-white border-primary'
              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
          }`}
        >
          Avg Age / Total footer
        </button>
      </div>
    </div>
  );
};

export default DemographicsSettings;
