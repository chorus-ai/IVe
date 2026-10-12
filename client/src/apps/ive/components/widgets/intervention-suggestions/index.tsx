import React, { useMemo, useState } from 'react';
import WidgetFrame from '../WidgetFrame';
import type { WidgetComponentProps } from '../types';
import type { InterventionConfig } from './settings';

type RiskAxis = 'Death' | 'Resp. failure' | 'AKI' | 'Sepsis';

interface Suggestion {
  id: string;
  action: string;
  rationale: string;
  confidence: number; // 0..1
  /** Δrisk per axis in absolute percentage points; negative = risk reduction. */
  deltas: Record<RiskAxis, number>;
  contraindications?: string[];
}

const SUGGESTIONS: Suggestion[] = [
  {
    id: 's1',
    action: 'Start norepinephrine 0.05 µg/kg/min',
    rationale: 'MAP < 65 mmHg for 18 min despite 30 mL/kg crystalloid; lactate trending up.',
    confidence: 0.82,
    deltas: { Death: -8, 'Resp. failure': -2, AKI: -6, Sepsis: -3 },
    contraindications: ['HR > 130'],
  },
  {
    id: 's2',
    action: 'Increase PEEP 8 → 12 cmH₂O',
    rationale: 'PaO₂/FiO₂ 180 with rising A-a gradient; FiO₂ already 0.6.',
    confidence: 0.71,
    deltas: { Death: -3, 'Resp. failure': -11, AKI: 0, Sepsis: 0 },
  },
  {
    id: 's3',
    action: 'Broaden to meropenem',
    rationale: 'Persistent fever, lactate ↑, recent abdominal source; ceftriaxone trough adequate but no response.',
    confidence: 0.66,
    deltas: { Death: -5, 'Resp. failure': -1, AKI: -1, Sepsis: -9 },
    contraindications: ['Penicillin anaphylaxis'],
  },
  {
    id: 's4',
    action: 'Hold furosemide; recheck Cr in 2h',
    rationale: 'Cr 1.4 → 1.9 over 6h, urine output 0.3 mL/kg/h.',
    confidence: 0.58,
    deltas: { Death: -1, 'Resp. failure': +1, AKI: -7, Sepsis: 0 },
  },
];

const fmtPct = (n: number) => `${n > 0 ? '+' : ''}${n}%`;

const DeltaBar: React.FC<{ axis: string; value: number }> = ({ axis, value }) => {
  const pct = Math.min(20, Math.abs(value)) / 20; // cap visual at ±20pp
  const isReduction = value < 0;
  return (
    <div className="flex items-center gap-2 text-[10px]">
      <span className="w-20 shrink-0 text-slate-500 dark:text-slate-400">{axis}</span>
      <div className="relative h-1.5 flex-1 rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          className={`absolute top-0 h-full rounded-full ${
            isReduction ? 'right-1/2 bg-emerald-500' : 'left-1/2 bg-red-500'
          }`}
          style={{ width: `${pct * 50}%` }}
        />
        <div className="absolute left-1/2 top-[-2px] h-2 w-px bg-slate-300 dark:bg-slate-700" />
      </div>
      <span
        className={`w-10 shrink-0 text-right font-mono tabular-nums ${
          isReduction
            ? 'text-emerald-600 dark:text-emerald-400'
            : value > 0
            ? 'text-red-600 dark:text-red-400'
            : 'text-slate-400'
        }`}
      >
        {fmtPct(value)}
      </span>
    </div>
  );
};

type Status = 'pending' | 'accepted' | 'dismissed';

const InterventionSuggestionsWidget: React.FC<WidgetComponentProps<InterventionConfig>> = ({ title, isEditMode, onRemove, onEdit }) => {
  const [statuses, setStatuses] = useState<Record<string, Status>>({});

  const ranked = useMemo(
    () =>
      [...SUGGESTIONS].sort((a, b) => {
        const benefit = (s: Suggestion) =>
          Object.values(s.deltas).reduce((acc, v) => acc + Math.max(0, -v), 0) * s.confidence;
        return benefit(b) - benefit(a);
      }),
    [],
  );

  const update = (id: string, status: Status) =>
    setStatuses((prev) => ({ ...prev, [id]: status }));

  const summary = ranked.reduce(
    (acc, s) => {
      const st = statuses[s.id] ?? 'pending';
      acc[st] = (acc[st] ?? 0) + 1;
      return acc;
    },
    { pending: 0, accepted: 0, dismissed: 0 } as Record<Status, number>,
  );

  return (
    <WidgetFrame title={title} isEditMode={isEditMode} onRemove={onRemove} onEdit={onEdit}>
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2 text-[10px] font-medium uppercase tracking-widest text-slate-400 dark:border-slate-800">
          <span>Ranked by expected benefit · next 2–6h</span>
          <span className="font-mono">
            {summary.pending} pending · {summary.accepted} accepted · {summary.dismissed} dismissed
          </span>
        </div>
        <div className="custom-scrollbar flex-1 overflow-y-auto p-3 space-y-3">
          {ranked.map((s) => {
            const status = statuses[s.id] ?? 'pending';
            const isResolved = status !== 'pending';
            return (
              <div
                key={s.id}
                className={`rounded-lg border p-3 transition-opacity ${
                  isResolved ? 'opacity-60' : ''
                } ${
                  status === 'accepted'
                    ? 'border-emerald-300 bg-emerald-50/50 dark:border-emerald-900/60 dark:bg-emerald-900/10'
                    : status === 'dismissed'
                    ? 'border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/40'
                    : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                        {s.action}
                      </span>
                      <span className="rounded-full border border-primary/30 bg-primary/5 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-primary">
                        {Math.round(s.confidence * 100)}% conf
                      </span>
                      {status !== 'pending' && (
                        <span
                          className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest ${
                            status === 'accepted'
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                              : 'bg-slate-500/15 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {status}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                      {s.rationale}
                    </p>
                    {s.contraindications && s.contraindications.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {s.contraindications.map((c) => (
                          <span
                            key={c}
                            className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[9px] font-medium text-amber-700 dark:border-amber-900/60 dark:bg-amber-900/20 dark:text-amber-300"
                          >
                            <span className="material-symbols-outlined text-[10px]">warning</span>
                            {c}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {!isResolved && (
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => update(s.id, 'dismissed')}
                        className="rounded-md border border-slate-200 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
                      >
                        Dismiss
                      </button>
                      <button
                        type="button"
                        onClick={() => update(s.id, 'accepted')}
                        className="rounded-md bg-primary px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-white shadow-sm hover:bg-primary/90"
                      >
                        Accept
                      </button>
                    </div>
                  )}
                </div>
                <div className="mt-2 grid grid-cols-1 gap-1 sm:grid-cols-2">
                  {(Object.entries(s.deltas) as [RiskAxis, number][]).map(([axis, v]) => (
                    <DeltaBar key={axis} axis={axis} value={v} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </WidgetFrame>
  );
};

export default InterventionSuggestionsWidget;
