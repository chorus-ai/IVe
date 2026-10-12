import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { OMOP_TABLE_CARDS, type OmopTables } from '../types';
import { getOmopCount, getOmopRows } from '../api/omop';
import VisitHeaderWidget from './widgets/visit-header';
import { CohortEventsTimeline } from './widgets/cohort-timeline';
import OmopTableInlineWidget from './widgets/OmopTableInlineWidget';
import VisitNotesPanel from './VisitNotesPanel';
import { SepsisLayout, ArdsLayout, DelayedRecoveryLayout } from './VisitLayoutPanels';

const LAYOUTS = [
  { key: 'default', label: 'Default' },
  { key: 'sepsis',  label: 'Sepsis Bundle' },
  { key: 'ards',    label: 'ARDS Protocol' },
  { key: 'delayed', label: 'Delayed Recovery' },
] as const;
type LayoutKey = typeof LAYOUTS[number]['key'];

interface TableTab {
  key: keyof OmopTables;
  label: string;
  icon: string;
  count: number;
}

const VisitDataView: React.FC = () => {
  const { visitId = '' } = useParams<{ visitId: string }>();
  const navigate = useNavigate();
  const onClose = () => navigate(-1);

  const [tableTabs, setTableTabs] = useState<TableTab[]>([]);
  const [activeKey, setActiveKey] = useState<string>('notes');
  const [layout, setLayout] = useState<LayoutKey>('default');
  const [showTimeline, setShowTimeline] = useState(false);
  /** person + window for the timeline axis; the events themselves are visit-scoped. */
  const [visitWindow, setVisitWindow] = useState<
    { personId: string; startDate: string; endDate: string } | null
  >(null);

  useEffect(() => {
    if (!visitId) return;
    let cancelled = false;

    Promise.all(
      OMOP_TABLE_CARDS
        .filter((card) => card.key !== 'person' && card.key !== 'visit_occurrence')
        .map(async (card) => {
          try {
            const count = await getOmopCount(card.key, { visit_occurrence_id: visitId });
            return { card, count };
          } catch {
            return { card, count: 0 };
          }
        }),
    ).then((results) => {
      if (cancelled) return;
      const tabs = results
        .filter(({ count }) => count > 0)
        .map(({ card, count }) => ({
          key: card.key as keyof OmopTables,
          label: card.name,
          icon: card.icon,
          count,
        }));
      setTableTabs(tabs);
    });

    return () => { cancelled = true; };
  }, [visitId]);

  useEffect(() => {
    if (!showTimeline || !visitId || visitWindow) return;
    let cancelled = false;

    getOmopRows('visit_occurrence', { page: 1, pageSize: 1 }, { visit_occurrence_id: visitId })
      .then(({ header, rows }) => {
        if (cancelled || rows.length === 0) return;
        const record: Record<string, unknown> = {};
        header.forEach((h, i) => { record[h] = rows[0][i]; });
        const start = record.visit_start_date ? String(record.visit_start_date) : '';
        const end = record.visit_end_date ? String(record.visit_end_date) : start;
        if (!start) return;
        setVisitWindow({
          personId: record.person_id != null ? String(record.person_id) : '',
          startDate: start,
          endDate: end || start,
        });
      })
      .catch(() => {});

    return () => { cancelled = true; };
  }, [showTimeline, visitId, visitWindow]);

  const tabs = useMemo(
    () => [
      ...tableTabs,
      { key: 'notes', label: 'Note', icon: 'description', count: undefined as number | undefined },
    ],
    [tableTabs],
  );

  const renderActive = () => {
    if (activeKey === 'notes') {
      return <VisitNotesPanel />;
    }
    const tab = tableTabs.find((t) => t.key === activeKey);
    if (!tab) return null;
    return (
      <OmopTableInlineWidget
        tableKey={tab.key}
        visitId={visitId}
      />
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950">
      <div className="bg-white dark:bg-background-dark border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-500"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Visit View</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Visit ID: {visitId}</p>
          </div>
        </div>

        <label className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">Layout</span>
          <select
            value={layout}
            onChange={(e) => setLayout(e.target.value as LayoutKey)}
            className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-primary/40 outline-none"
          >
            {LAYOUTS.map((l) => (
              <option key={l.key} value={l.key}>{l.label}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex-1 overflow-auto p-6 custom-scrollbar">
        <div className="max-w-[1600px] mx-auto space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <VisitHeaderWidget
              title="Visit Header"
              config={{ visitId }}
              isEditMode={false}
              timelineActive={showTimeline}
              onToggleTimeline={() => setShowTimeline((v) => !v)}
            />
          </div>

          {showTimeline &&
            (visitWindow ? (
              <CohortEventsTimeline
                visitId={visitId}
                personId={visitWindow.personId}
                startDate={visitWindow.startDate}
                endDate={visitWindow.endDate}
              />
            ) : (
              <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-8 text-sm text-slate-400">
                <span className="material-symbols-outlined animate-spin text-primary">
                  progress_activity
                </span>
                Loading visit timeline…
              </div>
            ))}

          {layout === 'default' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 border-b border-slate-200 dark:border-slate-800 flex items-center gap-6 bg-slate-50/50 dark:bg-slate-950/20 overflow-x-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveKey(tab.key)}
                    className={`flex items-center gap-2 py-3 border-b-2 transition-all font-medium text-sm whitespace-nowrap ${
                      activeKey === tab.key
                        ? 'border-primary text-primary'
                        : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                  >
                    {tab.label}
                    {tab.count != null && (
                      <span className={`ml-1 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        activeKey === tab.key
                          ? 'bg-primary/15 text-primary'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}>
                        {tab.count.toLocaleString()}
                      </span>
                    )}
                  </button>
                ))}
              </div>
              {renderActive()}
            </div>
          )}
          {layout === 'sepsis' && <SepsisLayout />}
          {layout === 'ards' && <ArdsLayout />}
          {layout === 'delayed' && <DelayedRecoveryLayout />}
        </div>
      </div>
    </div>
  );
};

export default VisitDataView;
