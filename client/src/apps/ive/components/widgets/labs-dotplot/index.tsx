import React, { useMemo } from 'react';
import WidgetFrame from '../WidgetFrame';
import type { WidgetComponentProps } from '../types';
import { CohortWidgetConfig, personOf, DEFAULT_START_DATE } from './settings';
import { buildAxis, genEvents, mulberry32, seedFrom } from './mockSeries';

export type LabsDotplotConfig = CohortWidgetConfig;

/** Analyte rows at roughly the SuperAlarm demo densities. */
const LAB_ROWS = [
  { key: 'ammonia',   label: 'Ammonia',                           count: 1 },
  { key: 'ca_ion_s',  label: 'Calcium, Ionized, serum/plasma',    count: 22 },
  { key: 'bili',      label: 'Bilirubin, Direct',                 count: 2 },
  { key: 'albumin',   label: 'Albumin, Serum / Plasma',           count: 3 },
  { key: 'ldh',       label: 'Lactate Dehydrogenase',             count: 6 },
  { key: 'protein',   label: 'Protein, Total, Serum / Plasma',    count: 3 },
  { key: 'bnp',       label: 'B-Type Natriuretic Peptide',        count: 18 },
  { key: 'lactate',   label: 'Lactate, whole blood',              count: 26 },
  { key: 'ca_ion_wb', label: 'Calcium, Ionized, whole blood',     count: 28 },
  { key: 'chloride',  label: 'Chloride, whole blood',             count: 30 },
  { key: 'glucose',   label: 'Glucose, whole blood',              count: 32 },
  { key: 'sodium',    label: 'Sodium, whole blood',               count: 31 },
];

const LabsDotplotWidget: React.FC<WidgetComponentProps<LabsDotplotConfig>> = ({
  title, config, isEditMode, onRemove, onEdit,
}) => {
  const personId = personOf(config);
  // Wider tick step: this panel usually sits in a narrow (w:4) column.
  const axis = useMemo(
    () => buildAxis(config.startDate ?? DEFAULT_START_DATE, 12, 3),
    [config.startDate],
  );

  const rows = useMemo(
    () => LAB_ROWS.map((row) => {
      const rand = mulberry32(seedFrom('labs_dotplot', personId, row.key));
      return {
        ...row,
        // Draws share a few collection times; abnormality drives dot depth.
        events: genEvents(rand, row.count, 3).map((frac) => ({ frac, intensity: 0.35 + rand() * 0.65 })),
      };
    }),
    [personId],
  );

  const total = rows.reduce((sum, r) => sum + r.count, 0);

  return (
    <WidgetFrame title={title} isEditMode={isEditMode} onRemove={onRemove} onEdit={onEdit}>
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-600 text-white">{total}</span>
          <span className="text-[10px] text-slate-400 uppercase tracking-widest">results · mock data</span>
        </div>

        <div className="space-y-1">
          {rows.map((row) => (
            <div key={row.key} className="flex items-center gap-2">
              <div className="relative flex-1 h-6 rounded bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                {row.events.map((e, i) => (
                  <span
                    key={i}
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-2 rounded-full"
                    style={{ left: `${e.frac * 100}%`, backgroundColor: '#9333ea', opacity: e.intensity }}
                  />
                ))}
              </div>
              <span className="w-40 shrink-0 text-[10px] leading-tight text-slate-500 dark:text-slate-400 truncate" title={row.label}>
                {row.label}
              </span>
            </div>
          ))}
        </div>

        <div className="relative h-4 mt-1 mr-[168px]">
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

export default LabsDotplotWidget;
