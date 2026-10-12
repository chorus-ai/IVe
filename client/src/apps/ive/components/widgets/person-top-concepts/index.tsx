import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../../../hooks/redux';
import { getOmopRows, type OmopTabularResponse } from '../../../api/omop';
import { loadConcept } from '../../../api/concepts';
import ConceptHoverIcon from '../../ConceptHoverIcon';
import WidgetFrame from '../WidgetFrame';
import type { WidgetComponentProps } from '../types';
import { CohortWidgetConfig, personOf } from './settings';
import { RequestSpec, useTemplatedFetch } from './requestTemplate';

export interface PersonTopConceptsConfig extends CohortWidgetConfig {
  /**
   * Optional custom request template; overrides the built-in table query.
   * Placeholders: {{personId}}, {{table}}, {{conceptCol}}, {{limit}}.
   * Must return { header, rows } including the conceptCol column.
   */
  request?: RequestSpec;
}

const PersonTopConceptsWidget: React.FC<WidgetComponentProps<PersonTopConceptsConfig>> = ({
  title, config, isEditMode, onRemove, onEdit,
}) => {
  const personId = personOf(config);
  const table = config.table ?? 'condition_occurrence';
  const conceptCol = config.conceptCol ?? 'condition_concept_id';
  const limit = config.limit ?? config.topN ?? 8;
  const color = config.color ?? '#f97316';

  const dispatch = useAppDispatch();
  const conceptsState = useAppSelector((s) => s.ive.concepts);
  const [items, setItems] = useState<{ id: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const templatedFetch = useTemplatedFetch<OmopTabularResponse>(config.request, {
    personId, table, conceptCol, limit,
  });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setItems([]);
    setTotal(0);

    const load = templatedFetch ?? (() => getOmopRows(table, { page: 1, pageSize: 0 }, { person_id: personId }));
    load()
      .then((res) => {
        if (cancelled) return;
        const idx = res.header.indexOf(conceptCol);
        if (idx < 0) return;
        const counts = new Map<string, number>();
        res.rows.forEach((row) => {
          const cid = row[idx];
          if (cid == null) return;
          const k = String(cid);
          counts.set(k, (counts.get(k) ?? 0) + 1);
        });
        const sorted = Array.from(counts.entries())
          .map(([id, count]) => ({ id, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, limit);
        setItems(sorted);
        setTotal(res.rows.length);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [table, conceptCol, personId, limit, templatedFetch]);

  useEffect(() => {
    items.forEach((it) => loadConcept(dispatch, it.id, conceptsState));
  }, [items, conceptsState, dispatch]);

  const max = items[0]?.count ?? 1;

  return (
    <WidgetFrame title={title} isEditMode={isEditMode} onRemove={onRemove} onEdit={onEdit}>
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-4 py-2 bg-slate-50 dark:bg-slate-800/30 border-b border-slate-200 dark:border-slate-800">
          <span className="text-[10px] text-slate-400 font-mono ml-auto">
            {loading ? 'loading…' : `${items.length} of ${total} events`}
          </span>
        </div>
        <div className="p-4 space-y-2">
          {loading ? (
            <div className="text-xs text-slate-400">Loading…</div>
          ) : items.length === 0 ? (
            <div className="text-xs text-slate-400">No records.</div>
          ) : (
            items.map((it) => (
              <div key={it.id} className="space-y-0.5">
                <div className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="inline-flex min-w-0 items-center gap-1 text-slate-700 dark:text-slate-300">
                    {(() => {
                      const rec = conceptsState.byId[it.id];
                      if (!rec) {
                        return (
                          <span className="truncate font-mono text-slate-400" title={`Concept ${it.id}`}>
                            #{it.id}
                          </span>
                        );
                      }
                      const name = rec.concept_name;
                      return (
                        <span className="truncate font-medium" title={name ?? `Concept ${it.id} (no name)`}>
                          {name ?? <span className="text-slate-400">—</span>}
                        </span>
                      );
                    })()}
                    <ConceptHoverIcon conceptId={it.id} />
                  </span>
                  <span className="shrink-0 font-bold text-slate-700 dark:text-slate-300 tabular-nums">{it.count}</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${(it.count / max) * 100}%`, background: color }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </WidgetFrame>
  );
};

export default PersonTopConceptsWidget;
