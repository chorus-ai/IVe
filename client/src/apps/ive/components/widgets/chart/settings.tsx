import React from 'react';
import type { WidgetSettingsProps } from '../types';
import type { ChartType } from './index';

export interface GenericChartConfig {
  endpoint?: string;
  method?: 'GET' | 'POST';
  body?: string;
  xField?: string;
  yField?: string;
  seriesField?: string;
  orientation?: 'vertical' | 'horizontal';
  smoothing?: 'none' | 'linear' | 'spline';
  color?: string;
  showGrid?: boolean;
  showLegend?: boolean;
  topN?: number;
  yMin?: number;
  yMax?: number;
}

export const GENERIC_CHART_DATA_SHAPE = {
  // Array of rows. xField/yField/seriesField pick which keys to use.
  '[*].<xField>': 'string | number | date',
  '[*].<yField>': 'number',
  '[*].<seriesField?>': 'string',
} as const;

const inputCls =
  'w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 outline-none';
const labelCls = 'text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 ';

const GenericChartSettings: React.FC<WidgetSettingsProps<GenericChartConfig>> = ({ config, onChange, widgetType }) => {
  const set = <K extends keyof GenericChartConfig>(k: K, v: GenericChartConfig[K]) =>
    onChange({ ...config, [k]: v });

  const chartType = widgetType as ChartType;
  const isLine = chartType === 'line_chart';
  const isBar = chartType === 'bar_chart';
  const isPie = chartType === 'pie_chart';

  return (
    <div className="space-y-4">
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

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={labelCls}>{isPie ? 'Label Field' : 'X Field'}</label>
          <input
            type="text"
            value={config.xField ?? ''}
            onChange={e => set('xField', e.target.value)}
            placeholder={isLine ? 'timestamp' : 'label'}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>{isPie ? 'Value Field' : 'Y Field'}</label>
          <input
            type="text"
            value={config.yField ?? ''}
            onChange={e => set('yField', e.target.value)}
            placeholder="value"
            className={inputCls}
          />
        </div>
      </div>

      {(isLine || isBar) && (
        <div>
          <label className={labelCls}>Series Group By (optional)</label>
          <input
            type="text"
            value={config.seriesField ?? ''}
            onChange={e => set('seriesField', e.target.value)}
            placeholder="category"
            className={inputCls}
          />
        </div>
      )}

      {isBar && (
        <div>
          <label className={labelCls}>Orientation</label>
          <select
            value={config.orientation ?? 'vertical'}
            onChange={e => set('orientation', e.target.value as 'vertical' | 'horizontal')}
            className={inputCls}
          >
            <option value="vertical">Vertical</option>
            <option value="horizontal">Horizontal</option>
          </select>
        </div>
      )}

      {isLine && (
        <div>
          <label className={labelCls}>Smoothing</label>
          <select
            value={config.smoothing ?? 'linear'}
            onChange={e => set('smoothing', e.target.value as GenericChartConfig['smoothing'])}
            className={inputCls}
          >
            <option value="none">None</option>
            <option value="linear">Linear</option>
            <option value="spline">Spline</option>
          </select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={labelCls}>Color</label>
          <input
            type="color"
            value={config.color ?? '#136dec'}
            onChange={e => set('color', e.target.value)}
            className="w-full h-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
          />
        </div>
        <div>
          <label className={labelCls}>Top N</label>
          <input
            type="number"
            min={1}
            value={config.topN ?? ''}
            onChange={e => set('topN', e.target.value ? Number(e.target.value) : undefined)}
            placeholder="10"
            className={inputCls}
          />
        </div>
      </div>

      {(isLine || isBar) && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelCls}>Y Min</label>
            <input
              type="number"
              value={config.yMin ?? ''}
              onChange={e => set('yMin', e.target.value ? Number(e.target.value) : undefined)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Y Max</label>
            <input
              type="number"
              value={config.yMax ?? ''}
              onChange={e => set('yMax', e.target.value ? Number(e.target.value) : undefined)}
              className={inputCls}
            />
          </div>
        </div>
      )}

      <div className="flex items-center gap-4">
        {!isPie && (
          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={config.showGrid ?? true}
              onChange={e => set('showGrid', e.target.checked)}
              className="rounded border-slate-300 text-primary focus:ring-primary"
            />
            Show Grid
          </label>
        )}
        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            checked={config.showLegend ?? true}
            onChange={e => set('showLegend', e.target.checked)}
            className="rounded border-slate-300 text-primary focus:ring-primary"
          />
          Show Legend
        </label>
      </div>

      <details className="text-xs text-slate-500 dark:text-slate-400">
        <summary className="cursor-pointer font-bold uppercase tracking-wider">Required data shape</summary>
        <pre className="mt-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg overflow-x-auto">
{JSON.stringify(GENERIC_CHART_DATA_SHAPE, null, 2)}
        </pre>
      </details>
    </div>
  );
};

export default GenericChartSettings;

export const genericChartDefaults: GenericChartConfig = {
  method: 'GET',
  xField: 'label',
  yField: 'value',
  color: '#136dec',
  showGrid: true,
  showLegend: true,
};

export function validateGenericChartConfig(c: GenericChartConfig): string[] {
  const errors: string[] = [];
  if (!c.endpoint) errors.push('Endpoint is required.');
  if (!c.xField) errors.push('X / Label field is required.');
  if (!c.yField) errors.push('Y / Value field is required.');
  if (c.yMin != null && c.yMax != null && c.yMin >= c.yMax) errors.push('Y Min must be less than Y Max.');
  return errors;
}
