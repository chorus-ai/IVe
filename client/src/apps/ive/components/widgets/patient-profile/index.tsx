import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../../../../hooks/useApiFetch';
import { useAppDispatch, useAppSelector } from '../../../../../hooks/redux';
import { getOmopRows, getOmopCount } from '../../../api/omop';
import { loadConcept } from '../../../api/concepts';
import type { WidgetComponentProps } from '../types';
import type { PatientProfileConfig } from './settings';

interface PersonRecord {
  person_id?: number | string;
  year_of_birth?: number | null;
  month_of_birth?: number | null;
  day_of_birth?: number | null;
  gender_concept_id?: number | null;
  race_concept_id?: number | null;
  provider_id?: number | null;
  person_source_value?: string | null;
}

const formatDob = (p: PersonRecord | null) => {
  if (!p?.year_of_birth) return null;
  const y = p.year_of_birth;
  const m = p.month_of_birth;
  const d = p.day_of_birth;
  if (m && d) {
    return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
  return String(y);
};

const PatientProfileWidget: React.FC<WidgetComponentProps<PatientProfileConfig>> = ({
  isEditMode,
  config,
  onRemove,
  onEdit,
}) => {
  const personId = config.personId;
  const dispatch = useAppDispatch();
  const conceptsState = useAppSelector((s) => s.ive.concepts);
  const [person, setPerson] = useState<PersonRecord | null>(null);
  const [lastActivityConceptId, setLastActivityConceptId] = useState<string | null>(null);
  const [totalVisits, setTotalVisits] = useState<number | null>(null);
  const [allergies, setAllergies] = useState<string[]>([]);

  const resolveName = (id: number | string | null | undefined): string | null => {
    if (id == null) return null;
    const rec = conceptsState.byId[String(id)];
    if (!rec) return null;
    return rec.concept_name ?? '—';
  };
  const genderName = resolveName(person?.gender_concept_id);
  const raceName = resolveName(person?.race_concept_id);

  useEffect(() => {
    if (person) {
      loadConcept(dispatch, person.gender_concept_id, conceptsState);
      loadConcept(dispatch, person.race_concept_id, conceptsState);
    }
    if (lastActivityConceptId) {
      loadConcept(dispatch, lastActivityConceptId, conceptsState);
    }
  }, [person, lastActivityConceptId, conceptsState, dispatch]);

  const lastActivity = lastActivityConceptId
    ? resolveName(lastActivityConceptId) ?? `#${lastActivityConceptId}`
    : null;

  useEffect(() => {
    if (!personId) return;
    let cancelled = false;

    apiFetch<PersonRecord>(`/api/omop/person/${personId}`)
      .then((res) => { if (!cancelled) setPerson(res); })
      .catch(() => { if (!cancelled) setPerson(null); });

    getOmopRows('measurement', { page: 1, pageSize: 1000 }, { person_id: personId })
      .then(({ header, rows }) => {
        if (cancelled || rows.length === 0) return;
        const dateIdx = header.indexOf('measurement_date');
        const conceptIdx = header.indexOf('measurement_concept_id');
        if (dateIdx < 0 || conceptIdx < 0) return;
        let latest: unknown[] | null = null;
        let latestDate = '';
        rows.forEach((r) => {
          const d = r[dateIdx] ? String(r[dateIdx]) : '';
          if (d && d > latestDate) {
            latestDate = d;
            latest = r;
          }
        });
        if (!latest) return;
        const conceptId = (latest as unknown[])[conceptIdx];
        if (conceptId == null) return;
        setLastActivityConceptId(String(conceptId));
      })
      .catch(() => {});

    getOmopCount('visit_occurrence', { person_id: personId })
      .then((c) => { if (!cancelled) setTotalVisits(c >= 0 ? c : null); })
      .catch(() => {});

    getOmopRows('observation', { page: 1, pageSize: 50 }, { person_id: personId })
      .then(({ header, rows }) => {
        if (cancelled) return;
        const srcIdx = header.indexOf('observation_source_value');
        const valIdx = header.indexOf('value_as_string');
        if (srcIdx < 0 && valIdx < 0) return;
        const found = new Set<string>();
        rows.forEach((r) => {
          const src = srcIdx >= 0 ? String(r[srcIdx] ?? '') : '';
          const val = valIdx >= 0 ? String(r[valIdx] ?? '') : '';
          const hit = [src, val].find((s) => /allerg/i.test(s));
          if (hit) found.add(hit);
        });
        setAllergies(Array.from(found).slice(0, 4));
      })
      .catch(() => {});

    return () => { cancelled = true; };
  }, [personId]);

  const dob = formatDob(person);
  const archiveCode = person?.person_source_value ?? (personId ? String(personId) : '—');

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all group overflow-hidden ${isEditMode ? 'ring-1 ring-slate-300 dark:ring-slate-700/50' : ''}`}>
      {isEditMode && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-700/30 transition-colors">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-slate-400 dark:text-slate-500 cursor-grab active:cursor-grabbing hover:text-primary transition-colors">drag_indicator</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit?.(); }}
              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              <span className="material-symbols-outlined text-lg">settings</span>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onRemove?.(); }}
              className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        </div>
      )}

      <div className="p-6 flex flex-col md:flex-row items-center gap-8">
        <div className="flex items-center gap-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Person #{personId ?? '—'}</h2>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-slate-500 text-white text-[10px] font-bold rounded uppercase tracking-widest">ARCHIVE: {archiveCode}</span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                DOB: {dob ?? '—'} {dob ? '(Historical)' : ''}
              </span>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
              Recorded Provider:{' '}
              {person?.provider_id != null ? (
                <span className="text-primary hover:underline cursor-pointer">{person.provider_id}</span>
              ) : (
                <span className="text-slate-400">—</span>
              )}
            </p>
          </div>
        </div>

        <div className="hidden md:block h-12 w-px bg-slate-200 dark:bg-slate-800 mx-2"></div>

        <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-6 w-full">
          <div>
            <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Gender/Race</p>
            <div className="flex flex-wrap gap-1">
              <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-500 text-[9px] font-bold rounded border border-blue-500/20">
                {genderName ?? 'NA'}
              </span>
              <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-500 text-[9px] font-bold rounded border border-emerald-500/20">
                {raceName ?? 'NA'}
              </span>
            </div>
          </div>
          <div>
            <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Last Activity</p>
            <span className="text-sm font-bold text-slate-800 dark:text-white">
              {lastActivity ?? <span className="text-slate-400 font-normal">—</span>}
            </span>
          </div>
          <div>
            <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Total Visits</p>
            <span className="text-sm font-bold text-slate-800 dark:text-white">
              {totalVisits != null ? totalVisits.toLocaleString() : <span className="text-slate-400 font-normal">—</span>}
            </span>
          </div>
          <div>
            <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Documented Allergies</p>
            {allergies.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {allergies.map((a) => (
                  <span key={a} className="px-1.5 py-0.5 bg-red-500/10 text-red-500 text-[9px] font-bold rounded border border-red-500/20">
                    {a}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">No allergies recorded</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientProfileWidget;
