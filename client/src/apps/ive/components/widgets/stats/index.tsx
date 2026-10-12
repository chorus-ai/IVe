import React from 'react';
import WidgetFrame from '../WidgetFrame';
import type { WidgetComponentProps } from '../types';
import type { StatsConfig } from './settings';

const PatientStatsWidget: React.FC<WidgetComponentProps<StatsConfig>> = ({ title, isEditMode, onRemove, onEdit }) => {
  return (
    <WidgetFrame title={title} isEditMode={isEditMode} onRemove={onRemove} onEdit={onEdit}>
      <div className="p-6 grid grid-cols-2 gap-4">
        {[
          { label: 'Avg BMI (Archive)', value: '28.4', trend: '+1.2%', color: 'text-emerald-500 dark:text-emerald-400' },
          { label: 'Past HbA1c', value: '7.1%', trend: '-0.4%', color: 'text-amber-500 dark:text-amber-400' },
          { label: 'Historical Risk', value: 'Medium', trend: 'Static', color: 'text-primary' },
          { label: 'Past Compliance', value: '88%', trend: '+5%', color: 'text-emerald-500 dark:text-emerald-400' },
        ].map((stat, i) => (
          <div key={i} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-100 dark:border-slate-700/50 transition-colors duration-300">
            <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-bold text-slate-800 dark:text-white transition-colors duration-300">{stat.value}</span>
              <span className={`text-[10px] font-bold ${stat.color}`}>{stat.trend}</span>
            </div>
          </div>
        ))}
      </div>
    </WidgetFrame>
  );
};

export default PatientStatsWidget;
