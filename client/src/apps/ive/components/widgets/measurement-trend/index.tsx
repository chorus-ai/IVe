import React, { useEffect, useMemo, useState } from 'react';
import WidgetFrame from '../WidgetFrame';
import { getOmopRows, type OmopTabularResponse } from '../../../api/omop';
import type { WidgetComponentProps } from '../types';
import { CohortWidgetConfig, personOf } from './settings';
import { RequestSpec, useTemplatedFetch } from './requestTemplate';

export interface MeasurementTrendConfig extends CohortWidgetConfig {
  /** Comma-separated measurement_concept_id list (exact match, preferred). */
  conceptIds?: string;
  /** Substring match on measurement_source_value (fallback when concept ids are unknown). */
  sourceValue?: string;
  /**
   * Optional custom request template; overrides the built-in measurement
   * query. Placeholders: {{personId}}, {{conceptIds}} (number[]),
   * {{sourceValue}}. Must return { header, rows } with measurement_date,
   * value_as_number, unit_source_value columns.
   */
  request?: RequestSpec;
}

interface Point {
  date: string;
  value: number;
}

const W = 600;
const H = 160;
const PAD_Y = 0.05;

const fmt = (v: number) =>
  Math.abs(v) >= 100 ? v.toFixed(0) : Math.abs(v) >= 10 ? v.toFixed(1) : v.toFixed(2);

const MeasurementTrendWidget: React.FC<WidgetComponentProps<MeasurementTrendConfig>> = ({
  title, config, isEditMode, onRemove, onEdit,
}) => {
  const personId = personOf(config);
  const { conceptIds, sourceValue, limit = 100 } = config;
  const color = config.color ?? '#136dec';

  const [points, setPoints] = useState<Point[]>([]);
  const [unit, setUnit] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hover, setHover] = useState<number | null>(null);

  const ids = useMemo(
    () => (conceptIds ?? '')
      .split(',')
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isFinite(n) && n > 0),
    [conceptIds],
  );

  // Custom template: live fields are injected into the saved spec.
  const templatedFetch = useTemplatedFetch<OmopTabularResponse>(config.request, {
    personId, conceptIds: ids, sourceValue: sourceValue ?? '',
  });

  useEffect(() => {
    let load = templatedFetch;
    if (!load) {
      const filters: Record<string, unknown> = { person_id: personId };
      if (ids.length) filters.measurement_concept_id = ids;
      else if (sourceValue) filters.measurement_source_value = sourceValue;
      else { setPoints([]); setLoading(false); return; }
      load = () => getOmopRows(
        'measurement',
        { page: 1, pageSize: 0, sortField: 'measurement_date', sortOrder: 'ASC' } as any,
        filters,
      );
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setHover(null);
    load()
      .then((res) => {
        if (cancelled) return;
        const dateIdx = res.header.indexOf('measurement_date');
        const valIdx = res.header.indexOf('value_as_number');
        const unitIdx = res.header.indexOf('unit_source_value');
        const all = res.rows
          .map((row) => ({
            date: dateIdx >= 0 ? String(row[dateIdx] ?? '') : '',
            value: valIdx >= 0 && row[valIdx] != null ? Number(row[valIdx]) : NaN,
            unit: unitIdx >= 0 ? String(row[unitIdx] ?? '') : '',
          }))
          .filter((r) => r.date && Number.isFinite(r.value))
          .sort((a, b) => (a.date < b.date ? -1 : 1));
        const recent = all.slice(-limit);
        setPoints(recent.map(({ date, value }) => ({ date, value })));
        setUnit(recent.find((r) => r.unit)?.unit ?? '');
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Request failed');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personId, ids, sourceValue, limit, templatedFetch]);

  const geo = useMemo(() => {
    if (points.length === 0) return null;
    const values = points.map((p) => p.value);
    let min = Math.min(...values);
    let max = Math.max(...values);
    if (min === max) { min -= 1; max += 1; }
    const span = max - min;
    min -= span * PAD_Y;
    max += span * PAD_Y;
    // Fraction coords (fx→time order, fy→value); reused by SVG path and HTML overlay.
    const fract = points.map((p, i) => ({
      fx: points.length === 1 ? 0.5 : i / (points.length - 1),
      fy: (p.value - min) / (max - min),
    }));
    const path = fract
      .map((f, i) => `${i === 0 ? 'M' : 'L'}${(f.fx * W).toFixed(1)},${((1 - f.fy) * H).toFixed(1)}`)
      .join(' ');
    const area = `${path} L${(fract[fract.length - 1].fx * W).toFixed(1)},${H} L${(fract[0].fx * W).toFixed(1)},${H} Z`;
    return { fract, path, area, min: Math.min(...values), max: Math.max(...values) };
  }, [points]);

  const last = points[points.length - 1];
  const hovered = hover != null ? points[hover] : null;

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!geo || points.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const fx = (e.clientX - rect.left) / rect.width;
    let best = 0;
    geo.fract.forEach((f, i) => {
      if (Math.abs(f.fx - fx) < Math.abs(geo.fract[best].fx - fx)) best = i;
    });
    setHover(best);
  };

  return (
    <WidgetFrame title={title} isEditMode={isEditMode} onRemove={onRemove} onEdit={onEdit}>
      <div className="p-4">
        {error && (
          <p className="text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg p-2 mb-3">{error}</p>
        )}

        <div className="flex items-baseline justify-between mb-3">
          <div className="flex items-baseline gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-full self-center" style={{ backgroundColor: color }}></span>
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {hovered ? fmt(hovered.value) : last ? fmt(last.value) : '—'}
            </span>
            {unit && <span className="text-xs font-bold text-slate-400 dark:text-slate-500">{unit}</span>}
          </div>
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            {hovered ? hovered.date : last ? `Latest · ${last.date}` : ''}
          </span>
        </div>

        {points.length > 0 && geo ? (
          <>
            <div
              className={`relative h-40 ${loading ? 'opacity-50' : ''}`}
              onMouseMove={onMove}
              onMouseLeave={() => setHover(null)}
            >
              <svg
                className="w-full h-full text-slate-200 dark:text-slate-800"
                viewBox={`0 0 ${W} ${H}`}
                preserveAspectRatio="none"
              >
                {[0.25, 0.5, 0.75].map((f) => (
                  <line key={f} x1={0} x2={W} y1={H * f} y2={H * f} stroke="currentColor" strokeWidth={1} vectorEffect="non-scaling-stroke" />
                ))}
                <path d={geo.area} fill={color} opacity={0.08} />
                <path d={geo.path} fill="none" stroke={color} strokeWidth={2} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
              </svg>
              {hover != null && (
                <div
                  className="absolute w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-900 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                  style={{
                    backgroundColor: color,
                    left: `${geo.fract[hover].fx * 100}%`,
                    top: `${(1 - geo.fract[hover].fy) * 100}%`,
                  }}
                ></div>
              )}
            </div>
            <div className="flex justify-between mt-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              <span>{points[0].date}</span>
              <span>min {fmt(geo.min)} · max {fmt(geo.max)} · n={points.length}</span>
              <span>{last.date}</span>
            </div>
          </>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400 italic py-8 text-center">
            {loading ? 'Loading…' : conceptIds || sourceValue ? 'No measurements found.' : 'Configure concept IDs or a source value.'}
          </p>
        )}
      </div>
    </WidgetFrame>
  );
};

export default MeasurementTrendWidget;
