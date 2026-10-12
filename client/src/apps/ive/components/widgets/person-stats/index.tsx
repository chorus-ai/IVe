import React, { useEffect, useState } from 'react';
import { getOmopCount } from '../../../api/omop';
import WidgetFrame from '../WidgetFrame';
import type { WidgetComponentProps } from '../types';
import { CohortWidgetConfig, personOf } from './settings';

const STATS: { table: string; label: string; color: string; icon: string }[] = [
  { table: 'visit_occurrence',     label: 'Visits',        color: '#6366f1', icon: 'meeting_room' },
  { table: 'condition_occurrence', label: 'Conditions',    color: '#f97316', icon: 'medical_services' },
  { table: 'drug_exposure',        label: 'Drugs',         color: '#3b82f6', icon: 'medication' },
  { table: 'procedure_occurrence', label: 'Procedures',    color: '#8b5cf6', icon: 'healing' },
  { table: 'measurement',          label: 'Measurements',  color: '#10b981', icon: 'monitoring' },
  { table: 'observation',          label: 'Observations',  color: '#f59e0b', icon: 'visibility' },
  { table: 'device_exposure',      label: 'Devices',       color: '#06b6d4', icon: 'precision_manufacturing' },
  { table: 'note',                 label: 'Notes',         color: '#ef4444', icon: 'description' },
];

const PersonStatsWidget: React.FC<WidgetComponentProps<CohortWidgetConfig>> = ({
  title, config, isEditMode, onRemove, onEdit,
}) => {
  const personId = personOf(config);
  const [counts, setCounts] = useState<Record<string, number | null>>(() =>
    Object.fromEntries(STATS.map((s) => [s.table, null])),
  );

  useEffect(() => {
    let cancelled = false;
    setCounts(Object.fromEntries(STATS.map((s) => [s.table, null])));
    STATS.forEach(({ table }) => {
      getOmopCount(table, { person_id: personId })
        .then((n) => { if (!cancelled) setCounts((p) => ({ ...p, [table]: n })); })
        .catch(() => { if (!cancelled) setCounts((p) => ({ ...p, [table]: 0 })); });
    });
    return () => { cancelled = true; };
  }, [personId]);

  return (
    <WidgetFrame title={title} isEditMode={isEditMode} onRemove={onRemove} onEdit={onEdit}>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 p-4">
        {STATS.map((s) => {
          const n = counts[s.table];
          return (
            <div
              key={s.table}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3 flex items-center gap-3 shadow-sm"
            >
              <div className="min-w-0">
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{s.label}</div>
                <div className="text-base font-bold text-slate-800 dark:text-white tabular-nums">
                  {n == null ? '—' : n.toLocaleString()}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </WidgetFrame>
  );
};

export default PersonStatsWidget;
