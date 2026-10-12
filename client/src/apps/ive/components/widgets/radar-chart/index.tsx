import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts/core';
import { TooltipComponent, LegendComponent, RadarComponent } from 'echarts/components';
import { RadarChart } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';
import WidgetFrame from '../WidgetFrame';
import type { WidgetComponentProps } from '../types';
import type { RadarConfig } from './settings';

echarts.use([TooltipComponent, LegendComponent, RadarComponent, RadarChart, CanvasRenderer]);

const INDICATORS = [
  { name: 'Death', max: 100 },
  { name: 'Cardiac arrest', max: 100 },
  { name: 'Resp. failure', max: 100 },
  { name: 'AKI', max: 100 },
  { name: 'Sepsis', max: 100 },
  { name: 'Stroke', max: 100 },
];

const RadarChartWidget: React.FC<WidgetComponentProps<RadarConfig>> = ({ title, isEditMode, onRemove, onEdit }) => {
  const ref = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const chart = echarts.init(ref.current);
    chartRef.current = chart;

    chart.setOption({
      tooltip: {
        confine: true,
        backgroundColor: '#0f172a',
        borderColor: '#1e293b',
        textStyle: { color: '#e2e8f0', fontSize: 11 },
      },
      legend: {
        bottom: 0,
        textStyle: { color: '#94a3b8', fontSize: 10 },
        itemWidth: 10,
        itemHeight: 8,
      },
      radar: {
        indicator: INDICATORS,
        radius: '62%',
        center: ['50%', '48%'],
        splitNumber: 4,
        axisName: { color: '#64748b', fontSize: 10 },
        splitLine: { lineStyle: { color: 'rgba(148,163,184,0.25)' } },
        splitArea: { areaStyle: { color: ['rgba(148,163,184,0.04)', 'rgba(148,163,184,0.08)'] } },
        axisLine: { lineStyle: { color: 'rgba(148,163,184,0.35)' } },
      },
      series: [
        {
          type: 'radar',
          symbol: 'circle',
          symbolSize: 4,
          data: [
            {
              name: 'Now',
              value: [12, 8, 22, 18, 30, 6],
              lineStyle: { color: '#3b82f6', width: 2 },
              areaStyle: { color: 'rgba(59,130,246,0.18)' },
              itemStyle: { color: '#3b82f6' },
            },
            {
              name: '+6h forecast',
              value: [28, 14, 48, 26, 55, 10],
              lineStyle: { color: '#ef4444', width: 2, type: 'dashed' },
              areaStyle: { color: 'rgba(239,68,68,0.15)' },
              itemStyle: { color: '#ef4444' },
            },
          ],
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
      <div ref={ref} className="w-full h-full min-h-[200px]" />
    </WidgetFrame>
  );
};

export default RadarChartWidget;
