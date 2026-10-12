import React, { useMemo } from 'react';
import WidgetFrame from '../WidgetFrame';
import type { WidgetComponentProps } from '../types';
import { CohortWidgetConfig, personOf, DEFAULT_START_DATE } from './settings';
import { buildAxis, genWalk, histogram, mulberry32, seedFrom } from './mockSeries';

export type VitalsMonitorConfig = CohortWidgetConfig;

interface ChannelDef {
  key: string;
  label: string;
  color: string;
  base: number;
  jitter: number;
  spikeMag: number;
  min: number;
  max: number;
  upperLimit?: number;
  lowerLimit?: number;
}

/** Trend channels mirroring the SuperAlarm review screen: HR, RESP, SpO2-R. */
const CHANNELS: ChannelDef[] = [
  { key: 'hr',   label: 'HR',     color: '#06b6d4', base: 84, jitter: 4,   spikeMag: 55, min: 40, max: 160, upperLimit: 130 },
  { key: 'resp', label: 'RESP',   color: '#dc2626', base: 18, jitter: 5,   spikeMag: 18, min: 2,  max: 45,  upperLimit: 30, lowerLimit: 5 },
  { key: 'spo2', label: 'SPO2-R', color: '#2563eb', base: 96, jitter: 1.5, spikeMag: -9, min: 78, max: 100, lowerLimit: 88 },
];

const N = 720; // one sample per minute over the 12 h window
const W = 720;
const H = 96;
const HIST_BINS = 28;

const limitY = (ch: ChannelDef, v: number) => H - ((v - ch.min) / (ch.max - ch.min)) * H;

const TrendRow: React.FC<{ ch: ChannelDef; values: number[] }> = ({ ch, values }) => {
  const path = useMemo(
    () => values
      .map((v, i) => `${i === 0 ? 'M' : 'L'}${((i / (values.length - 1)) * W).toFixed(1)},${limitY(ch, v).toFixed(1)}`)
      .join(' '),
    [ch, values],
  );
  const bins = useMemo(() => histogram(values, ch.min, ch.max, HIST_BINS), [ch, values]);

  const limitLine = (v: number, label: string) => (
    <>
      <line
        x1={0} x2={W} y1={limitY(ch, v)} y2={limitY(ch, v)}
        stroke="#dc2626" strokeWidth={1} strokeDasharray="5 4" vectorEffect="non-scaling-stroke" opacity={0.7}
      />
      <text x={W - 4} y={limitY(ch, v) - 3} textAnchor="end" fontSize={10} fill="#dc2626">
        {label}={v}
      </text>
    </>
  );

  return (
    <div className="flex items-stretch gap-3">
      <div className="w-6 shrink-0 flex items-center justify-center">
        <span
          className="text-[10px] font-bold tracking-widest"
          style={{ color: ch.color, writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
        >
          {ch.label}
        </span>
      </div>

      <div className="flex-1 min-w-0 rounded border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
        <svg className="w-full h-24 align-top" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
          {ch.upperLimit != null && limitLine(ch.upperLimit, 'Upper limit')}
          {ch.lowerLimit != null && limitLine(ch.lowerLimit, 'Lower limit')}
          <path d={path} fill="none" stroke={ch.color} strokeWidth={1} vectorEffect="non-scaling-stroke" />
        </svg>
      </div>

      {/* Distribution of the window's samples, limits marked in red. */}
      <div className="w-28 shrink-0 rounded border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
        <svg className="w-full h-24 align-top" viewBox={`0 0 ${HIST_BINS * 4} 100`} preserveAspectRatio="none">
          {bins.map((h, i) => (
            <rect key={i} x={i * 4 + 0.5} y={100 - h * 92} width={3} height={h * 92} fill={ch.color} opacity={0.85} />
          ))}
          {[ch.upperLimit, ch.lowerLimit].filter((v): v is number => v != null).map((v) => {
            const x = ((v - ch.min) / (ch.max - ch.min)) * HIST_BINS * 4;
            return <line key={v} x1={x} x2={x} y1={0} y2={100} stroke="#dc2626" strokeWidth={1} strokeDasharray="4 3" vectorEffect="non-scaling-stroke" />;
          })}
        </svg>
      </div>
    </div>
  );
};

const VitalsMonitorWidget: React.FC<WidgetComponentProps<VitalsMonitorConfig>> = ({
  title, config, isEditMode, onRemove, onEdit,
}) => {
  const personId = personOf(config);
  const axis = useMemo(
    () => buildAxis(config.startDate ?? DEFAULT_START_DATE),
    [config.startDate],
  );

  const series = useMemo(
    () => CHANNELS.map((ch) => ({
      ch,
      values: genWalk(mulberry32(seedFrom('vitals_monitor', personId, ch.key)), N, {
        base: ch.base, jitter: ch.jitter, spikeProb: 0.012, spikeMag: ch.spikeMag, min: ch.min, max: ch.max,
      }),
    })),
    [personId],
  );

  return (
    <WidgetFrame title={title} isEditMode={isEditMode} onRemove={onRemove} onEdit={onEdit}>
      <div className="p-4">
        <div className="space-y-3">
          {series.map(({ ch, values }) => (
            <TrendRow key={ch.key} ch={ch} values={values} />
          ))}
        </div>
        <div className="relative h-4 mt-1 ml-9 mr-[124px]">
          {axis.ticks.map((t) => (
            <span
              key={t.ts}
              className="absolute -translate-x-1/2 text-[9px] text-slate-400 dark:text-slate-500 whitespace-nowrap"
              style={{ left: `${t.frac * 100}%` }}
            >
              {t.label}
            </span>
          ))}
        </div>
        <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-2">mock data · 1-min samples</p>
      </div>
    </WidgetFrame>
  );
};

export default VitalsMonitorWidget;
