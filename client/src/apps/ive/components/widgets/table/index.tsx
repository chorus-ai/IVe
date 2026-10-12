import React from 'react';
import WidgetFrame from '../WidgetFrame';
import type { WidgetComponentProps } from '../types';
import type { GenericTableConfig } from './settings';

const GenericTableWidget: React.FC<WidgetComponentProps<GenericTableConfig>> = ({ title, isEditMode, onRemove, onEdit }) => {
  const mockData = [
    { id: '1', name: 'Blood Pressure', value: '120/80', status: 'Normal', date: '2023-10-01' },
    { id: '2', name: 'Heart Rate', value: '72 bpm', status: 'Optimal', date: '2023-10-01' },
    { id: '3', name: 'Glucose', value: '95 mg/dL', status: 'Normal', date: '2023-09-28' },
    { id: '4', name: 'Cholesterol', value: '180 mg/dL', status: 'Good', date: '2023-09-15' },
  ];

  return (
    <WidgetFrame title={title} isEditMode={isEditMode} onRemove={onRemove} onEdit={onEdit}>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 transition-colors duration-300">
            <tr>
              <th className="px-4 py-2 font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Observation</th>
              <th className="px-4 py-2 font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Value</th>
              <th className="px-4 py-2 font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 transition-colors duration-300">
            {mockData.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                <td className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300 transition-colors duration-300">{item.name}</td>
                <td className="px-4 py-3 text-slate-800 dark:text-white font-semibold transition-colors duration-300">{item.value}</td>
                <td className="px-4 py-3">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold transition-colors duration-300">{item.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </WidgetFrame>
  );
};

export default GenericTableWidget;
