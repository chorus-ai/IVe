import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOmopCount } from '../api/omop';
import { OMOP_TABLE_CARDS, MEDIA_TABLE_CARDS, type TableCard } from '../types';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux';
import { setTableCounts } from '../store';

// Module-level guard: survives StrictMode double-invocation, route remounts,
// and rapid back/forward navigation. fetchAllCounts() runs at most once per
// page load (a hard refresh resets it).
let overviewCountsFetchStarted = false;

const ClinicalTablesOverview: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const counts = useAppSelector((s) => s.ive.tableCounts);
  const countsRef = useRef(counts);
  countsRef.current = counts;

  const fetchAllCounts = async () => {
    const results: Record<string, number | null> = {};

    await Promise.allSettled(
      OMOP_TABLE_CARDS.map(async (t) => {
        try {
          const count = await getOmopCount(t.key);
          results[t.key] = count >= 0 ? count : null;
        } catch {
          results[t.key] = null;
        }
      })
    );

    dispatch(setTableCounts(results));
  };

  useEffect(() => {
    if (overviewCountsFetchStarted) return;
    // Read the live store snapshot — the closure-captured `counts` is stale
    // on first mount.
    const snapshot = countsRef.current;
    const alreadyLoaded = OMOP_TABLE_CARDS.every((t) => snapshot[t.key] !== undefined);
    overviewCountsFetchStarted = true;
    if (!alreadyLoaded) fetchAllCounts();
  }, []);

  const formatCount = (key: string) => {
    const c = counts[key];
    if (c === undefined) return '...';
    if (c === null) return '—';
    return c.toLocaleString();
  };

  const renderGroup = (
    title: string,
    cards: TableCard[],
    showCount: boolean
  ) => (
    <section>
      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {cards.map((table) => (
          <div
            key={table.key}
            className="group bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-primary transition-all duration-300 flex flex-col justify-between cursor-pointer"
            onClick={() => navigate(`/ive/table/${encodeURIComponent(table.key)}`)}
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className={`size-10 rounded-lg flex items-center justify-center text-${table.color}-500 bg-${table.color}-500/10`}>
                  <span className={`material-symbols-outlined text-${table.color}-500`}>{table.icon}</span>
                </div>
                <span className="text-xs font-bold text-slate-400 uppercase">{table.type}</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-primary transition-colors">{table.name}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6">{table.description}</p>
            </div>
            {showCount && (
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs font-semibold text-slate-500">Record Count</span>
                <span className="text-sm font-bold text-primary">{formatCount(table.key)}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );

  return (
    <div className="flex flex-1 overflow-hidden h-full">
      <main className="flex-grow flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden">

        <div className="flex-grow overflow-y-auto custom-scrollbar p-6">
          <div className="max-w-[1600px] mx-auto space-y-8">
            {renderGroup('OMOP Tables',OMOP_TABLE_CARDS, true)}
            {renderGroup('Media', MEDIA_TABLE_CARDS, false)}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ClinicalTablesOverview;
