import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../../../hooks/redux';
import { getOmopRows } from '../../../api/omop';
import { loadConcept } from '../../../api/concepts';
import type { WidgetComponentProps } from '../types';
import type { VisitHeaderConfig } from './settings';

type VisitRecord = Record<string, unknown>;

/**
 * Extra props only the visit detail page passes — the widget is also mounted
 * from saved layouts through the registry, where these are absent and the
 * timeline link simply doesn't render.
 */
interface VisitHeaderProps extends WidgetComponentProps<VisitHeaderConfig> {
  onToggleTimeline?: () => void;
  timelineActive?: boolean;
}

const VisitHeaderWidget: React.FC<VisitHeaderProps> = ({ config, onToggleTimeline, timelineActive }) => {
  const visitId = config.visitId != null ? String(config.visitId) : '';
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const conceptsState = useAppSelector((s) => s.ive.concepts);
  const [visit, setVisit] = useState<VisitRecord | null>(null);

  useEffect(() => {
    if (!visitId) return;
    let cancelled = false;

    getOmopRows('visit_occurrence', { page: 1, pageSize: 1 }, { visit_occurrence_id: visitId })
      .then(({ header, rows }) => {
        if (cancelled || rows.length === 0) return;
        const record: VisitRecord = {};
        header.forEach((h, i) => { record[h] = rows[0][i]; });
        setVisit(record);
      })
      .catch(() => { if (!cancelled) setVisit(null); });

    return () => { cancelled = true; };
  }, [visitId]);

  useEffect(() => {
    if (!visit) return;
    loadConcept(dispatch, visit.visit_concept_id as any, conceptsState);
    loadConcept(dispatch, visit.visit_type_concept_id as any, conceptsState);
  }, [visit, conceptsState, dispatch]);

  const lookupName = (id: unknown): string | null => {
    if (id == null || id === '') return null;
    const rec = conceptsState.byId[String(id)];
    if (!rec) return null;
    return rec.concept_name ?? '—';
  };
  const visitConceptName = lookupName(visit?.visit_concept_id);
  const visitTypeName = lookupName(visit?.visit_type_concept_id);

  const startDate = visit?.visit_start_date ? String(visit.visit_start_date) : null;
  const endDate = visit?.visit_end_date ? String(visit.visit_end_date) : null;
  const personId = visit?.person_id != null ? String(visit.person_id) : null;
  const providerId = visit?.provider_id != null ? String(visit.provider_id) : null;
  const careSiteId = visit?.care_site_id != null ? String(visit.care_site_id) : null;

  return (
    <div className="bg-white dark:bg-slate-900 h-full p-6 flex flex-col justify-center">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
              {visitTypeName ?? 'Visit'}
            </span>
            <span className="text-xs text-slate-400 font-mono">ID: {visitId}</span>
            {personId && (
              <button
                onClick={() => navigate(`/ive/person/${personId}`)}
                className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">person</span>
                View Patient History
              </button>
            )}
            {onToggleTimeline && (
              <button
                onClick={onToggleTimeline}
                aria-pressed={timelineActive}
                className={`text-[10px] font-bold uppercase tracking-widest hover:underline flex items-center gap-1 ${
                  timelineActive ? 'text-primary underline' : 'text-primary'
                }`}
              >
                <span className="material-symbols-outlined text-sm">
                  {timelineActive ? 'visibility_off' : 'visibility'}
                </span>
                {timelineActive ? 'Hide Timeline' : 'View Timeline'}
              </button>
            )}
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
            {visitConceptName ?? <span className="text-slate-400 font-normal">—</span>}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">calendar_today</span>
            {startDate ?? '—'}
            {endDate && endDate !== startDate ? ` → ${endDate}` : ''}
          </p>
        </div>
        <div className="text-right shrink-0">
          <div className="mb-1">
            <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">Provider</p>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{providerId ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">Care Site</p>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{careSiteId ?? '—'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisitHeaderWidget;
