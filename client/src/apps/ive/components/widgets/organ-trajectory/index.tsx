import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts/core';
import {
  TooltipComponent,
  LegendComponent,
  GridComponent,
  MarkLineComponent,
  MarkAreaComponent,
} from 'echarts/components';
import { LineChart } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';
import WidgetFrame from '../WidgetFrame';
import type { WidgetComponentProps } from '../types';
import type { OrganTrajectoryConfig } from './settings';

echarts.use([
  TooltipComponent,
  LegendComponent,
  GridComponent,
  MarkLineComponent,
  MarkAreaComponent,
  LineChart,
  CanvasRenderer,
]);

/* SOFA-style organ subscores, 0–4. Negative hours = observed, 0 = now,
   positive hours = forecast. Numbers are illustrative until the model
   is wired up. */
const HOURS = [-6, -4, -2, 0, 2, 4, 6];
const NOW_INDEX = 3;

type Trace = {
  name: string;
  color: string;
  values: (number | null)[];
};

const TRACES: Trace[] = [
  { name: 'Respiratory', color: '#3b82f6', values: [1, 1, 2, 2, 2.6, 3.1, 3.4] },
  { name: 'Cardiovascular', color: '#ef4444', values: [2, 2, 2, 3, 3.4, 3.7, 3.9] },
  { name: 'Renal', color: '#10b981', values: [0, 1, 1, 1, 1.6, 2.2, 2.7] },
  { name: 'Hepatic', color: '#f59e0b', values: [1, 1, 1, 1, 1.2, 1.4, 1.5] },
  { name: 'Coagulation', color: '#8b5cf6', values: [0, 0, 1, 1, 1.3, 1.6, 1.8] },
  { name: 'Neuro (GCS)', color: '#06b6d4', values: [0, 1, 1, 1, 1.2, 1.5, 1.7] },
];

const formatHour = (h: number) => (h === 0 ? 'now' : h < 0 ? `${h}h` : `+${h}h`);

const OrganTrajectoryWidget: React.FC<WidgetComponentProps<OrganTrajectoryConfig>> = ({ title, isEditMode, onRemove, onEdit }) => {
  const ref = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const chart = echarts.init(ref.current);
    chartRef.current = chart;

    const series = TRACES.flatMap((t) => {
      const observed = t.values.map((v, i) => (i <= NOW_INDEX ? v : null));
      const forecast = t.values.map((v, i) => (i >= NOW_INDEX ? v : null));
      return [
        {
          name: t.name,
          type: 'line' as const,
          smooth: true,
          showSymbol: false,
          data: observed,
          lineStyle: { color: t.color, width: 2 },
          itemStyle: { color: t.color },
          emphasis: { focus: 'series' },
        },
        {
          name: t.name,
          type: 'line' as const,
          smooth: true,
          showSymbol: false,
          data: forecast,
          lineStyle: { color: t.color, width: 2, type: 'dashed' },
          itemStyle: { color: t.color },
          tooltip: { show: false },
          legendHoverLink: false,
        },
      ];
    });

    chart.setOption({
      tooltip: {
        trigger: 'axis',
        confine: true,
        backgroundColor: '#0f172a',
        borderColor: '#1e293b',
        textStyle: { color: '#e2e8f0', fontSize: 11 },
        valueFormatter: (v: number | null) => (v == null ? '—' : v.toFixed(1)),
      },
      legend: {
        bottom: 0,
        textStyle: { color: '#94a3b8', fontSize: 10 },
        itemWidth: 14,
        itemHeight: 6,
        data: TRACES.map((t) => t.name),
      },
      grid: { left: 36, right: 16, top: 18, bottom: 36 },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: HOURS.map(formatHour),
        axisLabel: { color: '#94a3b8', fontSize: 10 },
        axisLine: { lineStyle: { color: 'rgba(148,163,184,0.3)' } },
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 4,
        interval: 1,
        name: 'SOFA',
        nameTextStyle: { color: '#64748b', fontSize: 10 },
        axisLabel: { color: '#94a3b8', fontSize: 10 },
        splitLine: { lineStyle: { color: 'rgba(148,163,184,0.18)' } },
      },
      series: [
        ...series,
        {
          type: 'line',
          data: [],
          markArea: {
            silent: true,
            itemStyle: { color: 'rgba(59,130,246,0.06)' },
            data: [[{ xAxis: formatHour(0) }, { xAxis: formatHour(HOURS[HOURS.length - 1]) }]],
          },
          markLine: {
            symbol: 'none',
            silent: true,
            label: { formatter: 'now', color: '#64748b', fontSize: 10 },
            lineStyle: { color: 'rgba(100,116,139,0.6)', type: 'dashed' },
            data: [{ xAxis: formatHour(0) }],
          },
        },
      ],
    });

    const onResize = () => chart.resize();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      chart.dispose();
      chartRef.current = null;
    };
  }, []);

  return (
    <WidgetFrame title={title} isEditMode={isEditMode} onRemove={onRemove} onEdit={onEdit}>
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between px-4 pt-2 text-[10px] font-medium uppercase tracking-widest text-slate-400">
          <span>Observed</span>
          <span className="text-slate-500">Forecast (shaded)</span>
        </div>
        <div ref={ref} className="w-full flex-1 min-h-[220px]" />
      </div>
    </WidgetFrame>
  );
};

export default OrganTrajectoryWidget;
