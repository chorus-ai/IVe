import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../../hooks/redux';
import { getOmopCount, getOmopRows } from '../../api/omop';
import { loadConcept } from '../../api/concepts';
import { getTableCard, type OmopTables } from '../../types';

interface OmopTableInlineWidgetProps {
  tableKey: keyof OmopTables;
  personId?: number | string;
  visitId?: number | string;
  previewRows?: number;
}

const HIDDEN_SUFFIXES = ['_date', '_time'];
const isHiddenColumn = (name: string) => {
  if (HIDDEN_SUFFIXES.some((s) => name.endsWith(s))) return true;
  if (name.includes('_source_')) return true;
  if (name.endsWith('_id') && !name.endsWith('_concept_id')) return true;
  return false;
};

function formatDatetime(value: unknown): { date: string; time: string } | null {
  if (value == null || value === '') return null;
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return null;
  const date = d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
  const time = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
  return { date, time };
}

const OmopTableInlineWidget: React.FC<OmopTableInlineWidgetProps> = ({
  tableKey,
  personId,
  visitId,
  previewRows = 5,
}) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const conceptsState = useAppSelector((s) => s.ive.concepts);
  const [header, setHeader] = useState<string[]>([]);
  const [rows, setRows] = useState<unknown[][]>([]);
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const card = getTableCard(tableKey);

  const filters: Record<string, unknown> = {};
  if (personId != null) filters.person_id = personId;
  if (visitId != null) filters.visit_occurrence_id = visitId;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      getOmopRows(tableKey, { page: 1, pageSize: previewRows }, filters),
      getOmopCount(tableKey, filters).catch(() => 0),
    ])
      .then(([res, total]) => {
        if (cancelled) return;
        setHeader(res.header ?? []);
        setRows(res.rows ?? []);
        setCount(typeof total === 'number' && total >= 0 ? total : (res.rows?.length ?? 0));
      })
      .catch(() => {
        if (cancelled) return;
        setHeader([]);
        setRows([]);
        setCount(0);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableKey, personId, visitId, previewRows]);

  const previewCols = useMemo(
    () => header
      .map((name, idx) => ({ name, idx }))
      .filter(({ name }) => !isHiddenColumn(name)),
    [header],
  );

  const conceptColIdx = useMemo(
    () => previewCols
      .filter(({ name }) => name.endsWith('_concept_id'))
      .map(({ idx }) => idx),
    [previewCols],
  );

  useEffect(() => {
    if (conceptColIdx.length === 0 || rows.length === 0) return;
    const ids = new Set<string>();
    rows.forEach((row) => {
      conceptColIdx.forEach((ci) => {
        const v = row[ci];
        if (v != null && v !== '' && Number(v) !== 0) ids.add(String(v));
      });
    });
    ids.forEach((id) => loadConcept(dispatch, id, conceptsState));
  }, [rows, conceptColIdx, conceptsState, dispatch]);

  const goToTable = () => {
    const params = new URLSearchParams();
    if (personId != null) params.set('person_id', String(personId));
    if (visitId != null) params.set('visit_occurrence_id', String(visitId));
    navigate(`/ive/table/${encodeURIComponent(tableKey)}?${params.toString()}`);
  };

  return (
    <div className="flex flex-col">
      {card?.description && (
        <div className="px-4 py-2 text-[11px] text-slate-500 dark:text-slate-400">
          {card.description}
        </div>
      )}

      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 dark:bg-slate-800/30 border-y border-slate-200 dark:border-slate-800">
              {previewCols.map(({ name }) => (
                <th key={name} className="px-4 py-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">
                  {name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {rows.map((row, i) => (
              <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                {previewCols.map(({ name, idx }) => {
                  const v = row[idx];
                  if (v == null || v === '') {
                    return (
                      <td key={name} className="px-4 py-2 text-xs text-slate-700 dark:text-slate-300 font-mono whitespace-nowrap">
                        <span className="text-slate-400">—</span>
                      </td>
                    );
                  }
                  if (name.endsWith('_concept_id')) {
                    const rec = conceptsState.byId[String(v)];
                    const cname = rec?.concept_name;
                    const codePart = rec?.vocabulary_id && rec?.concept_code
                      ? `${rec.vocabulary_id}: ${rec.concept_code}`
                      : null;
                    const idPart = `CONCEPT_ID: ${v}`;
                    const sub = [codePart, idPart].filter(Boolean).join(' · ');
                    return (
                      <td key={name} className="px-4 py-2 text-xs whitespace-nowrap" title={`${name}: ${v}`}>
                        <div className="flex flex-col leading-tight">
                          <span className="text-slate-800 dark:text-slate-200">{cname ?? String(v)}</span>
                          {cname && (
                            <span className="text-[9px] text-slate-400 font-mono">{sub}</span>
                          )}
                        </div>
                      </td>
                    );
                  }
                  if (name.endsWith('_datetime')) {
                    const dt = formatDatetime(v);
                    if (dt) {
                      return (
                        <td key={name} className="px-4 py-2 text-xs whitespace-nowrap" title={String(v)}>
                          <span className="text-slate-700 dark:text-slate-300">{dt.date}</span>
                          <span className="text-slate-400 dark:text-slate-500 ml-1.5 font-mono">{dt.time}</span>
                        </td>
                      );
                    }
                  }
                  return (
                    <td key={name} className="px-4 py-2 text-xs text-slate-700 dark:text-slate-300 font-mono whitespace-nowrap">
                      {String(v)}
                    </td>
                  );
                })}
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={previewCols.length || 1} className="px-4 py-6 text-center text-xs text-slate-400 italic">
                  No records
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between px-4 py-2 text-[10px]">
        <span className="font-mono text-slate-400">
          {loading ? 'loading…' : `${count ?? 0} record${count === 1 ? '' : 's'}`}
        </span>
        <button
          onClick={goToTable}
          className="font-bold text-primary uppercase tracking-widest hover:underline flex items-center gap-1"
        >
          View all
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </button>
      </div>
    </div>
  );
};

export default OmopTableInlineWidget;
