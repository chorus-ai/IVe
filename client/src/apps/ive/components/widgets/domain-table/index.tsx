import React from 'react';
import WidgetFrame from '../WidgetFrame';
import type { WidgetComponentProps } from '../types';
import type { DomainTableConfig } from './settings';

interface Row {
  id: string;
  concept: string;
  code: string;
  value?: string;
  date: string;
  status?: string;
  provider?: string;
}

const DOMAIN_DATA: Record<string, Row[]> = {
  measurements: [
    { id: '1', concept: 'Blood Glucose', code: 'LOINC: 2339-0', value: '112 mg/dL', date: '2024-05-18', status: 'Normal' },
    { id: '2', concept: 'HbA1c', code: 'LOINC: 4548-4', value: '7.1 %', date: '2024-05-15', status: 'High' },
    { id: '3', concept: 'Body Weight', code: 'LOINC: 29463-7', value: '84.2 kg', date: '2024-05-18', status: 'Optimal' },
    { id: '4', concept: 'Systolic BP', code: 'LOINC: 8480-6', value: '138 mmHg', date: '2024-05-18', status: 'Elevated' },
  ],
  medications: [
    { id: 'm1', concept: 'Metformin 500mg', code: 'RxNorm: 860975', value: '1 tab / BID', date: 'Active', provider: 'Dr. Rossi' },
    { id: 'm2', concept: 'Lisinopril 10mg', code: 'RxNorm: 204443', value: '1 tab / Daily', date: 'Active', provider: 'Dr. Rossi' },
    { id: 'm3', concept: 'Atorvastatin 40mg', code: 'RxNorm: 259255', value: '1 tab / QHS', date: 'Active', provider: 'Dr. Rossi' },
  ],
  conditions: [
    { id: 'c1', concept: 'Type 2 Diabetes', code: 'SNOMED: 44054006', date: '2021-08-12', status: 'Chronic' },
    { id: 'c2', concept: 'Essential Hypertension', code: 'SNOMED: 59621000', date: '2022-03-04', status: 'Managed' },
    { id: 'c3', concept: 'Hyperlipidemia', code: 'SNOMED: 55822004', date: '2022-11-20', status: 'Chronic' },
  ],
  procedures: [
    { id: 'p1', concept: 'Colonoscopy', code: 'CPT: 45378', date: '2023-01-15', status: 'Completed', provider: 'Dr. Smith' },
    { id: 'p2', concept: 'Chest X-Ray', code: 'CPT: 71046', date: '2023-06-20', status: 'Completed', provider: 'Dr. Jones' },
    { id: 'p3', concept: 'HbA1c Test', code: 'CPT: 83036', date: '2024-05-15', status: 'Completed', provider: 'LabCorp' },
  ],
};

const OmopDomainTableWidget: React.FC<WidgetComponentProps<DomainTableConfig>> = ({ title, isEditMode, onRemove, onEdit, config }) => {
  const domain = (config.domain as string) || 'measurements';
  const data = DOMAIN_DATA[domain] || [];

  return (
    <WidgetFrame
      title={title}
      isEditMode={isEditMode}
      onRemove={onRemove}
      onEdit={onEdit}
      footer={
        <button className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline">View Full Longitudinal Record</button>
      }
    >
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-200 dark:border-slate-800 transition-colors">
              <th className="px-6 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Description</th>
              <th className="px-6 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Detail/Value</th>
              <th className="px-6 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Date/Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 transition-colors">
            {data.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-800 dark:text-white">{row.concept}</span>
                    <span className="text-[9px] text-slate-400 font-mono">{row.code}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{row.value || row.provider}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex flex-col items-end">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{row.date}</span>
                    {row.status && (
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 rounded mt-1 ${
                        row.status === 'High' || row.status === 'Elevated'
                          ? 'bg-amber-500/10 text-amber-500'
                          : 'bg-emerald-500/10 text-emerald-500'
                      }`}>
                        {row.status}
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </WidgetFrame>
  );
};

export default OmopDomainTableWidget;
