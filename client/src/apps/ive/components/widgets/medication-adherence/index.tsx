import React from 'react';
import WidgetFrame from '../WidgetFrame';
import type { WidgetComponentProps } from '../types';
import type { MedAdherenceConfig } from './settings';

type Status = 'good' | 'at-risk' | 'non-adherent';

interface Med {
  name: string;
  dose: string;
  klass: string;
  pdc: number; // 0..1, proportion of days covered
  lastRefill: string;
  gapDays: number;
  refills: number;
}

const MEDS: Med[] = [
  { name: 'Metformin', dose: '1000 mg BID', klass: 'Antihyperglycemic', pdc: 0.92, lastRefill: '2024-04-22', gapDays: 0, refills: 6 },
  { name: 'Lisinopril', dose: '20 mg QD', klass: 'ACE inhibitor', pdc: 0.78, lastRefill: '2024-03-30', gapDays: 8, refills: 5 },
  { name: 'Atorvastatin', dose: '40 mg QHS', klass: 'Statin', pdc: 0.61, lastRefill: '2024-02-18', gapDays: 22, refills: 4 },
  { name: 'Sertraline', dose: '100 mg QD', klass: 'SSRI', pdc: 0.45, lastRefill: '2024-01-04', gapDays: 41, refills: 3 },
  { name: 'Levothyroxine', dose: '75 mcg QD', klass: 'Thyroid hormone', pdc: 0.97, lastRefill: '2024-04-29', gapDays: 0, refills: 6 },
  { name: 'Apixaban', dose: '5 mg BID', klass: 'DOAC', pdc: 0.83, lastRefill: '2024-04-12', gapDays: 3, refills: 5 },
];

const statusOf = (pdc: number): Status =>
  pdc >= 0.8 ? 'good' : pdc >= 0.6 ? 'at-risk' : 'non-adherent';

const statusStyles: Record<Status, { pill: string; bar: string; label: string }> = {
  'good': {
    pill: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    bar: 'bg-emerald-500',
    label: 'On track',
  },
  'at-risk': {
    pill: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
    bar: 'bg-amber-500',
    label: 'At risk',
  },
  'non-adherent': {
    pill: 'bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30',
    bar: 'bg-red-500',
    label: 'Non-adherent',
  },
};

const MedicationAdherenceWidget: React.FC<WidgetComponentProps<MedAdherenceConfig>> = ({ title, isEditMode, onRemove, onEdit }) => {
  const onTrack = MEDS.filter((m) => statusOf(m.pdc) === 'good').length;
  const atRisk = MEDS.filter((m) => statusOf(m.pdc) === 'at-risk').length;
  const non = MEDS.filter((m) => statusOf(m.pdc) === 'non-adherent').length;

  return (
    <WidgetFrame title={title} isEditMode={isEditMode} onRemove={onRemove} onEdit={onEdit}>
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2 text-[10px] font-medium uppercase tracking-widest text-slate-400 dark:border-slate-800">
          <span>Per-medication PDC · last 12 months</span>
          <span className="font-mono">
            <span className="text-emerald-600 dark:text-emerald-400">{onTrack} on track</span>
            {' · '}
            <span className="text-amber-600 dark:text-amber-400">{atRisk} at risk</span>
            {' · '}
            <span className="text-red-600 dark:text-red-400">{non} non-adherent</span>
          </span>
        </div>
        <div className="custom-scrollbar flex-1 overflow-y-auto p-3 space-y-2">
          {MEDS.map((m) => {
            const status = statusOf(m.pdc);
            const s = statusStyles[status];
            const pct = Math.round(m.pdc * 100);
            return (
              <div
                key={m.name}
                className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                        {m.name}
                      </span>
                      <span className="text-[10px] text-slate-400">{m.dose}</span>
                      <span
                        className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest ${s.pill}`}
                      >
                        {s.label}
                      </span>
                    </div>
                    <div className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                      {m.klass} · last refill {m.lastRefill} · {m.refills} refills
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-mono text-base font-bold tabular-nums text-slate-900 dark:text-slate-100">
                      {pct}%
                    </div>
                    <div className="text-[9px] uppercase tracking-widest text-slate-400">PDC</div>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <div className="relative h-2 flex-1 rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className={`absolute left-0 top-0 h-full rounded-full ${s.bar}`}
                      style={{ width: `${pct}%` }}
                    />
                    <div
                      className="absolute top-[-2px] h-3 w-px bg-slate-400/60"
                      style={{ left: '80%' }}
                      title="Adherence threshold (80%)"
                    />
                  </div>
                  <span
                    className={`shrink-0 font-mono text-[10px] tabular-nums ${
                      m.gapDays === 0
                        ? 'text-slate-400'
                        : m.gapDays > 14
                        ? 'text-red-500'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {m.gapDays === 0 ? 'no gap' : `${m.gapDays}d gap`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </WidgetFrame>
  );
};

export default MedicationAdherenceWidget;
