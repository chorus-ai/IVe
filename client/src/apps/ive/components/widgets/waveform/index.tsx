import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts/core';
import { GridComponent, TooltipComponent, DataZoomComponent, TitleComponent } from 'echarts/components';
import { LineChart } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';
import { apiFetch } from '../../../../../hooks/useApiFetch';
import WidgetFrame from '../WidgetFrame';
import type { WidgetComponentProps } from '../types';
import useIsDark from '../../../hooks/useIsDark';

echarts.use([GridComponent, TooltipComponent, DataZoomComponent, TitleComponent, LineChart, CanvasRenderer]);

interface WfdbChannel {
  Channel: string;
  UOM: string;
  ID: number;
  Samples: (number | null)[];
}

interface WfdbResponse {
  StartTime: string | null;
  OffsetInSec: number;
  TicksPerSec: number;
  SamplesPerChannel: number;
  TotalSamples: number;
  DurationSec: number;
  WaveformData: WfdbChannel[];
}

interface ChannelBuffer {
  name: string;
  uom: string;
  id: number;
  samples: (number | null)[];
}

interface Buffer {
  startSec: number;
  fs: number;
  channels: ChannelBuffer[];
  baseTime: Date | null;
  totalSamples: number;
  durationSec: number;
}

const DEFAULT_FILENAME =
  'waveforms/mimic_iv/p100/p10079700/85594648/85594648_0001';

const CHUNK_SEC = 30;
const VIEW_SEC = 10;
const BUFFER_LIMIT_SEC = 300;
const PREFETCH_MARGIN_SEC = 5;

// Per-channel trace colors follow bedside-monitor conventions:
// ECG green, pleth/SpO2 cyan, arterial pressure red, respiration amber.
const TRACE_COLORS_LIGHT = ['#059669', '#0284c7', '#dc2626', '#d97706'];
const TRACE_COLORS_DARK = ['#34d399', '#38bdf8', '#f87171', '#fbbf24'];

interface ChartPalette {
  title: string;
  axisLabel: string;
  axisLine: string;
  splitLine: string;
  tooltipBg: string;
  tooltipBorder: string;
  tooltipText: string;
  sliderFiller: string;
  sliderBorder: string;
  sliderText: string;
}

// Light mode reads as clinical ECG paper: soft red millimeter grid on white.
const LIGHT_PALETTE: ChartPalette = {
  title: '#334155',
  axisLabel: '#64748b',
  axisLine: '#cbd5e1',
  splitLine: 'rgba(220,38,38,0.12)',
  tooltipBg: '#ffffff',
  tooltipBorder: '#e2e8f0',
  tooltipText: '#0f172a',
  sliderFiller: 'rgba(5,150,105,0.15)',
  sliderBorder: '#e2e8f0',
  sliderText: '#94a3b8',
};

const DARK_PALETTE: ChartPalette = {
  title: '#e2e8f0',
  axisLabel: '#94a3b8',
  axisLine: '#334155',
  splitLine: 'rgba(148,163,184,0.1)',
  tooltipBg: '#0f172a',
  tooltipBorder: '#1e293b',
  tooltipText: '#e2e8f0',
  sliderFiller: 'rgba(16,185,129,0.15)',
  sliderBorder: '#334155',
  sliderText: '#64748b',
};

function formatDuration(sec: number): string {
  if (!isFinite(sec)) return '—';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}h ${m}m ${s.toFixed(1)}s`;
  if (m > 0) return `${m}m ${s.toFixed(1)}s`;
  return `${s.toFixed(2)}s`;
}

// Parse the .hea start datetime ("YYYY-MM-DDTHH:MM:SS.mmm", no timezone → local).
function parseHeaTime(s: string | null): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

// Absolute clock time `sec` seconds after the record's first sample.
function formatAbsTime(base: Date | null, sec: number): string {
  if (!base) return '—';
  const d = new Date(base.getTime() + sec * 1000);
  const pad = (n: number, w = 2) => String(n).padStart(w, '0');
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`
  );
}

function bufferEnd(buf: Buffer): number {
  const len = buf.channels[0]?.samples.length ?? 0;
  return buf.startSec + len / buf.fs;
}

