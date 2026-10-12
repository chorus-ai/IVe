import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as echarts from 'echarts/core';
import {
  TooltipComponent,
  GridComponent,
  DataZoomComponent,
} from 'echarts/components';
import { CustomChart } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';

import { getOmopRows as realGetOmopRows, type OmopTabularResponse } from '../../../api/omop';
import { listWaveformRecords, type WaveformRecord } from '../../../api/waveformIndex';
import { loadConcept } from '../../../api/concepts';
import { useAppDispatch, useAppSelector } from '../../../../../hooks/redux';
import WidgetFrame from '../WidgetFrame';
import { WaveformPanel } from '../waveform';
import { Popup } from '../../ui/Popup';
import StudyPopup from './StudyPopup';
import type { WidgetComponentProps } from '../types';
import {
  CohortWidgetConfig,
  DEFAULT_END_DATE,
  DEFAULT_START_DATE,
  personOf,
} from './settings';

echarts.use([TooltipComponent, GridComponent, DataZoomComponent, CustomChart, CanvasRenderer]);

const USE_MOCK = false;

const HOUR = 3600 * 1000;
const DAY = 24 * HOUR;
const ROW_HEIGHT = 36;
const GRID_TOP = 16;
const GRID_BOTTOM = 60;
const BAR_WIDTH = 3;

type CategoryDef = {
  table: string;
  label: string;
  color: string;
  dateField: string;
  dateColPreferred: string;
  dateColFallback: string;
  conceptCol: string;
};

const CATEGORY_DEFS: CategoryDef[] = [
  { table: 'visit_detail',         label: 'Visit',        color: '#a855f7',
    dateField: 'visit_detail_start_date',    dateColPreferred: 'visit_detail_start_datetime',    dateColFallback: 'visit_detail_start_date',    conceptCol: 'visit_detail_concept_id' },
  { table: 'condition_occurrence', label: 'Condition',    color: '#f97316',
    dateField: 'condition_start_date',       dateColPreferred: 'condition_start_datetime',       dateColFallback: 'condition_start_date',       conceptCol: 'condition_concept_id' },
  { table: 'drug_exposure',        label: 'Drug',         color: '#3b82f6',
    dateField: 'drug_exposure_start_date',   dateColPreferred: 'drug_exposure_start_datetime',   dateColFallback: 'drug_exposure_start_date',   conceptCol: 'drug_concept_id' },
  { table: 'procedure_occurrence', label: 'Procedure',    color: '#8b5cf6',
    dateField: 'procedure_date',             dateColPreferred: 'procedure_datetime',             dateColFallback: 'procedure_date',             conceptCol: 'procedure_concept_id' },
  { table: 'device_exposure',      label: 'Device',       color: '#06b6d4',
    dateField: 'device_exposure_start_date', dateColPreferred: 'device_exposure_start_datetime', dateColFallback: 'device_exposure_start_date', conceptCol: 'device_concept_id' },
  { table: 'measurement',          label: 'Measurement',  color: '#10b981',
    dateField: 'measurement_date',           dateColPreferred: 'measurement_datetime',           dateColFallback: 'measurement_date',           conceptCol: 'measurement_concept_id' },
  { table: 'observation',          label: 'Observation',  color: '#f59e0b',
    dateField: 'observation_date',           dateColPreferred: 'observation_datetime',           dateColFallback: 'observation_date',           conceptCol: 'observation_concept_id' },
];

// Rows that are not OMOP tables. Appended after CATEGORY_DEFS so the OMOP
// category indices are unchanged.
const IMAGING_LABEL = 'Imaging';
const WAVEFORM_LABEL = 'Waveform';
const IMAGING_COLOR = '#ec4899';
// Concept text that marks a procedure as imaging. A placeholder for the
// procedure -> StudyInstanceUID link the IVe spec calls for.
const IMAGING_RE =
  /(x-?ray|radiograph|\bct\b|computed tomograph|\bmri\b|magnetic resonance|ultrasound|sonograph|angiograph|mammograph|fluoroscop|imaging)/;
const WAVEFORM_COLOR = '#E9967A';

