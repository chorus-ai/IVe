import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux';
import { getOmopCount, getOmopRows } from '../api/omop';
import { loadConcept } from '../api/concepts';
import { OMOP_TABLE_CARDS, type OmopTables } from '../types';
import OmopTableInlineWidget from './widgets/OmopTableInlineWidget';

interface VisitRow {
  id: string;
  startDate: string | null;
  endDate: string | null;
  conceptId: string | null;
  typeConceptId: string | null;
}

interface TableTab {
  key: keyof OmopTables;
  label: string;
  count: number;
}

/** Tables worth tabbing through inside one visit. */
const STEP_TABLES = OMOP_TABLE_CARDS.filter(
  (card) => card.key !== 'person' && card.key !== 'visit_occurrence',
);

const fmtDate = (value: string | null) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
};

const dayspan = (start: string | null, end: string | null) => {
  if (!start || !end) return null;
  const a = new Date(start).getTime();
  const b = new Date(end).getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  const days = Math.round((b - a) / 86_400_000);
  return days <= 0 ? 'same day' : `${days} day${days === 1 ? '' : 's'}`;
};

/**
 * One visit in the vertical timeline. Its per-table counts are only fetched
 * once the step is open: a person with twenty visits would otherwise fire
 * twenty times STEP_TABLES count requests on mount, for tabs nobody looked at.
 */