async function fetchChunk(filename: string, offset: number, range: number) {
  const params = new URLSearchParams({
    filename,
    offset: String(offset),
    range: String(range),
  });
  return apiFetch<WfdbResponse>(`/api/waveform/wfdb?${params}`);
}

interface ChartProps {
  channel: ChannelBuffer;
  fs: number;
  bufferStart: number;
  viewStart: number;
  viewEnd: number;
  syncGroup: string;
  palette: ChartPalette;
  traceColor: string;
  onZoom?: (start: number, end: number) => void;
}

const ChannelChart: React.FC<ChartProps> = ({
  channel, fs, bufferStart, viewStart, viewEnd, syncGroup, palette, traceColor, onZoom,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const chart = echarts.init(ref.current);
    chartRef.current = chart;
    chart.group = syncGroup;

    chart.setOption({
      animation: false,
      title: {
        text: `${channel.name} (${channel.uom || '—'})`,
        textStyle: { color: palette.title, fontSize: 12, fontWeight: 600 },
        left: 8, top: 4,
      },
      grid: { left: 50, right: 16, top: 28, bottom: 36 },
      tooltip: {
        trigger: 'axis',
        backgroundColor: palette.tooltipBg,
        borderColor: palette.tooltipBorder,
        textStyle: { color: palette.tooltipText, fontSize: 11 },
        valueFormatter: (v: number) => (v == null ? '—' : v.toFixed(3)),
      },
      xAxis: {
        type: 'value', name: 's',
        nameTextStyle: { color: palette.axisLabel, fontSize: 10 },
        axisLabel: { color: palette.axisLabel, fontSize: 10 },
        axisLine: { lineStyle: { color: palette.axisLine } },
        splitLine: { lineStyle: { color: palette.splitLine } },
      },
      yAxis: {
        type: 'value', scale: true,
        axisLabel: { color: palette.axisLabel, fontSize: 10 },
        axisLine: { lineStyle: { color: palette.axisLine } },
        splitLine: { lineStyle: { color: palette.splitLine } },
      },
      dataZoom: [
        { type: 'inside', xAxisIndex: 0 },
        {
          type: 'slider', xAxisIndex: 0, height: 16, bottom: 8,
          backgroundColor: 'transparent', fillerColor: palette.sliderFiller,
          borderColor: palette.sliderBorder, textStyle: { color: palette.sliderText, fontSize: 9 },
        },
      ],
      series: [{
        type: 'line', data: [], showSymbol: false, sampling: 'lttb',
        lineStyle: { color: traceColor, width: 1.2 }, connectNulls: false,
      }],
    });

    echarts.connect(syncGroup);

    if (onZoom) {
      chart.on('dataZoom', () => {
        const opt: any = chart.getOption();
        const dz = opt.dataZoom?.[0];
        if (dz && dz.startValue != null && dz.endValue != null) {
          onZoom(dz.startValue, dz.endValue);
        }
      });
    }

    const onResize = () => chart.resize();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      chart.dispose();
      chartRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    const data = channel.samples.map((v, i) => [bufferStart + i / fs, v]);
    chart.setOption({
      series: [{ data }],
      dataZoom: [
        { startValue: viewStart, endValue: viewEnd },
        { startValue: viewStart, endValue: viewEnd },
      ],
    });
  }, [channel, fs, bufferStart, viewStart, viewEnd]);

  return (
    <div
      ref={ref}
      className="w-full h-40 rounded-lg border border-slate-200 bg-[#fffcfa] dark:border-slate-800 dark:bg-slate-900/40"
    />
  );
};

interface WaveformPanelProps {
  defaultFilename?: string;
  defaultOffset?: number;
  showControls?: boolean;
  /**
   * Draw the panel's own card (rounded border + shadow). Off when the host
   * already provides one — a WidgetFrame or a modal — so the traces don't sit
   * in a box inside a box. A className can't do this: `border-0` and `border`
   * are both border-width utilities and which one wins depends on Tailwind's
   * output order, not on the order they're written in.
   */
  chrome?: boolean;
  className?: string;
}

let panelCounter = 0;