/**
 * Seconds into the record each successive waveform block opens at. The blocks
 * are positions in time, but they all resolve to one WFDB file, so without a
 * per-block offset every click would show the same opening traces. `_seq` on
 * each event carries its position; the viewer gets `_seq * WAVEFORM_BLOCK_OFFSET_SEC`.
 */
const WAVEFORM_BLOCK_OFFSET_SEC = 300;

const CATEGORIES = [...CATEGORY_DEFS.map((c) => c.label), IMAGING_LABEL, WAVEFORM_LABEL];
const IMAGING_CI = CATEGORY_DEFS.length;
const WAVEFORM_CI = CATEGORY_DEFS.length + 1;

const MOCK_DENSITY: Record<string, number> = {
  visit_detail: 14,
  condition_occurrence: 25,
  drug_exposure: 60,
  procedure_occurrence: 15,
  device_exposure: 6,
  measurement: 120,
  observation: 40,
};

const toIsoDate = (ts: number) => new Date(ts).toISOString().slice(0, 10);

/**
 * Demo fallback for the two non-OMOP rows.
 *
 * Used only when the real source returns nothing: most OMOP subjects have no
 * imaging procedures, and waveform records need a `waveformPrefix` pointing at
 * a bucket folder. Real data always wins, so this disappears on its own the
 * moment either source has rows.
 */
const DEMO_FALLBACK = true;

/** Instants: a few studies spread across the window. */
const mockImagingEvents = (startTs: number, endTs: number) => {
  const span = endTs - startTs;
  const studies = [
    { at: 0.04, label: 'XR CHEST 1 VIEW PORTABLE' },
    { at: 0.21, label: 'CT CHEST W CONTRAST' },
    { at: 0.38, label: 'XR CHEST 2 VIEWS' },
    { at: 0.66, label: 'MRI BRAIN W WO CONTRAST' },
    { at: 0.87, label: 'XR CHEST 1 VIEW PORTABLE' },
  ];
  return studies.map(({ at, label }, seq) => {
    const ts = startTs + span * at;
    return {
      name: IMAGING_LABEL,
      value: [IMAGING_CI, ts],
      itemStyle: { color: IMAGING_COLOR },
      _ci: IMAGING_CI,
      _kind: 'imaging',
      _demo: true,
      _seq: seq,
      _detail: { study: label, acquired: new Date(ts).toISOString(), source: 'demo' },
    };
  });
};

/**
 * Intervals: a handful of continuous recordings with gaps between them, which
 * is what a real bedside monitor produces — it is disconnected for transport
 * or a procedure and resumes after.
 *
 * Each block is `[startFraction, endFraction]` of whatever window the caller
 * asks for, so the widths on screen are real durations: the recordings stay
 * proportional whether the range is a week or a year, and no two are the same
 * length. Fixed rather than random so the row doesn't reshuffle on re-render.
 */
const MOCK_WAVEFORM_BLOCKS: [number, number][] = [
  [0.02, 0.14],
  [0.21, 0.33],
  [0.40, 0.62],
  [0.68, 0.76],
  [0.84, 0.97],
];

const mockWaveformEvents = (startTs: number, endTs: number) => {
  const span = endTs - startTs;
  return MOCK_WAVEFORM_BLOCKS.map(([from, to], seq) => {
    const begin = startTs + span * from;
    const end = startTs + span * to;
    return {
      name: WAVEFORM_LABEL,
      value: [WAVEFORM_CI, begin, end],
      itemStyle: { color: WAVEFORM_COLOR },
      _ci: WAVEFORM_CI,
      _kind: 'waveform',
      _demo: true,
      _seq: seq,
      _record: `demo/EPICU_DEMO-${Math.floor(begin / 1000)}`,
      _detail: {
        record: `EPICU_DEMO-${Math.floor(begin / 1000)}`,
        start: new Date(begin).toISOString(),
        end: new Date(end).toISOString(),
        duration_hours: ((end - begin) / HOUR).toFixed(1),
        channels: 'II, III, PLETH, RESP',
        source: 'demo',
      },
    };
  });
};

