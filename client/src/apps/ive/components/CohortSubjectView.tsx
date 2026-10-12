import React, { useMemo, useState } from 'react';
import WidgetGrid from './widgets/WidgetGrid';
import { getWidget } from './widgets/registry';
import { useSavedLayouts } from '../hooks/useLayouts';
import type { DashboardLayout } from './widgets/types';

interface CohortSubjectViewProps {
  personId: string;
  cohortDefinitionId: string;
  startDate: string;
  endDate: string;
}

const LAYOUT_PREF_KEY = 'ive.subjectView.layoutId';
const DEFAULT_LAYOUT_ID = 'l-subject-event-timeline';

/** A layout can host a subject when every widget is person-scoped (accepts the personId override). */
const isSubjectLayout = (layout: DashboardLayout) =>
  layout.widgets.length > 0 && layout.widgets.every((w) => getWidget(w.type)?.category === 'person');

const CohortSubjectView: React.FC<CohortSubjectViewProps> = ({ personId, startDate, endDate }) => {
  const layouts = useSavedLayouts();
  const subjectLayouts = useMemo(() => layouts.filter(isSubjectLayout), [layouts]);

  const [layoutId, setLayoutId] = useState<string>(
    () => localStorage.getItem(LAYOUT_PREF_KEY) ?? DEFAULT_LAYOUT_ID
  );
  const layout =
    subjectLayouts.find((l) => l.id === layoutId) ??
    subjectLayouts.find((l) => l.id === DEFAULT_LAYOUT_ID) ??
    subjectLayouts[0];

  const selectLayout = (id: string) => {
    setLayoutId(id);
    localStorage.setItem(LAYOUT_PREF_KEY, id);
  };

  return (
    <div className="flex-grow overflow-auto custom-scrollbar p-8 bg-slate-50 dark:bg-slate-950">
      <div className="w-full space-y-6">
        <div className="flex items-center justify-end gap-2">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Layout</span>
          <select
            value={layout?.id ?? ''}
            onChange={(e) => selectLayout(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-primary/50 outline-none"
          >
            {subjectLayouts.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        </div>

        {layout ? (
          <WidgetGrid widgets={layout.widgets} overrides={{ personId, startDate, endDate }} />
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400 italic text-center py-12">
            No subject layouts available. Build one in the Workspace using person-scoped widgets.
          </p>
        )}

        <div className="text-center py-6">
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
            Longitudinal Patient Identification · OMOP-CDM v5.4 · person {personId}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CohortSubjectView;
