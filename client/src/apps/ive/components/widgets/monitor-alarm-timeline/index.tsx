import React, { useMemo } from 'react';
import WidgetFrame from '../WidgetFrame';
import type { WidgetComponentProps } from '../types';
import { CohortWidgetConfig, personOf, DEFAULT_START_DATE } from './settings';
import { buildAxis, genEvents, mulberry32, seedFrom } from './mockSeries';

export type AlarmTimelineConfig = CohortWidgetConfig;

/** Bedside-monitor alarm channels, roughly at SuperAlarm demo densities. */
const ALARM_ROWS = [
  { key: 'trigeminy', label: 'Trigeminy', count: 1,   color: '#f59e0b' },
  { key: 'couplet',   label: 'Couplet',   count: 2,   color: '#f59e0b' },
  { key: 'silenced',  label: 'Silenced',  count: 6,   color: '#f59e0b' },
  { key: 'artifact',  label: 'Artifact',  count: 59,  color: '#f59e0b' },
  { key: 'pvc',       label: 'PVC',       count: 89,  color: '#f59e0b' },
  { key: 'resp',      label: 'RESP',      count: 174, color: '#3b82f6' },
  { key: 'apnea',     label: 'APNEA',     count: 58,  color: '#f59e0b' },
];

const SEVERITY_CHIPS = [
  { label: 'crisis',   color: 'bg-red-500' },
  { label: 'warning',  color: 'bg-blue-500' },
  { label: 'advisory', color: 'bg-emerald-500' },
];

const AlarmTimelineWidget: React.FC<WidgetComponentProps<AlarmTimelineConfig>> = ({
  title, config, isEditMode, onRemove, onEdit,
}) => {
  const personId = personOf(config);
  const axis = useMemo(
    () => buildAxis(config.startDate ?? DEFAULT_START_DATE),
    [config.startDate],
  );

  const rows = useMemo(
    () => ALARM_ROWS.map((row) => {
      const rand = mulberry32(seedFrom('alarm_timeline', personId, row.key));
      return { ...row, events: genEvents(rand, row.count) };
    }),
    [personId],
  );

  const total = rows.reduce((sum, r) => sum + r.count, 0);

  return (
    <WidgetFrame title={title} isEditMode={isEditMode} onRemove={onRemove} onEdit={onEdit}>
      <div className="p-4">
        <div className="flex items-center gap-1.5 mb-3">
          {SEVERITY_CHIPS.map((c) => (
            <span key={c.label} title={c.label} className={`text-[10px] font-bold px-2 py-0.5 rounded text-white ${c.color}`}>
              0
            </span>
          ))}
          <span title="technical" className="text-[10px] font-bold px-2 py-0.5 rounded text-white bg-amber-400">
            {total}
          </span>
          <span className="text-[10px] text-slate-400 uppercase tracking-widest ml-2">mock data</span>
        </div>

        <div className="space-y-1.5">
          {rows.map((row) => (
            <div key={row.key} className="flex items-center gap-3">
              <div className="relative flex-1 h-7 rounded bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                {row.events.map((frac, i) => (
                  <span
                    key={i}
                    className="absolute top-1 bottom-1 w-[3px] rounded-sm -translate-x-1/2"
                    style={{ left: `${frac * 100}%`, backgroundColor: row.color }}
                  />
                ))}
              </div>
              <div className="w-24 shrink-0 flex items-center justify-between gap-1">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">{row.label}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                  {row.count}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="relative h-4 mt-1 mr-[108px]">
          {axis.ticks.map((t) => (
            <span
              key={t.ts}
              className="absolute -translate-x-1/2 text-[9px] text-slate-400 dark:text-slate-500 whitespace-nowrap"
              style={{ left: `${t.frac * 100}%` }}
            >
              {t.label}
            </span>
          ))}
        </div>
      </div>
    </WidgetFrame>
  );
};

export default AlarmTimelineWidget;