const mockGetOmopRows = (
  table: string,
  _params: { page: number; pageSize: number },
  filters?: Record<string, unknown>,
): Promise<OmopTabularResponse> => {
  const def = CATEGORY_DEFS.find((d) => d.table === table);
  if (!def) return Promise.resolve({ header: [], rows: [] });

  const dateFilter = filters?.[def.dateField] as { between?: [string, string] } | undefined;
  const fromTs = dateFilter?.between?.[0] ? new Date(dateFilter.between[0]).getTime() : Date.now() - 30 * DAY;
  const toTs = dateFilter?.between?.[1] ? new Date(dateFilter.between[1]).getTime() + DAY - 1 : Date.now();

  const header = [def.dateColFallback, def.dateColPreferred, def.conceptCol];
  const count = MOCK_DENSITY[table] ?? 20;
  const rows: unknown[][] = [];
  for (let i = 0; i < count; i++) {
    const ts = fromTs + Math.random() * (toTs - fromTs);
    const d = new Date(ts);
    rows.push([
      d.toISOString().slice(0, 10),
      d.toISOString().replace('T', ' ').slice(0, 19),
      1000000 + Math.floor(Math.random() * 99999),
    ]);
  }

  const latency = 150 + Math.random() * 500;
  return new Promise((resolve) => setTimeout(() => resolve({ header, rows, count }), latency));
};

const getOmopRows = USE_MOCK ? mockGetOmopRows : realGetOmopRows;

interface CohortEventsTimelineProps {
  personId: string | number;
  startDate: string;
  endDate: string;
  /**
   * Scope every query to one visit instead of the whole person. The date range
   * then only frames the axis — the queries themselves are filtered by
   * `visit_occurrence_id` alone, so nothing recorded under the visit is
   * dropped for falling a few hours outside its start/end dates.
   */
  visitId?: string | number;
  /** When rendered inside a WidgetFrame, drop the standalone card chrome. */
  embedded?: boolean;
  /**
   * Bucket prefix holding this subject's waveform records, e.g.
   * `output/EPICU_E4104A`. Omitted, the Waveform row stays empty — there is no
   * waveform index table, so records are discovered by listing the bucket and
   * only layouts that carry a timestamp can be placed on the axis.
   */
  waveformPrefix?: string;
}