const VisitStep: React.FC<{ visit: VisitRow; defaultOpen: boolean }> = ({ visit, defaultOpen }) => {
  const [open, setOpen] = useState(defaultOpen);
  const [tabs, setTabs] = useState<TableTab[] | null>(null);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const conceptsState = useAppSelector((s) => s.ive.concepts);

  useEffect(() => {
    if (visit.conceptId) loadConcept(dispatch, visit.conceptId, conceptsState);
    if (visit.typeConceptId) loadConcept(dispatch, visit.typeConceptId, conceptsState);
  }, [visit.conceptId, visit.typeConceptId, conceptsState, dispatch]);

  useEffect(() => {
    if (!open || tabs) return;
    let cancelled = false;

    Promise.all(
      STEP_TABLES.map(async (card) => {
        try {
          const count = await getOmopCount(card.key, { visit_occurrence_id: visit.id });
          return { card, count };
        } catch {
          return { card, count: 0 };
        }
      }),
    ).then((results) => {
      if (cancelled) return;
      const next = results
        .filter(({ count }) => count > 0)
        .map(({ card, count }) => ({
          key: card.key as keyof OmopTables,
          label: card.name,
          count,
        }));
      setTabs(next);
      setActiveKey(next[0]?.key ?? null);
    });

    return () => { cancelled = true; };
  }, [open, tabs, visit.id]);

  const conceptName = visit.conceptId
    ? conceptsState.byId[String(visit.conceptId)]?.concept_name
    : null;
  const typeName = visit.typeConceptId
    ? conceptsState.byId[String(visit.typeConceptId)]?.concept_name
    : null;

  const start = fmtDate(visit.startDate);
  const end = fmtDate(visit.endDate);
  const span = dayspan(visit.startDate, visit.endDate);

  return (
    <li className="relative pl-12 pb-6">
      {/* The step marker, sitting on the rail drawn by the parent <ol>. */}
      <span
        className={`absolute left-[11px] top-4 h-3 w-3 rounded-full ring-4 ring-slate-50 dark:ring-slate-950 ${
          open ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'
        }`}
      />

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="flex min-w-0 flex-1 items-center gap-3 text-left"
          >
            <span className="material-symbols-outlined text-lg text-slate-400">
              {open ? 'expand_more' : 'chevron_right'}
            </span>
            {/* flex-col, not `block` on the children: a legacy m2d stylesheet
                (components/AcceptCookie/index.css) redefines .block as a fixed
                full-viewport scrim, which greys out the whole page. */}
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                {conceptName ?? 'Visit'}
              </span>
              <span className="truncate text-xs text-slate-500 dark:text-slate-400">
                {start ?? '—'}
                {end && end !== start ? ` → ${end}` : ''}
                {span ? ` · ${span}` : ''}
                {typeName ? ` · ${typeName}` : ''}
              </span>
            </span>
          </button>

          <span className="shrink-0 font-mono text-[11px] text-slate-400">#{visit.id}</span>

          <button
            type="button"
            onClick={() => navigate(`/ive/visit/${visit.id}`)}
            className="shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-primary dark:hover:bg-slate-800"
            title="Open visit view"
          >
            <span className="material-symbols-outlined text-base">open_in_new</span>
          </button>
        </div>

        {open && (
          <>
            <div className="flex items-center gap-6 overflow-x-auto border-y border-slate-200 dark:border-slate-800 bg-slate-50/50 px-4 dark:bg-slate-950/20">
              {tabs === null && (
                <span className="py-3 text-xs text-slate-400">Loading tables…</span>
              )}
              {tabs?.length === 0 && (
                <span className="py-3 text-xs text-slate-400">No records under this visit.</span>
              )}
              {tabs?.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveKey(tab.key)}
                  className={`flex items-center gap-2 whitespace-nowrap border-b-2 py-3 text-sm font-medium transition-all ${
                    activeKey === tab.key
                      ? 'border-primary text-primary'
                      : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                  <span
                    className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold ${
                      activeKey === tab.key
                        ? 'bg-primary/15 text-primary'
                        : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {tab.count.toLocaleString()}
                  </span>
                </button>
              ))}
            </div>

            {activeKey && (
              <OmopTableInlineWidget
                key={`${visit.id}:${activeKey}`}
                tableKey={activeKey as keyof OmopTables}
                visitId={visit.id}
                previewRows={5}
              />
            )}
          </>
        )}
      </div>
    </li>
  );
};

/**
 * The person's record as a vertical stepper: one step per visit_occurrence,
 * newest first, each opening into the same table tabs the Visit View shows.
 */
const PersonVisitTimeline: React.FC<{ personId: string }> = ({ personId }) => {
  const [visits, setVisits] = useState<VisitRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!personId) return;
    let cancelled = false;

    getOmopRows('visit_occurrence', { page: 1, pageSize: 0 }, { person_id: personId })
      .then(({ header, rows }) => {
        if (cancelled) return;
        const col = (name: string) => header.indexOf(name);
        const idIdx = col('visit_occurrence_id');
        const startIdx = col('visit_start_date');
        const endIdx = col('visit_end_date');
        const conceptIdx = col('visit_concept_id');
        const typeIdx = col('visit_type_concept_id');

        const parsed = rows
          .map((row) => ({
            id: idIdx >= 0 ? String(row[idIdx]) : '',
            startDate: startIdx >= 0 && row[startIdx] != null ? String(row[startIdx]) : null,
            endDate: endIdx >= 0 && row[endIdx] != null ? String(row[endIdx]) : null,
            conceptId: conceptIdx >= 0 && row[conceptIdx] != null ? String(row[conceptIdx]) : null,
            typeConceptId: typeIdx >= 0 && row[typeIdx] != null ? String(row[typeIdx]) : null,
          }))
          .filter((v) => v.id)
          // Newest first: the most recent visit occurrence is the one being reviewed.
          .sort((a, b) => String(b.startDate ?? '').localeCompare(String(a.startDate ?? '')));

        setVisits(parsed);
      })
      .catch((err) => !cancelled && setError(err?.message ?? 'Could not load visits'));

    return () => { cancelled = true; };
  }, [personId]);

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-900/20 dark:text-red-200">
        {error}
      </div>
    );
  }

  if (!visits) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-400">
        <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
        Loading visits…
      </div>
    );
  }

  if (!visits.length) {
    return (
      <div className="p-8 text-center text-slate-400">
        <div className="mb-2">
          <span className="material-symbols-outlined text-3xl">event_busy</span>
        </div>
        <span className="text-sm">No visits recorded for this person.</span>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-baseline gap-2">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Visit Occurrences
        </h3>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {visits.length.toLocaleString()}
        </span>
      </div>

      {/* The rail: one border on the list, so steps don't each draw their own. */}
      <ol className="relative border-l border-slate-200 dark:border-slate-800 ml-[16px]">
        {visits.map((visit, i) => (
          <VisitStep key={visit.id} visit={visit} defaultOpen={i === 0} />
        ))}
      </ol>
    </div>
  );
};

export default PersonVisitTimeline;
