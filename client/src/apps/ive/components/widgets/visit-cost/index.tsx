import React from 'react';
import WidgetFrame from '../WidgetFrame';
import type { WidgetComponentProps } from '../types';
import type { VisitCostConfig } from './settings';

const VisitCostWidget: React.FC<WidgetComponentProps<VisitCostConfig>> = ({ title, isEditMode, onRemove, onEdit }) => {
  return (
    <WidgetFrame title={title} isEditMode={isEditMode} onRemove={onRemove} onEdit={onEdit}>
      <div className="bg-white dark:bg-slate-900 h-full p-6 flex flex-col">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-emerald-500">payments</span>
          Cost Analysis
        </h3>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
            <p className="text-xs text-slate-500 mb-1">Total Charged</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">$250.00</p>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
            <p className="text-xs text-slate-500 mb-1">Total Paid</p>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">$210.50</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600 dark:text-slate-400">Payer Coverage</span>
            <span className="font-medium text-slate-900 dark:text-white">$180.00</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
            <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '72%' }}></div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600 dark:text-slate-400">Patient Liability</span>
            <span className="font-medium text-slate-900 dark:text-white">$30.50</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
            <div className="bg-orange-500 h-1.5 rounded-full" style={{ width: '12%' }}></div>
          </div>
        </div>
      </div>
    </WidgetFrame>
  );
};

export default VisitCostWidget;
