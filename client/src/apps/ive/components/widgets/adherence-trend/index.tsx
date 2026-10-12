import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts/core';
import {
  TooltipComponent,
  LegendComponent,
  GridComponent,
  MarkLineComponent,
  MarkPointComponent,
} from 'echarts/components';
import { LineChart } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';
import WidgetFrame from '../WidgetFrame';
import type { WidgetComponentProps } from '../types';
import type { AdherenceTrendConfig } from './settings';

echarts.use([
  TooltipComponent,
  LegendComponent,
  GridComponent,
  MarkLineComponent,
  MarkPointComponent,
  LineChart,
  CanvasRenderer,
]);

const MONTHS = [
  '2023-06', '2023-07', '2023-08', '2023-09', '2023-10', '2023-11',
  '2023-12', '2024-01', '2024-02', '2024-03', '2024-04', '2024-05',
];

// 0..1 monthly PDC for two example regimens
const OVERALL = [0.86, 0.84, 0.82, 0.79, 0.81, 0.78, 0.74, 0.69, 0.66, 0.71, 0.76, 0.79];
const STATIN = [0.78, 0.74, 0.71, 0.66, 0.62, 0.59, 0.55, 0.52, 0.58, 0.61, 0.64, 0.61];

// month → label for refill events worth flagging
const REFILL_EVENTS: { x: string; label: string }[] = [
  { x: '2023-12', label: 'Missed refill' },
  { x: '2024-02', label: 'Pharmacy switch' },
  { x: '2024-04', label: 'Counseling' },
];

const AdherenceTrendWidget: React.FC<WidgetComponentProps<AdherenceTrendConfig>> = ({ title, isEditMode, onRemove, onEdit }) => {
  const ref = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const chart = echarts.init(ref.current);
    chartRef.current = chart;

    chart.setOption({
      tooltip: {
        trigger: 'axis',
        confine: true,
        backgroundColor: '#0f172a',
        borderColor: '#1e293b',
        textStyle: { color: '#e2e8f0', fontSize: 11 },
        valueFormatter: (v: number | null) =>
          v == null ? '—' : `${Math.round(v * 100)}%`,
      },
      legend: {
        bottom: 0,
        textStyle: { color: '#94a3b8', fontSize: 10 },
        itemWidth: 14,
        itemHeight: 6,
      },
      grid: { left: 36, right: 16, top: 18, bottom: 36 },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: MONTHS,
        axisLabel: { color: '#94a3b8', fontSize: 10, rotate: 30 },
        axisLine: { lineStyle: { color: 'rgba(148,163,184,0.3)' } },
      },
      yAxis: {
        type: 'value',
        min: 0.3,
        max: 1,
        axisLabel: {
          color: '#94a3b8',
          fontSize: 10,
          formatter: (v: number) => `${Math.round(v * 100)}%`,
        },
        splitLine: { lineStyle: { color: 'rgba(148,163,184,0.18)' } },
      },
      series: [
        {
          name: 'Overall PDC',
          type: 'line',
          smooth: true,
          showSymbol: false,
          data: OVERALL,
          lineStyle: { color: '#3b82f6', width: 2 },
          areaStyle: { color: 'rgba(59,130,246,0.12)' },
          markLine: {
            symbol: 'none',
            silent: true,
            label: { formatter: '80% target', color: '#64748b', fontSize: 10 },
            lineStyle: { color: 'rgba(100,116,139,0.6)', type: 'dashed' },
            data: [{ yAxis: 0.8 }],
          },
          markPoint: {
            symbolSize: 36,
            label: { fontSize: 9, color: '#0f172a' },
            itemStyle: { color: 'rgba(245,158,11,0.85)' },
            data: REFILL_EVENTS.map((e) => ({
              name: e.label,
              xAxis: e.x,
              yAxis: OVERALL[MONTHS.indexOf(e.x)],
              value: e.label,
            })),
          },
        },
        {
          name: 'Statin (Atorvastatin)',
          type: 'line',
          smooth: true,
          showSymbol: false,
          data: STATIN,
          lineStyle: { color: '#f59e0b', width: 2, type: 'dashed' },
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
          <span>Monthly PDC · 12-month window</span>
          <span className="text-slate-500">Markers = refill events</span>
        </div>
        <div ref={ref} className="w-full flex-1 min-h-[220px]" />
      </div>
    </WidgetFrame>
  );
};

export default AdherenceTrendWidget;
