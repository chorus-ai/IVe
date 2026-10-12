import React from 'react';
import WidgetFrame from '../WidgetFrame';
import type { WidgetComponentProps } from '../types';
import type { GenericChartConfig } from './settings';

export type ChartType = 'bar_chart' | 'line_chart' | 'pie_chart';

const GenericChartWidget: React.FC<WidgetComponentProps<GenericChartConfig> & { chartType: ChartType }> = ({
  title, isEditMode, onRemove, onEdit, chartType,
}) => {
  const data = [45, 78, 56, 92, 63, 84];
  const max = Math.max(...data);

  return (
    <WidgetFrame title={title} isEditMode={isEditMode} onRemove={onRemove} onEdit={onEdit}>
      <div className="p-6 h-full min-h-[180px] flex flex-col">
        <div className="flex-1 flex flex-col justify-end">
          {chartType === 'bar_chart' && (
            <div className="flex items-end gap-2 h-full">
              {data.map((v, i) => (
                <div
                  key={i}
                  className="flex-1 bg-primary/30 dark:bg-primary/40 hover:bg-primary transition-all rounded-t-sm"
                  style={{ height: `${(v / max) * 100}%` }}
                />
              ))}
            </div>
          )}
          {chartType === 'line_chart' && (
             <div className="h-full max-h-[140px] w-full relative overflow-hidden flex items-center justify-center border-b border-l border-slate-200 dark:border-slate-700 transition-colors duration-300">
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <path
                    d="M0,80 L20,40 L40,60 L60,10 L80,30 L100,20"
                    fill="none"
                    stroke="#136dec"
                    strokeWidth="2"
                    vectorEffect="non-scaling-stroke"
                    className="drop-shadow-[0_0_8px_rgba(19,109,236,0.5)]"
                  />
                </svg>
             </div>
          )}
          {chartType === 'pie_chart' && (
             <div className="h-full w-full flex items-center justify-center">
                <div className="relative w-32 h-32 rounded-full border-[12px] border-slate-100 dark:border-slate-800 flex items-center justify-center transition-colors duration-300">
                  <div className="absolute inset-0 rounded-full border-[12px] border-primary border-t-transparent border-r-transparent transform rotate-45"></div>
                  <span className="text-xl font-bold text-slate-800 dark:text-white transition-colors duration-300">68%</span>
                </div>
             </div>
          )}
        </div>
        <div className="flex justify-between mt-4 text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest shrink-0">
           <span>Period A</span>
           <span>Period B</span>
        </div>
      </div>
    </WidgetFrame>
  );
};

export default GenericChartWidget;
