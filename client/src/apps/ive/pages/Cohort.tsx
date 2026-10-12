import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Pagination from '../components/ui/Pagination';
import { getOmopRows, getOmopCount } from '../api/omop';

interface CohortDefinitionRow {
  cohort_definition_id: number;
  cohort_definition_name: string;
  cohort_definition_description: string | null;
  cohort_definition_syntax: string | null;
  cohort_initiation_date: string | null;
}

const CohortView: React.FC = () => {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const [cohorts, setCohorts] = useState<CohortDefinitionRow[]>([]);
  const [total, setTotal] = useState(0);
  const [totalAll, setTotalAll] = useState<number | null>(null);
  const [externalSourced, setExternalSourced] = useState<number | null>(null);
  const [subjectCounts, setSubjectCounts] = useState<Record<number, number | null>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debounce the search box so every keystroke doesn't hit the backend.
  useEffect(() => {
    const t = setTimeout(() => {
      setSearchQuery(searchInput.trim());
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Unfiltered totals for the stat cards — fetched once.
  useEffect(() => {
    getOmopCount('cohort_definition')
      .then((count) => setTotalAll(count >= 0 ? count : null))
      .catch(() => setTotalAll(null));
    getOmopCount('cohort_definition', { cohort_definition_syntax: 'EXTERNAL_SOURCED' })
      .then((count) => setExternalSourced(count >= 0 ? count : null))
      .catch(() => setExternalSourced(null));
  }, []);

  useEffect(() => {
    let cancelled = false;
    const filters = searchQuery ? { cohort_definition_name: searchQuery } : undefined;

    setLoading(true);
    setError(null);

    Promise.all([
      getOmopRows('cohort_definition', { page: currentPage, pageSize }, filters),
      getOmopCount('cohort_definition', filters),
    ])
      .then(([{ header, rows }, count]) => {
        if (cancelled) return;
        const objects = rows.map((row) => {
          const obj: Record<string, unknown> = {};
          header.forEach((h, i) => {
            obj[h] = (row as unknown[])[i];
          });
          return obj as unknown as CohortDefinitionRow;
        });
        setCohorts(objects);
        setTotal(count >= 0 ? count : 0);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setError(err.message);
        setCohorts([]);
        setTotal(0);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [currentPage, pageSize, searchQuery]);

  // Real per-cohort subject counts (from the `cohort` membership table),
  // fetched for whichever rows are on the current page.
  useEffect(() => {
    let cancelled = false;
    cohorts.forEach((c) => {
      if (subjectCounts[c.cohort_definition_id] !== undefined) return;
      getOmopCount('cohort', { cohort_definition_id: c.cohort_definition_id })
        .then((count) => {
          if (cancelled) return;
          setSubjectCounts((prev) => ({ ...prev, [c.cohort_definition_id]: count >= 0 ? count : null }));
        })
        .catch(() => {
          if (cancelled) return;
          setSubjectCounts((prev) => ({ ...prev, [c.cohort_definition_id]: null }));
        });
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cohorts]);

  return (
    <div className="flex flex-col h-full w-full bg-slate-50 dark:bg-slate-950">
      <main className="flex-grow p-8 overflow-auto custom-scrollbar">
        <div className="max-w-6xl mx-auto">
          <header className="mb-8 flex justify-between items-end">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Cohort Explorer</h2>
              <p className="text-slate-500 dark:text-slate-400">Manage and analyze your defined patient populations.</p>
            </div>
            <button className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700/50 group">
              <span className="material-symbols-outlined text-lg text-primary group-hover:rotate-180 transition-transform duration-500">sync</span>
              Sync
            </button>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
              { label: 'Total Definitions', value: totalAll !== null ? totalAll.toLocaleString() : '...', icon: 'list_alt', color: 'blue' },
              { label: 'External Sourced', value: externalSourced !== null ? externalSourced.toLocaleString() : '...', icon: 'cloud_download', color: 'emerald' },
              { label: 'Public Cohorts', value: '8', icon: 'public', color: 'purple' },
              { label: 'Last Sync', value: '2 hrs ago', icon: 'sync', color: 'amber' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                  <div className={`p-2 rounded-lg bg-${stat.color}-500/10 text-${stat.color}-500`}>
                    <span className="material-symbols-outlined text-2xl">{stat.icon}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{stat.label}</span>
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</div>
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Cohort Definitions</h3>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                  <input
                    type="text"
                    placeholder="Search cohorts..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary h-9 transition-all w-64"
                  />
                </div>
              </div>
            </div>
            {error && (
              <div className="px-6 py-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border-b border-red-100 dark:border-red-900">
                Failed to load cohort definitions: {error}
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">ID</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Name</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-center">Subject Count</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Syntax</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Initiation Date</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {cohorts.map((cohort) => {
                    const subjectCount = subjectCounts[cohort.cohort_definition_id];
                    return (
                      <tr key={cohort.cohort_definition_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-500">{cohort.cohort_definition_id}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{cohort.cohort_definition_name}</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{cohort.cohort_definition_description}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="text-sm font-bold text-primary bg-primary/5 px-2 py-1 rounded-md">
                            {subjectCount === undefined ? '...' : subjectCount === null ? '—' : subjectCount.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            {cohort.cohort_definition_syntax}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">{cohort.cohort_initiation_date}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => navigate(`/ive/cohort/${cohort.cohort_definition_id}`)}
                              className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                            >
                              <span className="material-symbols-outlined text-lg">visibility</span>
                            </button>
                            <button className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all">
                              <span className="material-symbols-outlined text-lg">more_vert</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {!loading && cohorts.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-500 italic">No cohorts found matching your criteria</td>
                    </tr>
                  )}
                  {loading && cohorts.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-500 italic">Loading cohort definitions...</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <Pagination
              page={currentPage}
              pageSize={pageSize}
              total={total}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[5, 10, 20, 50]}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default CohortView;
