import React from 'react';
import WidgetFrame from '../WidgetFrame';
import type { WidgetComponentProps } from '../types';
import type { ClinicalNotesConfig } from './settings';

const ClinicalNotesWidget: React.FC<WidgetComponentProps<ClinicalNotesConfig>> = ({ title, isEditMode, onRemove, onEdit }) => {
  return (
    <WidgetFrame
      title={title}
      isEditMode={isEditMode}
      onRemove={onRemove}
      onEdit={onEdit}
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Electronic Signature: 89462, MD</span>
          <button className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">print</span>
            Print Note
          </button>
        </div>
      }
    >
      <div className="p-6">
        {/* Note Metadata */}
        <div className="flex flex-wrap items-center gap-4 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800 transition-colors">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-slate-400 text-sm">calendar_today</span>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">May 18, 2024 14:30 EST</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-slate-400 text-sm">person</span>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Author: Dr. E. Rossi</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-slate-400 text-sm">description</span>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Type: Progress Note</span>
          </div>
          <div className="ml-auto">
             <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[9px] font-bold uppercase tracking-widest rounded">Finalized</span>
          </div>
        </div>

        {/* Note Body */}
        <div className="space-y-6 text-slate-700 dark:text-slate-300 transition-colors leading-relaxed">
          <section>
            <h4 className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-widest mb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
              Subjective
            </h4>
            <p className="text-sm font-serif italic pl-3 border-l-2 border-slate-100 dark:border-slate-800">
              Patient presents for follow-up regarding Type 2 Diabetes management. Reports consistent adherence to Metformin but notes occasional fatigue in the late afternoon. No chest pain or shortness of breath reported since last visit. Diet has been moderate, but patient admits to increased carbohydrate intake during recent travel.
            </p>
          </section>

          <section>
            <h4 className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-widest mb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
              Objective
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <p><span className="text-slate-400 uppercase">Weight:</span> 84.2 kg</p>
              <p><span className="text-slate-400 uppercase">BP:</span> 138/86 mmHg</p>
              <p><span className="text-slate-400 uppercase">HR:</span> 72 bpm</p>
              <p><span className="text-slate-400 uppercase">Temp:</span> 98.6 F</p>
            </div>
            <p className="text-sm mt-3">
              Physical exam: Alert and oriented x3. Lung fields clear bilaterally. Regular rate and rhythm (RRR). No peripheral edema noted in lower extremities. Integumentary exam shows normal turgor, no skin breakdown.
            </p>
          </section>

          <section>
            <h4 className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-widest mb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
              Assessment & Plan
            </h4>
            <ul className="text-sm space-y-2 list-disc pl-5">
              <li><strong>Type 2 DM:</strong> HbA1c currently 7.1%. Control is suboptimal but improving. Continue Metformin 500mg BID. Scheduled for formal nutrition counseling.</li>
              <li><strong>Essential Hypertension:</strong> Stable on Lisinopril. Patient to continue home BP monitoring twice weekly.</li>
              <li><strong>Hyperlipidemia:</strong> Atorvastatin 40mg QHS. Repeat lipid panel requested for next follow-up.</li>
            </ul>
          </section>
        </div>
      </div>
    </WidgetFrame>
  );
};

export default ClinicalNotesWidget;
