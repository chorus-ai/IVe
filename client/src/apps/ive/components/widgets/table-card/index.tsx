import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import WidgetFrame from '../WidgetFrame';
import { useAppDispatch, useAppSelector } from '../../../../../hooks/redux';
import { getOmopCount, getOmopRows } from '../../../api/omop';
import { loadConcept } from '../../../api/concepts';
import { getTableCard, type OmopTables } from '../../../types';
import type { WidgetComponentProps } from '../types';
import type { TableCardConfig } from './settings';

const PREVIEW_ROWS = 5;
const PREVIEW_COLS = 4;

const OmopTableCardWidget: React.FC<WidgetComponentProps<TableCardConfig>> = ({
  title,
  isEditMode,
  config,
  onRemove,
  onEdit,
}) => {
  const { tableKey, personId, visitId } = config;
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const conceptsState = useAppSelector((s) => s.ive.concepts);
  const [header, setHeader] = useState<string[]>([]);
  const [rows, setRows] = useState<unknown[][]>([]);
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const card = tableKey ? getTableCard(tableKey) : undefined;

  useEffect(() => {
    if (!tableKey) { setLoading(false); return; }
    const filters: Record<string, unknown> = {};
    if (personId != null) filters.person_id = personId;
    if (visitId != null) filters.visit_occurrence_id = visitId;
    let cancelled = false;
    setLoading(true);
    Promise.all([
      getOmopRows(tableKey, { page: 1, pageSize: PREVIEW_ROWS }, filters),
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
  }, [tableKey, personId, visitId]);

  const previewHeaders = header.slice(0, PREVIEW_COLS);

  const conceptColIdx = useMemo(
    () => previewHeaders
      .map((h, i) => (h.endsWith('_concept_id') ? i : -1))
      .filter((i) => i >= 0),
    [previewHeaders],
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

  if (!tableKey) {
    return (
      <WidgetFrame title={title} isEditMode={isEditMode} onRemove={onRemove} onEdit={onEdit}>
        <div className="p-6 text-sm text-slate-400 italic">Select an OMOP table in this widget's settings.</div>
      </WidgetFrame>
    );
  }

  return (
    <WidgetFrame
      title={title}
      isEditMode={isEditMode}
      onRemove={onRemove}
      onEdit={onEdit}
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-[10px] font-mono text-slate-400">
            {loading ? 'loading…' : `${count ?? 0} record${count === 1 ? '' : 's'}`}
          </span>
          <button
            onClick={() => {
              const params = new URLSearchParams();
              if (personId != null) params.set('person_id', String(personId));
              if (visitId != null) params.set('visit_occurrence_id', String(visitId));
              navigate(`/ive/table/${encodeURIComponent(tableKey)}?${params.toString()}`);
            }}
            className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline flex items-center gap-1"
          >
            View all
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>
      }
    >
      <div className="overflow-x-auto custom-scrollbar">
        {card && (
          <div className="px-4 py-2 text-[11px] text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
            {card.description}
          </div>
        )}
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-200 dark:border-slate-800">
              {previewHeaders.map((h) => (
                <th key={h} className="px-4 py-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {rows.map((row, i) => (
              <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                {previewHeaders.map((h, ci) => {
                  const v = row[ci];
                  if (v == null || v === '') {
                    return (
                      <td key={ci} className="px-4 py-2 text-xs text-slate-700 dark:text-slate-300 font-mono whitespace-nowrap">
                        <span className="text-slate-400">—</span>
                      </td>
                    );
                  }
                  if (h.endsWith('_concept_id')) {
                    const name = conceptsState.byId[String(v)]?.concept_name;
                    return (
                      <td key={ci} className="px-4 py-2 text-xs text-slate-700 dark:text-slate-300 whitespace-nowrap" title={`${h}: ${v}`}>
                        {name ?? String(v)}
                      </td>
                    );
                  }
                  return (
                    <td key={ci} className="px-4 py-2 text-xs text-slate-700 dark:text-slate-300 font-mono whitespace-nowrap">
                      {String(v)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </WidgetFrame>
  );
};

export default OmopTableCardWidget;
