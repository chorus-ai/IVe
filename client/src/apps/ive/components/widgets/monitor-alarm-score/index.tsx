import React, { useMemo, useState } from 'react';
import WidgetFrame from '../WidgetFrame';
import type { WidgetComponentProps } from '../types';
import { CohortWidgetConfig, personOf, DEFAULT_START_DATE } from './settings';
import { buildAxis, genEvents, mulberry32, seedFrom } from './mockSeries';

export interface AlarmScoreConfig extends CohortWidgetConfig {
  /** Scores at or above this render on the trigger strip. */
  threshold?: number;
  /** Approximate number of score events in the window. */
  eventCount?: number;
}

interface ScoreEvent {
  frac: number;
  score: number;
}

const AlarmScoreWidget: React.FC<WidgetComponentProps<AlarmScoreConfig>> = ({
  title, config, isEditMode, onRemove, onEdit,
}) => {
  const personId = personOf(config);
  const threshold = config.threshold ?? 50;
  const eventCount = config.eventCount ?? 260;
  const axis = useMemo(
    () => buildAxis(config.startDate ?? DEFAULT_START_DATE),
    [config.startDate],
  );

  const events = useMemo<ScoreEvent[]>(() => {
    const rand = mulberry32(seedFrom('alarm_score', personId));
    return genEvents(rand, eventCount).map((frac) => ({
      frac,
      score: Math.round(20 + rand() * 80),
    }));
  }, [personId, eventCount]);

  const [selected, setSelected] = useState<ScoreEvent | null>(null);
  const above = events.filter((e) => e.score >= threshold);
  const below = events.filter((e) => e.score < threshold);
  const current = selected ?? above[above.length - 1] ?? events[events.length - 1];

  const fmtEventTime = (frac: number) => {
    const d = new Date(axis.startTs + frac * (axis.endTs - axis.startTs));
    const pad = (n: number) => String(n).padStart(2, '0');
    const ampm = d.getHours() < 12 ? 'am' : 'pm';
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())} ${ampm}`;
  };

  const strip = (items: ScoreEvent[], color: string) => (
    <div className="relative h-9 rounded bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
      {items.map((e, i) => (
        <button
          key={i}
          type="button"
          onClick={() => setSelected(e)}
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full hover:scale-[2] transition-transform"
          style={{ left: `${e.frac * 100}%`, backgroundColor: color }}
          title={`Score ${e.score} · ${fmtEventTime(e.frac)}`}
        />
      ))}
    </div>
  );

  return (
    <WidgetFrame title={title} isEditMode={isEditMode} onRemove={onRemove} onEdit={onEdit}>
      <div className="p-4 flex gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white">{events.length}</span>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest">
              score events · trigger ≥ {threshold} · mock data
            </span>
          </div>
          <div className="space-y-2">
            {strip(above, '#3b82f6')}
            {strip(below, '#cbd5e1')}
          </div>
          <div className="relative h-4 mt-1">
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

        <div className="w-44 shrink-0 flex flex-col items-stretch gap-2 justify-center">
          <div className="rounded-lg bg-blue-600 text-white text-center py-3 px-2 shadow-sm">
            <span className="text-2xl font-extrabold tracking-tight">
              Score: {current ? current.score : '—'}
            </span>
          </div>
          <div className="rounded-lg border border-blue-300 dark:border-blue-800 text-blue-600 dark:text-blue-300 text-center text-[11px] font-mono py-1.5 px-2">
            {current ? fmtEventTime(current.frac) : '—'}
          </div>
        </div>
      </div>
    </WidgetFrame>
  );
};

export default AlarmScoreWidget;