export const WaveformPanel: React.FC<WaveformPanelProps> = ({
  defaultFilename = DEFAULT_FILENAME,
  defaultOffset = 0,
  showControls = true,
  chrome = true,
  className = '',
}) => {
  const [filename, setFilename] = useState(defaultFilename);
  const [offset, setOffset] = useState(defaultOffset);
  const [buffer, setBuffer] = useState<Buffer | null>(null);
  const [viewStart, setViewStart] = useState(defaultOffset);
  const [viewEnd, setViewEnd] = useState(defaultOffset + VIEW_SEC);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isDark = useIsDark();
  const palette = isDark ? DARK_PALETTE : LIGHT_PALETTE;
  const traceColors = isDark ? TRACE_COLORS_DARK : TRACE_COLORS_LIGHT;

  const syncGroupRef = useRef<string>('');
  if (!syncGroupRef.current) syncGroupRef.current = `wfdb-sync-${++panelCounter}`;

  const bufferRef = useRef<Buffer | null>(null);
  const loadingRef = useRef(false);
  const filenameRef = useRef(filename);
  useEffect(() => { bufferRef.current = buffer; }, [buffer]);
  useEffect(() => { loadingRef.current = loading; }, [loading]);
  useEffect(() => { filenameRef.current = filename; }, [filename]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchChunk(filename, offset, CHUNK_SEC);
      const channels = (res.WaveformData ?? []).map((c) => ({
        name: c.Channel, uom: c.UOM, id: c.ID, samples: c.Samples ?? [],
      }));
      const fs = Number(res.TicksPerSec) || 1;
      const totalSamples = Number(res.TotalSamples) || channels[0]?.samples.length || 0;
      const durationSec = Number(res.DurationSec) || totalSamples / fs;
      const startSec = Number(res.OffsetInSec) || 0;
      // StartTime is the clock time at OffsetInSec; back it out to the record's
      // first sample so the base stays valid as the buffer extends/trims.
      const headerStart = parseHeaTime(res.StartTime);
      const baseTime = headerStart
        ? new Date(headerStart.getTime() - startSec * 1000)
        : null;
      const buf: Buffer = {
        startSec,
        fs,
        channels,
        baseTime,
        totalSamples,
        durationSec,
      };
      setBuffer(buf);
      setViewStart(buf.startSec);
      setViewEnd(buf.startSec + Math.min(VIEW_SEC, CHUNK_SEC));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBuffer(null);
    } finally {
      setLoading(false);
    }
  };

  const extendRight = useCallback(async () => {
    const buf = bufferRef.current;
    if (!buf || loadingRef.current) return;
    const nextOffset = bufferEnd(buf);
    if (nextOffset >= buf.durationSec) return;
    const remaining = buf.durationSec - nextOffset;
    const chunk = Math.min(CHUNK_SEC, remaining);
    if (chunk <= 0) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const res = await fetchChunk(filenameRef.current, nextOffset, chunk);
      const merged: ChannelBuffer[] = buf.channels.map((ch, i) => ({
        ...ch,
        samples: ch.samples.concat(res.WaveformData?.[i]?.Samples ?? []),
      }));
      const totalSec = merged[0].samples.length / buf.fs;
      let newStart = buf.startSec;
      if (totalSec > BUFFER_LIMIT_SEC) {
        const trimSamples = Math.floor((totalSec - BUFFER_LIMIT_SEC) * buf.fs);
        merged.forEach((ch) => { ch.samples = ch.samples.slice(trimSamples); });
        newStart += trimSamples / buf.fs;
      }
      setBuffer({ ...buf, startSec: newStart, channels: merged });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, []);

  const onZoom = useCallback((start: number, end: number) => {
    setViewStart(start);
    setViewEnd(end);
    const buf = bufferRef.current;
    if (!buf) return;
    const bufEnd = bufferEnd(buf);
    if (end > bufEnd - PREFETCH_MARGIN_SEC && bufEnd < buf.durationSec) {
      extendRight();
    }
  }, [extendRight]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const bufEnd = buffer ? bufferEnd(buffer) : 0;
  const bufferedSec = buffer ? bufEnd - buffer.startSec : 0;

  return (
    <div
      className={`bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100 ${
        chrome ? 'rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm' : ''
      } ${className}`}
    >
      {showControls && (
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-end gap-3">
          <label className="flex flex-col text-xs text-slate-500 dark:text-slate-400 flex-1 min-w-[280px]">
            Record path
            <input
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              className="mt-1 rounded bg-slate-50 border border-slate-300 px-2 py-1.5 text-sm text-slate-900 font-mono focus:border-emerald-500 focus:ring-emerald-500 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
            />
          </label>
          <label className="flex flex-col text-xs text-slate-500 dark:text-slate-400">
            Start offset (s){buffer && <span className="text-slate-400 dark:text-slate-600"> · max {buffer.durationSec.toFixed(1)}</span>}
            <input
              type="number"
              min={0}
              max={buffer?.durationSec}
              value={offset}
              onChange={(e) => {
                const v = Math.max(0, Number(e.target.value));
                setOffset(buffer ? Math.min(v, buffer.durationSec) : v);
              }}
              className="mt-1 w-28 rounded bg-slate-50 border border-slate-300 px-2 py-1.5 text-sm text-slate-900 focus:border-emerald-500 focus:ring-emerald-500 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
            />
          </label>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            {loading ? 'Loading…' : 'Load'}
          </button>
        </div>
      )}

      {buffer && (
        <div className="px-4 py-2 text-[11px] font-mono text-slate-500 border-b border-slate-200 dark:border-slate-800 flex gap-4 flex-wrap bg-slate-50/60 dark:bg-transparent rounded-none">
          <span>fs: {buffer.fs.toFixed(2)} Hz</span>
          <span>file: {formatDuration(buffer.durationSec)}</span>
          {buffer.baseTime && (
            <span className="text-slate-600 dark:text-slate-400">start: {formatAbsTime(buffer.baseTime, 0)}</span>
          )}
          <span>buffered: {buffer.startSec.toFixed(1)}s → {bufEnd.toFixed(1)}s ({bufferedSec.toFixed(0)}s / {BUFFER_LIMIT_SEC}s)</span>
          {buffer.baseTime ? (
            <span className="text-emerald-600 dark:text-emerald-400">
              view: {formatAbsTime(buffer.baseTime, viewStart)} → {formatAbsTime(buffer.baseTime, viewEnd)}
            </span>
          ) : (
            <span>view: {viewStart.toFixed(1)}s → {viewEnd.toFixed(1)}s</span>
          )}
        </div>
      )}

      <div className="p-4 space-y-3">
        {error && (
          <div className="rounded border border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300 text-sm px-3 py-2">
            {error}
          </div>
        )}
        {!error && !buffer && !loading && (
          <div className="text-slate-500 text-sm">No data.</div>
        )}
        {buffer?.channels.map((ch, idx) => (
          <ChannelChart
            // Palette colors are baked in at chart init; remount on theme flip.
            key={`${ch.id}-${isDark ? 'dark' : 'light'}`}
            channel={ch}
            fs={buffer.fs}
            bufferStart={buffer.startSec}
            viewStart={viewStart}
            viewEnd={viewEnd}
            syncGroup={syncGroupRef.current}
            palette={palette}
            traceColor={traceColors[idx % traceColors.length]}
            onZoom={idx === 0 ? onZoom : undefined}
          />
        ))}
      </div>
    </div>
  );
};


/* ───────────────── Widget wrapper ───────────────── */

export interface WaveformConfig {
  /** WFDB record path; falls back to the panel's built-in sample record. */
  filename?: string;
  /** Start offset in seconds. */
  offset?: number;
  /**
   * Deprecated. The dashboard widget never renders the record-path / offset
   * row — the record is set in the widget's settings, so an editable copy of
   * it inside the dashboard was duplicate UI. Older saved layouts still carry
   * `showControls: true` from a previous default; it is ignored. The standalone
   * /ive/waveform page still has the controls.
   */
  showControls?: boolean;
}

const WaveformWidget: React.FC<WidgetComponentProps<WaveformConfig>> = ({
  title, config, isEditMode, onRemove, onEdit,
}) => (
  <WidgetFrame title={title} isEditMode={isEditMode} onRemove={onRemove} onEdit={onEdit}>
    <WaveformPanel
      // The panel only reads its props as initial state; remount on change.
      key={`${config.filename ?? ''}:${config.offset ?? 0}`}
      defaultFilename={config.filename || undefined}
      defaultOffset={config.offset}
      showControls={false}
      chrome={false}
    />
  </WidgetFrame>
);

export default WaveformWidget;
