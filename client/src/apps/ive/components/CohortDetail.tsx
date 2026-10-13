import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CohortSubjectView from './CohortSubjectView';
import { getOmopRows, getOmopCount } from '../api/omop';

const PAGE_SIZE = 20;

const CohortDetail: React.FC = () => {
  const { cohortDefinitionId, subjectId } = useParams<{ cohortDefinitionId: string; subjectId?: string }>();
  const navigate = useNavigate();
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  // Set once a deep-linked subject has been looked up and is not in this cohort.
  const [missingSubjectId, setMissingSubjectId] = useState<string | null>(null);

  const [header, setHeader] = useState<string[]>([]);
  const [rows, setRows] = useState<unknown[][]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [pagesLoaded, setPagesLoaded] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!cohortDefinitionId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    setHeader([]);
    setRows([]);
    setTotal(null);
    setPagesLoaded(0);
    setSelectedRecordId(null);

    Promise.all([
      getOmopRows('cohort', { page: 1, pageSize: PAGE_SIZE }, { cohort_definition_id: cohortDefinitionId }),
      getOmopCount('cohort', { cohort_definition_id: cohortDefinitionId }),
    ])
      .then(([res, count]) => {
        if (cancelled) return;
        setHeader(res.header);
        setRows(res.rows);
        setTotal(count >= 0 ? count : 0);
        setPagesLoaded(1);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [cohortDefinitionId]);

  const loadMore = () => {
    if (!cohortDefinitionId || loadingMore) return;
    const nextPage = pagesLoaded + 1;
    setLoadingMore(true);
    getOmopRows('cohort', { page: nextPage, pageSize: PAGE_SIZE }, { cohort_definition_id: cohortDefinitionId })
      .then((res) => {
        setRows((prev) => [...prev, ...res.rows]);
        setPagesLoaded(nextPage);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoadingMore(false));
  };

  const hasMore = total !== null && rows.length < total;

  // header is [cohort_definition_id, subject_id, cohort_start_date, cohort_end_date]
  const records = useMemo(() => {
    if (!header.length) return [];
    const subjectIdx = header.indexOf('subject_id');
    const startIdx = header.indexOf('cohort_start_date');
    const endIdx = header.indexOf('cohort_end_date');
    const cohortIdx = header.indexOf('cohort_definition_id');
    const byId = new Map<string, { id: string; subjectId: string; startDate: string; endDate: string; cohortId: string }>();
    // Deduped: a deep-linked subject's rows are fetched ahead of the pages
    // and turn up again when "Load more" reaches them.
    for (const row of rows) {
      const id = `${row[subjectIdx]}_${row[startIdx]}`;
      if (byId.has(id)) continue;
      byId.set(id, {
        id,
        subjectId: String(row[subjectIdx]),
        startDate: String(row[startIdx]),
        endDate: String(row[endIdx]),
        cohortId: String(row[cohortIdx]),
      });
    }
    return [...byId.values()];
  }, [header, rows]);

  const selectedRecord = useMemo(() => {
    const found = records.find((r) => r.id === selectedRecordId);
    if (found) return found;
    // With a subject in the URL, never fall back to someone else's record.
    return subjectId ? undefined : records[0];
  }, [records, selectedRecordId, subjectId]);

  // Sync the selection to the URL. A subject can have several episodes
  // (rows) in a cohort; the URL picks the subject, a click picks the episode.
  useEffect(() => {
    if (!records.length) return;
    if (!subjectId) {
      if (!selectedRecordId) setSelectedRecordId(records[0].id);
      return;
    }
    if (selectedRecord?.subjectId === subjectId) return;
    const match = records.find((r) => r.subjectId === subjectId);
    if (match) setSelectedRecordId(match.id);
  }, [records, subjectId, selectedRecordId, selectedRecord]);

  // A deep-linked subject may sit beyond the loaded pages: fetch its rows.
  useEffect(() => {
    setMissingSubjectId(null);
    if (loading || !cohortDefinitionId || !subjectId || !header.length) return;
    if (records.some((r) => r.subjectId === subjectId)) return;
    let cancelled = false;
    getOmopRows(
      'cohort',
      { page: 1, pageSize: PAGE_SIZE },
      { cohort_definition_id: cohortDefinitionId, subject_id: subjectId }
    )
      .then((res) => {
        if (cancelled) return;
        if (res.rows.length) setRows((prev) => [...res.rows, ...prev]);
        else setMissingSubjectId(subjectId);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
    // records is derived from rows; depending on it would refetch after the merge.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, cohortDefinitionId, subjectId, header]);

  const selectRecord = (record: { id: string; subjectId: string }) => {
    setSelectedRecordId(record.id);
    if (record.subjectId !== subjectId) {
      navigate(`/ive/cohort/${cohortDefinitionId}/subject/${record.subjectId}`);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full w-full bg-slate-50 dark:bg-slate-950 items-center justify-center">
        <p className="text-slate-500 italic">Loading cohort subjects...</p>
      </div>
    );
  }

  if (error || !records.length) {
    return (
      <div className="flex flex-col h-full w-full bg-slate-50 dark:bg-slate-950 p-8">
        <div className="max-w-6xl mx-auto w-full">
          <header className="mb-8 flex items-center gap-4">
            <button
              onClick={() => navigate('/ive/cohort')}
              className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
              {error ? 'Failed to Load Cohort' : 'No Data Available'}
            </h2>
          </header>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center shadow-xl">
            <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">folder_off</span>
            <p className="text-slate-500 max-w-md mx-auto mb-6">
              {error
                ? error
                : `No subject records were found for cohort ID ${cohortDefinitionId}.`}
            </p>
            <button
              onClick={() => navigate('/ive/cohort')}
              className="text-primary font-bold hover:underline"
            >
              Return to Cohort List
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Sidebar - Subject List */}
      <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-panel-dark flex flex-col shrink-0 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center gap-3">
          <button
            onClick={() => navigate('/ive/cohort')}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
          </button>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Cohort {cohortDefinitionId}</h3>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
              {total !== null ? total.toLocaleString() : records.length} Subjects
            </p>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto custom-scrollbar p-3 space-y-1">
          {records.map((record) => {
            const isActive = selectedRecord?.id === record.id;
            return (
              <button
                key={record.id}
                onClick={() => selectRecord(record)}
                className={`w-full text-left p-2 rounded-xl border transition-all group ${
                  isActive
                    ? 'bg-primary/5 dark:bg-primary/10 border-primary shadow-sm'
                    : 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-100 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-bold ${isActive ? 'text-primary' : 'text-slate-700 dark:text-slate-200'}`}>
                    Subject #{record.subjectId}
                  </span>
                  {isActive && (
                    <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
                   <div className="flex items-center gap-1.5">
                     <span className="text-[9px] text-slate-400 uppercase font-bold">Start:</span>
                     <span className="text-[9px] text-slate-600 dark:text-slate-400 font-mono italic">{record.startDate}</span>
                   </div>
                   <div className="flex items-center gap-1.5">
                     <span className="text-[9px] text-slate-400 uppercase font-bold">End:</span>
                     <span className="text-[9px] text-slate-600 dark:text-slate-400 font-mono italic">{record.endDate}</span>
                   </div>
                </div>
              </button>
            );
          })}
          {hasMore && (
            <div className="p-4 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
             <button
               onClick={loadMore}
               disabled={loadingMore}
               className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-slate-400 hover:text-primary hover:border-primary transition-all text-xs font-bold uppercase tracking-widest group disabled:opacity-50"
               >
               <span className="material-symbols-outlined text-sm">sync</span>
               {loadingMore ? 'Loading...' : 'Load more'}
             </button>
            </div>
          )}
        </div>


      </aside>

      {/* Main Content - Subject View */}
      <div className="flex-grow overflow-hidden flex flex-col relative h-full">
        {selectedRecord ? (
          <CohortSubjectView
            personId={selectedRecord.subjectId}
            cohortDefinitionId={selectedRecord.cohortId}
            startDate={selectedRecord.startDate}
            endDate={selectedRecord.endDate}
          />
        ) : missingSubjectId ? (
          <div className="flex-grow flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-12">
            <div className="text-center">
              <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">person_off</span>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Subject Not in Cohort</h3>
              <p className="text-slate-500 max-w-xs mx-auto">
                Subject #{missingSubjectId} has no records in cohort {cohortDefinitionId}.
              </p>
            </div>
          </div>
        ) : subjectId ? (
          <div className="flex-grow flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-12">
            <p className="text-slate-500 italic">Loading subject #{subjectId}...</p>
          </div>
        ) : (
          <div className="flex-grow flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-12">
             <div className="text-center">
               <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
                 <span className="material-symbols-outlined text-4xl text-primary">person_search</span>
               </div>
               <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Select a Record</h3>
               <p className="text-slate-500 max-w-xs mx-auto">
                 Choose a subject record from the left panel to examine their longitudinal health record.
               </p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CohortDetail;
