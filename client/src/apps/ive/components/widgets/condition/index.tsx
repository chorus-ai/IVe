import React from 'react';
import WidgetFrame from '../WidgetFrame';
import type { WidgetComponentProps } from '../types';
import type { ConditionConfig } from './settings';

interface PatientRecord {
  id: string;
  personId: string;
  concept: string;
  conceptCode: string;
  startDate: string;
  type: 'EHR Record' | 'Claims' | 'Patient Survey';
}

const MOCK_DATA: PatientRecord[] = [
  { id: '1', personId: '#P-0082-991', concept: 'Diabetes Mellitus', conceptCode: 'SNOMED: 44054006', startDate: '2022-05-14', type: 'EHR Record' },
  { id: '2', personId: '#P-1123-452', concept: 'Diabetes Mellitus', conceptCode: 'SNOMED: 44054006', startDate: '2021-11-30', type: 'Claims' },
  { id: '3', personId: '#P-0992-102', concept: 'Diabetes Mellitus', conceptCode: 'SNOMED: 44054006', startDate: '2023-01-08', type: 'EHR Record' },
  { id: '4', personId: '#P-2241-104', concept: 'Diabetes Mellitus', conceptCode: 'SNOMED: 44054006', startDate: '2023-03-22', type: 'Claims' },
  { id: '5', personId: '#P-4491-092', concept: 'Diabetes Mellitus', conceptCode: 'SNOMED: 44054006', startDate: '2022-12-15', type: 'Patient Survey' },
];

const OmopConditionOccurrenceWidget: React.FC<WidgetComponentProps<ConditionConfig>> = ({ title, isEditMode, onRemove, onEdit }) => {
  const filteredData = MOCK_DATA;

  return (
    <WidgetFrame
      title={title}
      isEditMode={isEditMode}
      onRemove={onRemove}
      onEdit={onEdit}
      footer={
        <>
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">{filteredData.length} Shown / 1,245 Total Records</span>
          <button className="text-xs text-primary font-bold hover:underline">View All</button>
        </>
      }
    >
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-200 dark:border-slate-800 transition-colors duration-300">
              <th className="px-6 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Person ID</th>
              <th className="px-6 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Condition Concept</th>
              <th className="px-6 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Start Date</th>
              <th className="px-6 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Type</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 transition-colors duration-300">
            {filteredData.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group">
                <td className="px-6 py-4 text-sm font-bold text-primary cursor-pointer hover:underline decoration-primary/30 underline-offset-4">{row.personId}</td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-slate-800 dark:text-white transition-colors duration-300">{row.concept}</span>
                    <span className="text-[10px] text-slate-500 font-medium tracking-wide">{row.conceptCode}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 transition-colors duration-300">{row.startDate}</td>
                <td className="px-6 py-4 text-right">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border tracking-widest ${
                    row.type === 'Claims'
                      ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                      : row.type === 'EHR Record'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                  }`}>
                    {row.type}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </WidgetFrame>
  );
};

export default OmopConditionOccurrenceWidget;
