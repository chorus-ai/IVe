import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../../../hooks/redux';
import { getOmopRows, type OmopTabularResponse } from '../../../api/omop';
import { loadConcept } from '../../../api/concepts';
import ConceptHoverIcon from '../../ConceptHoverIcon';
import WidgetFrame from '../WidgetFrame';
import type { WidgetComponentProps } from '../types';
import { CohortWidgetConfig, personOf } from './settings';
import { RequestSpec, useTemplatedFetch } from './requestTemplate';

export interface PersonMeasurementsConfig extends CohortWidgetConfig {
  /**
   * Optional custom request template; overrides the built-in measurement
   * query. Placeholders: {{personId}}, {{limit}}. Must return
   * { header, rows } with measurement_date, measurement_concept_id,
   * value_as_number, unit_source_value, measurement_source_value columns.
   */
  request?: RequestSpec;
}

interface MeasurementRow {
  date: string;
  conceptId: string;
  value: string;
  unit: string;
  source: string;
}

const PersonMeasurementsWidget: React.FC<WidgetComponentProps<PersonMeasurementsConfig>> = ({
  title, config, isEditMode, onRemove, onEdit,
}) => {
  const personId = personOf(config);
  const limit = config.limit ?? 10;

  const dispatch = useAppDispatch();
  const conceptsState = useAppSelector((s) => s.ive.concepts);
  const [rows, setRows] = useState<MeasurementRow[]>([]);
  const [loading, setLoading] = useState(true);

  const templatedFetch = useTemplatedFetch<OmopTabularResponse>(config.request, { personId, limit });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setRows([]);

    const load = templatedFetch
      ?? (() => getOmopRows('measurement', { page: 1, pageSize: 0, sortField: 'measurement_date', sortOrder: 'DESC' } as any, { person_id: personId }));
    load()
      .then((res) => {
        if (cancelled) return;
        const dateIdx = res.header.indexOf('measurement_date');
        const conceptIdx = res.header.indexOf('measurement_concept_id');
        const valIdx = res.header.indexOf('value_as_number');
        const unitIdx = res.header.indexOf('unit_source_value');
        const sourceIdx = res.header.indexOf('measurement_source_value');
        const all: MeasurementRow[] = res.rows
          .map((row) => ({
            date: dateIdx >= 0 ? String(row[dateIdx] ?? '') : '',
            conceptId: conceptIdx >= 0 ? String(row[conceptIdx] ?? '') : '',
            value: valIdx >= 0 && row[valIdx] != null ? String(row[valIdx]) : '',
            unit: unitIdx >= 0 ? String(row[unitIdx] ?? '') : '',
            source: sourceIdx >= 0 ? String(row[sourceIdx] ?? '') : '',
          }))
          .filter((r) => r.date)
          .sort((a, b) => (a.date < b.date ? 1 : -1))
          .slice(0, limit);
        setRows(all);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [personId, limit, templatedFetch]);

  useEffect(() => {
    const ids = Array.from(new Set(rows.map((r) => r.conceptId)));
    ids.forEach((id) => loadConcept(dispatch, id, conceptsState));
  }, [rows, conceptsState, dispatch]);

  return (
    <WidgetFrame title={title} isEditMode={isEditMode} onRemove={onRemove} onEdit={onEdit}>
      <div className="h-full">
        <div className="flex items-center justify-between px-4 py-2 bg-slate-50 dark:bg-slate-800/30 border-b border-slate-200 dark:border-slate-800">
          <span className="text-[10px] text-slate-400 font-mono ml-auto">
            {loading ? 'loading…' : `${rows.length} latest`}
          </span>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-200 dark:border-slate-800">
                {['Date', 'Concept', 'Value', 'Unit', 'Source'].map((h) => (
                  <th key={h} className="px-4 py-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-3 text-xs text-slate-400">Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-3 text-xs text-slate-400">No measurements.</td></tr>
              ) : (
                rows.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-2 text-[11px] font-mono text-slate-500">{r.date}</td>
                    <td className="px-4 py-2 text-xs italic text-slate-700 dark:text-slate-300">
                      <span className="inline-flex items-center gap-1">
                        {(() => {
                          const rec = conceptsState.byId[r.conceptId];
                          if (!rec) {
                            return (
                              <span className="font-mono not-italic text-slate-400" title={`Concept ${r.conceptId}`}>
                                #{r.conceptId}
                              </span>
                            );
                          }
                          const name = rec.concept_name;
                          return (
                            <span title={name ?? `Concept ${r.conceptId} (no name)`}>
                              {name ?? <span className="not-italic text-slate-400">—</span>}
                            </span>
                          );
                        })()}
                        <ConceptHoverIcon conceptId={r.conceptId} />
                      </span>
                    </td>
                    <td className="px-4 py-2 text-xs font-bold text-slate-800 dark:text-white tabular-nums">
                      {r.value || <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-2 text-[11px] text-slate-500">{r.unit || <span className="text-slate-400">—</span>}</td>
                    <td className="px-4 py-2 text-[11px] text-slate-500 italic">{r.source || <span className="text-slate-400">—</span>}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </WidgetFrame>
  );
};

export default PersonMeasurementsWidget;
