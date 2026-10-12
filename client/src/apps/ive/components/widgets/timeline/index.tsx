import React from 'react';
import WidgetFrame from '../WidgetFrame';
import type { WidgetComponentProps } from '../types';
import type { TimelineConfig } from './settings';

interface TimelineData {
  month: string;
  value: number;
  highlighted?: boolean;
}

const TIMELINE_DATA: TimelineData[] = [
  { month: 'Oct', value: 40 },
  { month: 'Nov', value: 60 },
  { month: 'Dec', value: 55 },
  { month: 'Jan', value: 80 },
  { month: 'Feb', value: 95, highlighted: true },
  { month: 'Mar', value: 70 },
  { month: 'Apr', value: 45 },
  { month: 'May', value: 30 },
  { month: 'Jun', value: 50 },
  { month: 'Jul', value: 65 },
  { month: 'Aug', value: 75 },
  { month: 'Sep', value: 85 },
];

const TimelineSummaryWidget: React.FC<WidgetComponentProps<TimelineConfig>> = ({ title, isEditMode, onRemove, onEdit }) => {
  return (
    <WidgetFrame
      title={title}
      isEditMode={isEditMode}
      onRemove={onRemove}
      onEdit={onEdit}
    >
      <div className="p-6 overflow-x-hidden">
        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-6">Historical Incidence (12-Month Period)</p>
        <div className="flex items-end gap-1.5 h-32 w-full">
          {TIMELINE_DATA.map((item, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2 group/bar">
              <div className="relative w-full h-32 flex flex-col justify-end">
                {/* Tooltip on hover */}
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-1.5 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 border border-slate-700">
                    {item.value} archived records
                </div>

                <div
                  className={`w-full rounded-t-[2px] transition-all duration-500 ease-out group-hover/bar:brightness-110 ${
                    item.highlighted
                      ? 'bg-slate-500 shadow-[0_0_15px_rgba(100,116,139,0.4)]'
                      : 'bg-slate-500/20 dark:bg-slate-500/20 hover:bg-slate-500/40'
                  }`}
                  style={{ height: `${item.value}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-4">
          <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Archive Start</span>
          <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Archive End</span>
        </div>
      </div>
    </WidgetFrame>
  );
};

export default TimelineSummaryWidget;
