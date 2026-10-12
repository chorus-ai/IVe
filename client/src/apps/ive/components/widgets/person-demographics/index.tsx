import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../../../hooks/redux';
import { getOmopRows } from '../../../api/omop';
import { loadConcept } from '../../../api/concepts';
import WidgetFrame from '../WidgetFrame';
import type { WidgetComponentProps } from '../types';
import { CohortWidgetConfig, personOf } from './settings';

const resolveDemographic = (sourceValue: unknown, conceptName: string | null) => {
  const src = sourceValue == null || sourceValue === '' ? null : String(sourceValue);
  return src ?? conceptName;
};

const PersonDemographicsWidget: React.FC<WidgetComponentProps<CohortWidgetConfig>> = ({
  title, config, isEditMode, onRemove, onEdit,
}) => {
  const personId = personOf(config);
  const dispatch = useAppDispatch();
  const conceptsState = useAppSelector((s) => s.ive.concepts);
  const [row, setRow] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [deathRow, setDeathRow] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setRow(null);
    setDeathRow(null);

    Promise.all([
      getOmopRows('person', { page: 1, pageSize: 1 }, { person_id: personId }),
      getOmopRows('death', { page: 1, pageSize: 1 }, { person_id: personId }).catch(() => null),
    ])
      .then(([personRes, deathRes]) => {
        if (cancelled) return;
        const r = personRes?.rows?.[0];
        if (r && personRes.header) {
          const obj: Record<string, unknown> = {};
          personRes.header.forEach((h, i) => { obj[h] = r[i]; });
          setRow(obj);
        }
        if (deathRes && deathRes.rows?.[0] && deathRes.header) {
          const dobj: Record<string, unknown> = {};
          deathRes.header.forEach((h, i) => { dobj[h] = deathRes.rows[0][i]; });
          setDeathRow(dobj);
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [personId]);

  useEffect(() => {
    if (!row) return;
    loadConcept(dispatch, row.gender_concept_id as any, conceptsState);
    loadConcept(dispatch, row.race_concept_id as any, conceptsState);
    loadConcept(dispatch, row.ethnicity_concept_id as any, conceptsState);
  }, [row, conceptsState, dispatch]);

  const lookupName = (id: unknown): string | null => {
    if (id == null || id === '') return null;
    const rec = conceptsState.byId[String(id)];
    if (!rec) return null;
    return rec.concept_name ?? '—';
  };
  const genderName = lookupName(row?.gender_concept_id);
  const raceName = lookupName(row?.race_concept_id);
  const ethnicityName = lookupName(row?.ethnicity_concept_id);

  const gender = resolveDemographic(row?.gender_source_value, genderName);
  const race = resolveDemographic(row?.race_source_value, raceName);
  const ethnicity = resolveDemographic(row?.ethnicity_source_value, ethnicityName);
  const yob = row?.year_of_birth as number | string | null | undefined;
  const deathDate = (deathRow?.death_date ?? null) as string | null;

  const fields: { label: string; value: string | number | null | undefined }[] = [
    { label: 'Gender', value: gender },
    { label: 'Year of Birth', value: yob },
    { label: 'Race', value: race },
    { label: 'Ethnicity', value: ethnicity },
    { label: 'Death Date', value: deathDate },
  ];

  return (
    <WidgetFrame title={title} isEditMode={isEditMode} onRemove={onRemove} onEdit={onEdit}>
      <div className="p-4">
        {loading ? (
          <div className="text-xs text-slate-400">Loading…</div>
        ) : !row ? (
          <div className="text-xs text-slate-400">No person record found.</div>
        ) : (
          <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3">
            <div>
              <dt className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Person ID</dt>
              <dd className="text-sm font-bold text-slate-800 dark:text-white font-mono">{String(personId)}</dd>
            </div>
            {fields.map((f) => {
              const isDeath = f.label === 'Death Date';
              const empty = f.value == null || f.value === '';
              return (
                <div key={f.label}>
                  <dt className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{f.label}</dt>
                  <dd
                    className={`text-sm font-medium ${
                      isDeath && !empty
                        ? 'text-red-600 dark:text-red-400 font-mono'
                        : 'text-slate-800 dark:text-white'
                    }`}
                  >
                    {empty ? <span className="text-slate-400">—</span> : String(f.value)}
                  </dd>
                </div>
              );
            })}
          </dl>
        )}
      </div>
    </WidgetFrame>
  );
};

export default PersonDemographicsWidget;