export const CohortEventsTimeline: React.FC<CohortEventsTimelineProps> = ({ personId, startDate, endDate, visitId, embedded, waveformPrefix }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);
  const [view, setView] = useState<{ start: number; end: number } | null>(null);
  const [data, setData] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [hoverTip, setHoverTip] = useState<{ x: number; y: number; text: string } | null>(null);
  const dispatch = useAppDispatch();
  const conceptsState = useAppSelector((s) => s.ive.concepts);

  // Build the dynamic y-axis: for each category, either one row (collapsed) or
  // one row per unique concept_id (expanded). Each row carries enough metadata
  // to remap data points and to handle click-toggle.
  const displayRows = useMemo(() => {
    const rows: {
      ci: number;
      conceptId: string | null;
      label: string;          // rich-text formatted for axis
      plainLabel: string;     // raw label (used for click matching)
      color: string;
    }[] = [];
    CATEGORY_DEFS.forEach((def, ci) => {
      const items = data.filter((d) => d._ci === ci);
      const total = items.length;
      const distinct = new Set(items.map((d) => String(d._conceptId ?? '∅'))).size;

      if (!expanded.has(ci)) {
        rows.push({
          ci,
          conceptId: null,
          plainLabel: def.label,
          label: `{name|${def.label}} {n|${total}} {d|${distinct}}`,
          color: def.color,
        });
        return;
      }
      const seen = new Set<string>();
      items.forEach((d) => seen.add(String(d._conceptId ?? '∅')));
      const cids = Array.from(seen).sort();
      if (cids.length === 0) {
        rows.push({
          ci,
          conceptId: null,
          plainLabel: def.label,
          label: `{name|${def.label}} {n|0}`,
          color: def.color,
        });
        return;
      }
      cids.forEach((cid) => {
        const sub = items.filter((d) => String(d._conceptId ?? '∅') === cid).length;
        const subLabel = `${def.label} #${cid}`;
        rows.push({
          ci,
          conceptId: cid,
          plainLabel: subLabel,
          label: `{sub|${subLabel}} {n|${sub}}`,
          color: def.color,
        });
      });
    });

      // The non-OMOP rows. No concept expansion, so one row each.
      [
        { ci: IMAGING_CI, label: IMAGING_LABEL, color: IMAGING_COLOR },
        { ci: WAVEFORM_CI, label: WAVEFORM_LABEL, color: WAVEFORM_COLOR },
      ].forEach(({ ci, label, color }) => {
        const total = data.filter((d) => d._ci === ci).length;
        rows.push({
          ci,
          conceptId: null,
          plainLabel: label,
          label: `{name|${label}} {n|${total}} {d|}`,
          color,
        });
      });

    return rows;
  }, [data, expanded]);

  const indexLookup = useMemo(() => {
    const m = new Map<string, number>();
    displayRows.forEach((r, i) => m.set(`${r.ci}|${r.conceptId ?? '*'}`, i));
    return m;
  }, [displayRows]);

  const seriesData = useMemo(() => data.map((d) => {
    const cid = expanded.has(d._ci) ? String(d._conceptId ?? '∅') : '*';
    const idx = indexLookup.get(`${d._ci}|${cid}`);
    // Only the row index changes here. Everything after the timestamp has to
    // survive — value[2] is the interval end, and dropping it makes
    // renderItem treat a multi-hour recording as an instant and draw it at
    // BAR_WIDTH instead of stretching it across its real duration.
    return idx == null ? d : { ...d, value: [idx, ...d.value.slice(1)] };
  }), [data, expanded, indexLookup]);

  const chartHeight = GRID_TOP + GRID_BOTTOM + ROW_HEIGHT * Math.max(displayRows.length, 1);

  const displayRowsRef = useRef(displayRows);
  displayRowsRef.current = displayRows;
  const conceptsStateRef = useRef(conceptsState);
  conceptsStateRef.current = conceptsState;
  const personIdRef = useRef(personId);
  personIdRef.current = personId;
  const dispatchRef = useRef(dispatch);
  dispatchRef.current = dispatch;

  // Kick off concept-name loads for every distinct concept_id currently visible
  // in an expanded category row. Cached via redux; safe to call repeatedly.
  useEffect(() => {
    displayRows.forEach((r) => {
      if (r.conceptId && r.conceptId !== '∅') loadConcept(dispatch, r.conceptId, conceptsState);
    });
  }, [displayRows, conceptsState, dispatch]);

  const startTs = useMemo(() => new Date(startDate).getTime(), [startDate]);
  const endTs = useMemo(
    () => Math.max(startTs + DAY, new Date(endDate).getTime() + DAY - 1),
    [startTs, endDate],
  );

  // Fetch all categories once for the full range; stream each in as it returns.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setData([]);

    const fromDate = toIsoDate(startTs);
    const toDate = toIsoDate(endTs);
    const byVisit = visitId != null && visitId !== '';

    /**
     * Person scope needs the date range to keep the query bounded; visit scope
     * is already bounded by the visit itself, so it takes everything filed
     * under the visit and the range only frames the axis.
     *
     * `person_id` stays in the visit filter too: the server only grants the
     * unbounded `pageSize: 0` exception to a request scoped by a single
     * person_id, so dropping it makes every query fail validation.
     */
    const scopeFilter = (dateField: string) =>
      byVisit
        ? { person_id: personId, visit_occurrence_id: visitId }
        : { person_id: personId, [dateField]: { between: [fromDate, toDate] } };

    let pending = CATEGORY_DEFS.length;

    // Waveform recordings are not an OMOP table: they are discovered from the
    // bucket and drawn as intervals. `waveformPrefix` comes from settings —
    // EPICU records carry an epoch in the filename, which is what makes them
    // placeable on a calendar axis at all.
    const seedWaveformDemo = () => {
      if (cancelled || !DEMO_FALLBACK) return;
      setData((prev) => [
        ...prev.filter((d) => d.value[0] !== WAVEFORM_CI),
        ...mockWaveformEvents(startTs, endTs),
      ]);
    };

    if (!waveformPrefix) {
      seedWaveformDemo();
    } else {
      listWaveformRecords(waveformPrefix)
        .then((records: WaveformRecord[]) => {
          if (cancelled) return;
          const rows = records
            .filter((r) => r.startMs != null)
            .map((r, seq) => ({
              name: WAVEFORM_LABEL,
              value: [WAVEFORM_CI, r.startMs, r.startMs! + (r.durationSec ?? 0) * 1000],
              itemStyle: { color: WAVEFORM_COLOR },
              _ci: WAVEFORM_CI,
              _kind: 'waveform',
              _seq: seq,
              _record: r.record,
              _detail: {
                record: r.label,
                start: new Date(r.startMs!).toISOString(),
                duration_hours: ((r.durationSec ?? 0) / 3600).toFixed(2),
              },
            }));
          if (!rows.length) return seedWaveformDemo();
          setData((prev) => [...prev.filter((d) => d.value[0] !== WAVEFORM_CI), ...rows]);
        })
        .catch(seedWaveformDemo);
    }



    // Imaging events ride on procedure_occurrence, which is where the dates
    // are — /api/dicom/studies deliberately omits StudyDate as an identifier.
    // There is no procedure -> StudyInstanceUID mapping yet, so imaging rows
    // are identified by concept text rather than by a real link.
    getOmopRows('procedure_occurrence', { page: 1, pageSize: 0 }, scopeFilter('procedure_date'))
      .then((res) => {
        if (cancelled) return;
        const pdt = res.header.indexOf('procedure_datetime');
        const pd = res.header.indexOf('procedure_date');
        const dIdx = pdt >= 0 ? pdt : pd;
        if (dIdx < 0) return;
        let imagingSeq = 0;
        const rows = res.rows
          .map((row) => {
            const ts = new Date(String(row[dIdx])).getTime();
            if (!Number.isFinite(ts)) return null;
            const detail = {};
            res.header.forEach((h, i) => { detail[h] = row[i]; });
            const blob = JSON.stringify(detail).toLowerCase();
            if (!IMAGING_RE.test(blob)) return null;
            return {
              name: IMAGING_LABEL,
              value: [IMAGING_CI, ts],
              itemStyle: { color: IMAGING_COLOR },
              _ci: IMAGING_CI,
              _kind: 'imaging',
              _seq: imagingSeq++,
              _detail: detail,
            };
          })
          .filter(Boolean);
        const finalRows = rows.length || !DEMO_FALLBACK
          ? rows
          : mockImagingEvents(startTs, endTs);
        setData((prev) => [...prev.filter((d) => d.value[0] !== IMAGING_CI), ...finalRows]);
      })
      .catch(() => {
        if (cancelled || !DEMO_FALLBACK) return;
        setData((prev) => [
          ...prev.filter((d) => d.value[0] !== IMAGING_CI),
          ...mockImagingEvents(startTs, endTs),
        ]);
      });

    CATEGORY_DEFS.forEach((def, ci) => {
      getOmopRows(def.table, { page: 1, pageSize: 0 }, scopeFilter(def.dateField))
        .then((res) => {
          if (cancelled) return;
          const dateIdx = res.header.indexOf(def.dateColPreferred);
          const fbIdx = res.header.indexOf(def.dateColFallback);

          const rows = res.rows
            .map((row) => {
              const raw = (dateIdx >= 0 ? row[dateIdx] : null) ?? (fbIdx >= 0 ? row[fbIdx] : null);
              if (raw == null || raw === '') return null;
              const ts = new Date(String(raw)).getTime();
              if (!Number.isFinite(ts)) return null;
              const detail: Record<string, unknown> = {};
              res.header.forEach((h, i) => { detail[h] = row[i]; });
              const conceptIdx = res.header.indexOf(def.conceptCol);
              const conceptId = conceptIdx >= 0 ? row[conceptIdx] : null;
              return {
                name: def.label,
                value: [ci, ts],
                itemStyle: { color: def.color },
                _table: def.table,
                _ci: ci,
                _conceptId: conceptId,
                _detail: detail,
              };
            })
            .filter(Boolean) as any[];

          setData((prev) => [...prev.filter((d) => d.value[0] !== ci), ...rows]);
        })
        .finally(() => {
          if (cancelled) return;
          if (--pending === 0) setLoading(false);
        });
    });

    return () => { cancelled = true; };
  }, [startTs, endTs, personId, visitId]);

  // Init chart once.
  useEffect(() => {
    if (!containerRef.current) return;
    const chart = echarts.init(containerRef.current);
    chartRef.current = chart;

    const renderItem = (params: any, api: any) => {
      const ci = api.value(0);
      const point = api.coord([api.value(1), ci]);
      const height = api.size([0, 1])[1] * 0.4;

      // value[2] = end timestamp. A waveform block is a continuous recording, so
      // it spans its real duration instead of being drawn as an instant — a 24h
      // record and a lab draw should not look alike. Floored at BAR_WIDTH so a
      // short record stays visible when the axis is zoomed out.
      const endVal = api.value(2);
      const isInterval = endVal != null && Number.isFinite(Number(endVal));
      const width = isInterval
        ? Math.max(api.coord([Number(endVal), ci])[0] - point[0], BAR_WIDTH)
        : BAR_WIDTH;
      const x = isInterval ? point[0] : point[0] - BAR_WIDTH / 2;

      const rect = echarts.graphic.clipRectByRect(
        { x, y: point[1] - height / 2, width, height },
        { x: params.coordSys.x, y: params.coordSys.y, width: params.coordSys.width, height: params.coordSys.height },
      );
      if (!rect) return;
      const r = BAR_WIDTH / 2;
      return {
        type: 'rect',
        shape: { ...rect, r: [r, r, r, r] },
        style: api.style(),
      };
    };

    setView({ start: startTs, end: endTs });

    chart.setOption({
      tooltip: {
        confine: true,
        backgroundColor: '#ffffff',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        textStyle: { color: '#0f172a' },
        extraCssText: 'max-width: 360px; white-space: normal; box-shadow: 0 10px 24px rgba(15,23,42,0.12);',
        // Four fields only. The row's other columns were noise — the OMOP
        // tables are wide and the dump pushed the useful values off the top.
        // concept_name comes from the same redux concept cache the y-axis
        // hover reads, so an id already resolved there shows a name here.
        formatter: (params: any) => {
          const d = params.data || {};
          const escape = (v: unknown) =>
            String(v).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c] as string));
          const fmt = (t: number) => new Date(t).toISOString().replace('T', ' ').slice(0, 19);

          const cid = d._conceptId;
          const key = cid == null ? null : String(cid);
          const cached = key ? conceptsStateRef.current.byId[key] : null;
          const conceptName = cached?.concept_name
            ?? (key && conceptsStateRef.current.loading[key] ? 'loading…' : null);

          // Measurement-ish columns, in the order the table returns them:
          // value_as_number, value_as_concept_id, value_source_value,
          // range_low, range_high, unit_concept_id, unit_source_value. A
          // condition or drug row has none of these, so nothing is appended.
          const measures = Object.entries(d._detail || {}).filter(([k]) =>
            /^(value|range|unit)/i.test(k),
          ) as [string, unknown][];

          const rows: [string, unknown][] = [
            ['person_id', personIdRef.current],
            ['timestamp', fmt(params.value[1])],
            ['concept_id', cid],
            ['concept_name', conceptName],
            ...measures,
          ];

          const body = rows
            .map(([k, v]) => {
              const val = v == null || v === ''
                ? '<span style="color:#94a3b8">—</span>'
                : `<span style="color:#1e293b">${escape(v)}</span>`;
              return (
                `<tr><td style="color:#64748b;padding-right:10px;font-size:10px;white-space:nowrap">${k}</td>` +
                `<td style="font-size:10px;font-family:ui-monospace,Menlo,monospace">${val}</td></tr>`
              );
            })
            .join('');

          return `<table style="border-collapse:collapse">${body}</table>`;
        },
      },
      grid: { left: 140, right: 16, top: GRID_TOP, bottom: GRID_BOTTOM },
      xAxis: {
        type: 'value',
        min: startTs,
        max: endTs,
        scale: true,
        axisLabel: {
          fontSize: 10,
          color: '#94a3b8',
          formatter: (val: number) => {
            const d = new Date(val);
            return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:00`;
          },
        },
        splitLine: { lineStyle: { color: '#e2e8f033' } },
      },
      yAxis: {
        data: CATEGORIES,
        triggerEvent: true,
        axisLabel: {
          fontSize: 10,
          color: '#64748b',
          fontWeight: 600,
          formatter: (v: string) => v,
          rich: {
            name: { color: '#475569', fontWeight: 700, fontSize: 10, padding: [0, 4, 0, 0] },
            sub: { color: '#64748b', fontWeight: 500, fontSize: 9, padding: [0, 4, 0, 0] },
            n: {
              color: '#334155',
              backgroundColor: 'rgba(100, 116, 139, 0.18)',
              padding: [2, 5, 2, 5],
              borderRadius: 8,
              fontSize: 9,
              fontWeight: 700,
            },
            d: {
              color: '#1d4ed8',
              backgroundColor: 'rgba(59, 130, 246, 0.18)',
              padding: [2, 5, 2, 5],
              borderRadius: 8,
              fontSize: 9,
              fontWeight: 700,
            },
          },
        },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      dataZoom: [
        { type: 'slider', filterMode: 'weakFilter', showDataShadow: false, height: 20, bottom: 16, start: 0, end: 100, labelFormatter: '' },
        { type: 'inside', filterMode: 'weakFilter', start: 0, end: 100, zoomOnMouseWheel: true, moveOnMouseMove: true },
      ],
      animation: true,
      animationDurationUpdate: 300,
      series: [{
        type: 'custom',
        renderItem,
        itemStyle: { opacity: 0.85 },
        encode: { x: 1, y: 0 },
        animation: false,
        data: [],
      }],
    });

    const onZoom = () => {
      const opt: any = chart.getOption();
      const dz = opt?.dataZoom?.[0];
      if (!dz) return;
      const span = endTs - startTs;
      const s = typeof dz.startValue === 'number' ? dz.startValue : startTs + ((dz.start ?? 0) / 100) * span;
      const e = typeof dz.endValue === 'number' ? dz.endValue : startTs + ((dz.end ?? 100) / 100) * span;
      setView({ start: s, end: e });
    };
    chart.on('datazoom', onZoom);

    // Click on a waveform or imaging block opens it in a viewer; click on a
    // y-axis label toggles expansion for that category.
    const onAxisClick = (params: any) => {
      if (params.componentType === 'series') {
        const d = params.data || {};
        if (d._kind === 'waveform' || d._kind === 'imaging') setSelected(d);
        return;
      }
      if (params.componentType !== 'yAxis' || params.targetType !== 'axisLabel') return;
      const idx = typeof params.dataIndex === 'number' ? params.dataIndex : -1;
      const row = idx >= 0 ? displayRowsRef.current[idx] : null;
      const ci = row
        ? row.ci
        : CATEGORY_DEFS.findIndex((d) => {
            const label = String(params.value ?? '');
            return label === d.label || label.startsWith(`${d.label} #`);
          });
      if (ci < 0) return;
      setExpanded((prev) => {
        const next = new Set(prev);
        if (next.has(ci)) next.delete(ci);
        else next.add(ci);
        return next;
      });
    };
    chart.on('click', onAxisClick);

    const onAxisHover = (params: any) => {
      // Hovering a point warms its concept name. Only expanded rows preload
      // theirs, so without this a collapsed category's tooltip could only ever
      // show the bare id. loadConcept is cached and deduped, so repeat hovers
      // over the same concept cost nothing.
      if (params.componentType === 'series') {
        const cid = params.data?._conceptId;
        if (cid != null && cid !== '') {
          loadConcept(dispatchRef.current, cid, conceptsStateRef.current);
        }
        return;
      }
      if (params.componentType !== 'yAxis' || params.targetType !== 'axisLabel') return;
      const idx = typeof params.dataIndex === 'number' ? params.dataIndex : -1;
      const row = idx >= 0 ? displayRowsRef.current[idx] : null;
      if (!row || !row.conceptId || row.conceptId === '∅') {
        setHoverTip(null);
        return;
      }
      const ev = params.event?.event as MouseEvent | undefined;
      const rect = containerRef.current?.getBoundingClientRect();
      const x = ev && rect ? ev.clientX - rect.left : 12;
      const y = ev && rect ? ev.clientY - rect.top : 12;
      const cached = conceptsStateRef.current.byId[String(row.conceptId)];
      const name = cached?.concept_name;
      const text = name
        ? `${name} (${row.conceptId})`
        : `Concept ${row.conceptId}${conceptsStateRef.current.loading[String(row.conceptId)] ? ' · loading…' : ''}`;
      setHoverTip({ x: x + 12, y: y + 12, text });
    };
    const onAxisLeave = (params: any) => {
      if (params.componentType !== 'yAxis' || params.targetType !== 'axisLabel') return;
      setHoverTip(null);
    };
    chart.on('mouseover', onAxisHover);
    chart.on('mouseout', onAxisLeave);

    const onResize = () => chart.resize();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      chart.off('datazoom', onZoom);
      chart.off('click', onAxisClick);
      chart.off('mouseover', onAxisHover);
      chart.off('mouseout', onAxisLeave);
      chart.dispose();
      chartRef.current = null;
    };
  }, [startTs, endTs]);

  // Update y-axis labels and series data when data or expansion changes.
  // Run on the next frame so the container's new height (driven by displayRows)
  // is committed before chart.resize() recomputes the grid.
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    const raf = requestAnimationFrame(() => {
      chart.resize();
      chart.setOption({
        yAxis: { data: displayRows.map((r) => r.label) },
        series: [{ data: seriesData }],
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [seriesData, displayRows]);

  const fmtTs = (t: number) => {
    const d = new Date(t);
    const p = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
  };
  const spanH = view ? (view.end - view.start) / HOUR : (endTs - startTs) / HOUR;
  const totalH = (endTs - startTs) / HOUR;

  return (
    <div className={embedded ? 'h-full' : 'bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl overflow-hidden'}>
      <div className="flex items-center justify-between px-4 py-2 bg-slate-50 dark:bg-slate-800/30 border-b border-slate-200 dark:border-slate-800">
        {!embedded && (
          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest">
            Subject Events Timeline
          </span>
        )}
        <span className="text-[10px] text-slate-400 font-mono ml-auto">
          {visitId ? `visit ${visitId}` : `person ${personId}`} ·{' '}
          {view ? `${fmtTs(view.start)} → ${fmtTs(view.end)}` : `${startDate} → ${endDate}`}
          {' · '}{spanH.toFixed(1)}h / {totalH.toFixed(0)}h
          {loading ? ' · loading…' : ` · ${data.length} events`}
        </span>
      </div>
      <div className="relative">
        <div ref={containerRef} className="w-full" style={{ height: chartHeight }} />
        {hoverTip && (
          <div
            className="pointer-events-none absolute z-20 rounded-md border px-2 py-1 text-[11px] shadow-lg"
            style={{
              left: hoverTip.x,
              top: hoverTip.y,
              maxWidth: 320,
              background: '#0f172a',
              borderColor: '#1e293b',
              color: '#e2e8f0',
            }}
          >
            {hoverTip.text}
          </div>
        )}
      </div>

      {/*
        The traces for the clicked recording. `showControls={false}` drops the
        record-path and offset header — the block already says which record
        this is, and it isn't editable from here. A demo block has no real
        record behind it, so the panel falls back to its own default file.
      */}
      <Popup
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={
          selected?._kind === 'imaging'
            ? `Imaging · ${selected?._detail?.study ?? 'Study'}`
            : selected?._detail?.record
              ? `Waveform · ${selected._detail.record}`
              : 'Waveform'
        }
        widthClass="w-[90vw] max-w-none"
      >
        {selected?._kind === 'imaging' ? (
          <StudyPopup key={`study:${selected?._seq ?? 0}`} seq={selected?._seq ?? 0} />
        ) : (
          <WaveformPanel
            key={`${selected?._record ?? 'default'}:${selected?._seq ?? 0}`}
            showControls={false}
            chrome={false}
            defaultFilename={selected?._demo ? undefined : selected?._record}
            defaultOffset={(selected?._seq ?? 0) * WAVEFORM_BLOCK_OFFSET_SEC}
          />
        )}
      </Popup>
    </div>
  );
};


/* ───────────────── Widget wrapper ───────────────── */

const CohortTimelineWidget: React.FC<WidgetComponentProps<CohortWidgetConfig>> = ({
  title, config, isEditMode, onRemove, onEdit,
}) => (
  <WidgetFrame title={title} isEditMode={isEditMode} onRemove={onRemove} onEdit={onEdit}>
    <CohortEventsTimeline
      embedded
      personId={personOf(config)}
      startDate={config.startDate ?? DEFAULT_START_DATE}
      endDate={config.endDate ?? DEFAULT_END_DATE}
    />
  </WidgetFrame>
);

export default CohortTimelineWidget;
