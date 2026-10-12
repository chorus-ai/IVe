import React, { useState } from 'react';

type NoteType = 'Progress Note' | 'Admission Note' | 'Discharge Summary' | 'Consult Note';

interface MockNote {
  id: number;
  title: string;
  date: string;
  author: string;
  type: NoteType;
}

const MOCK_NOTES: MockNote[] = [
  { id: 1, title: 'Note #1', date: 'May 18, 2024 14:30 EST', author: 'Dr. E. Rossi', type: 'Progress Note' },
  { id: 2, title: 'Note #2', date: 'May 17, 2024 09:12 EST', author: 'Dr. J. Patel', type: 'Admission Note' },
  { id: 3, title: 'Note #3', date: 'May 16, 2024 22:45 EST', author: 'Dr. M. Chen', type: 'Discharge Summary' },
  { id: 4, title: 'Note #4', date: 'May 15, 2024 11:05 EST', author: 'Dr. S. Park', type: 'Consult Note' },
];

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section>
    <h4 className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-widest mb-2 flex items-center gap-2">
      <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
      {title}
    </h4>
    {children}
  </section>
);

const ProgressNoteWidget: React.FC = () => (
  <div className="space-y-6 text-slate-700 dark:text-slate-300 leading-relaxed">
    <Section title="Subjective">
      <p className="text-sm font-serif italic pl-3 border-l-2 border-slate-100 dark:border-slate-800">
        Patient presents for follow-up regarding Type 2 Diabetes management. Reports consistent adherence to Metformin but notes occasional fatigue in the late afternoon. No chest pain or shortness of breath since last visit.
      </p>
    </Section>
    <Section title="Objective">
      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
        <p><span className="text-slate-400 uppercase">Weight:</span> 84.2 kg</p>
        <p><span className="text-slate-400 uppercase">BP:</span> 138/86 mmHg</p>
        <p><span className="text-slate-400 uppercase">HR:</span> 72 bpm</p>
        <p><span className="text-slate-400 uppercase">Temp:</span> 98.6 F</p>
      </div>
      <p className="text-sm mt-3">
        Physical exam: Alert and oriented x3. Lung fields clear bilaterally. RRR. No peripheral edema.
      </p>
    </Section>
    <Section title="Assessment & Plan">
      <ul className="text-sm space-y-2 list-disc pl-5">
        <li><strong>Type 2 DM:</strong> HbA1c 7.1%. Continue Metformin 500 mg BID. Nutrition counseling scheduled.</li>
        <li><strong>Essential Hypertension:</strong> Stable on Lisinopril. Continue home BP monitoring.</li>
        <li><strong>Hyperlipidemia:</strong> Atorvastatin 40 mg QHS. Repeat lipid panel next visit.</li>
      </ul>
    </Section>
  </div>
);

const AdmissionNoteWidget: React.FC = () => (
  <div className="space-y-6 text-slate-700 dark:text-slate-300 leading-relaxed">
    <Section title="Chief Complaint">
      <p className="text-sm">Shortness of breath × 3 days, worsening cough with green sputum.</p>
    </Section>
    <Section title="History of Present Illness">
      <p className="text-sm font-serif italic pl-3 border-l-2 border-slate-100 dark:border-slate-800">
        62-year-old male with PMH of COPD presents to the ED with progressive dyspnea and productive cough over the past 72 hours. Denies fevers but reports fatigue and decreased appetite. Home albuterol use increased to q2h with minimal relief.
      </p>
    </Section>
    <Section title="Past Medical History">
      <div className="grid grid-cols-2 gap-y-1 text-xs">
        <span className="text-slate-400 uppercase font-bold">Conditions</span>
        <span>COPD, HTN, OSA</span>
        <span className="text-slate-400 uppercase font-bold">Surgeries</span>
        <span>CABG (2019), Cholecystectomy (2011)</span>
        <span className="text-slate-400 uppercase font-bold">Allergies</span>
        <span>Penicillin (rash)</span>
      </div>
    </Section>
    <Section title="Initial Plan">
      <ul className="text-sm space-y-2 list-disc pl-5">
        <li>Admit to telemetry, NPO until evaluation</li>
        <li>Start IV ceftriaxone + azithromycin empirically</li>
        <li>CXR, ABG, BMP, CBC, troponin × 3</li>
        <li>Pulmonology consult in AM</li>
      </ul>
    </Section>
  </div>
);

const DischargeSummaryWidget: React.FC = () => (
  <div className="space-y-6 text-slate-700 dark:text-slate-300 leading-relaxed">
    <div className="grid grid-cols-3 gap-3 text-xs">
      <div className="bg-slate-50 dark:bg-slate-800/40 rounded-lg p-3">
        <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Admitted</div>
        <div>May 12, 2024</div>
      </div>
      <div className="bg-slate-50 dark:bg-slate-800/40 rounded-lg p-3">
        <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Discharged</div>
        <div>May 16, 2024</div>
      </div>
      <div className="bg-slate-50 dark:bg-slate-800/40 rounded-lg p-3">
        <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Length of Stay</div>
        <div>4 days</div>
      </div>
    </div>

    <Section title="Hospital Course">
      <p className="text-sm">
        Patient admitted with acute COPD exacerbation likely secondary to bacterial pneumonia. Treated with IV antibiotics, nebulizers, and steroids. Clinical improvement noted by hospital day 3. Weaned to room air, ambulating without supplemental O₂ by discharge.
      </p>
    </Section>

    <Section title="Discharge Medications">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-slate-400 uppercase text-[10px] border-b border-slate-200 dark:border-slate-800">
            <th className="py-1 font-bold">Medication</th>
            <th className="font-bold">Dose</th>
            <th className="font-bold">Frequency</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          <tr><td className="py-1.5">Amoxicillin-clavulanate</td><td>875 mg</td><td>BID × 7 days</td></tr>
          <tr><td className="py-1.5">Prednisone taper</td><td>40 mg → 0</td><td>5-day taper</td></tr>
          <tr><td className="py-1.5">Tiotropium</td><td>18 mcg</td><td>Inhale daily</td></tr>
        </tbody>
      </table>
    </Section>

    <Section title="Follow-up">
      <ul className="text-sm space-y-2 list-disc pl-5">
        <li>PCP within 7 days for clinical reassessment</li>
        <li>Pulmonology follow-up in 4 weeks with repeat PFTs</li>
        <li>Smoking cessation counseling — patient agreed to nicotine patches</li>
      </ul>
    </Section>
  </div>
);

const ConsultNoteWidget: React.FC = () => (
  <div className="space-y-6 text-slate-700 dark:text-slate-300 leading-relaxed">
    <div className="flex items-center gap-2 text-xs">
      <span className="material-symbols-outlined text-primary text-base">forum</span>
      <span className="font-semibold">Cardiology consult</span>
      <span className="text-slate-400">requested by</span>
      <span className="font-semibold">Hospitalist Service</span>
    </div>

    <Section title="Reason for Consult">
      <p className="text-sm">Evaluation of new troponin elevation (0.18 ng/mL) in the setting of acute respiratory illness.</p>
    </Section>

    <Section title="Findings">
      <ul className="text-sm space-y-1.5 list-disc pl-5">
        <li>ECG: NSR, no ST-segment changes, Q-waves in inferior leads (likely chronic).</li>
        <li>Echo: LVEF 50–55%, mild LV hypertrophy, no segmental wall-motion abnormality.</li>
        <li>Troponin trend: 0.18 → 0.21 → 0.15 (down-trending).</li>
      </ul>
    </Section>

    <Section title="Impression">
      <p className="text-sm font-serif italic pl-3 border-l-2 border-slate-100 dark:border-slate-800">
        Type 2 NSTEMI in the setting of demand ischemia from sepsis/respiratory failure. No evidence of acute coronary syndrome warranting cath lab activation.
      </p>
    </Section>

    <Section title="Recommendations">
      <ol className="text-sm space-y-1.5 list-decimal pl-5">
        <li>Continue ASA 81 mg daily, hold heparin.</li>
        <li>Trend troponin q6h × 2 more measurements.</li>
        <li>Outpatient stress test in 4–6 weeks after acute illness resolves.</li>
        <li>Optimize medical therapy for HTN and lipids.</li>
      </ol>
    </Section>
  </div>
);

function renderBody(type: NoteType): React.ReactNode {
  switch (type) {
    case 'Progress Note':       return <ProgressNoteWidget />;
    case 'Admission Note':      return <AdmissionNoteWidget />;
    case 'Discharge Summary':   return <DischargeSummaryWidget />;
    case 'Consult Note':        return <ConsultNoteWidget />;
  }
}

const VisitNotesPanel: React.FC = () => {
  const [activeId, setActiveId] = useState(MOCK_NOTES[0].id);
  const note = MOCK_NOTES.find((n) => n.id === activeId) ?? MOCK_NOTES[0];

  return (
    <div className="flex">
      <aside className="w-56 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 p-3 space-y-1">
        {MOCK_NOTES.map((n) => {
          const isActive = n.id === activeId;
          return (
            <button
              key={n.id}
              onClick={() => setActiveId(n.id)}
              className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-transparent'
              }`}
            >
              <div className="text-sm font-semibold">{n.title}</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">{n.type}</div>
            </button>
          );
        })}
      </aside>

      <div className="flex-1 p-6 min-w-0">
        <div className="flex flex-wrap items-center gap-4 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-slate-400 text-sm">calendar_today</span>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{note.date}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-slate-400 text-sm">person</span>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Author: {note.author}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-slate-400 text-sm">description</span>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Type: {note.type}</span>
          </div>
          <div className="ml-auto">
            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[9px] font-bold uppercase tracking-widest rounded">Finalized</span>
          </div>
        </div>

        {renderBody(note.type)}

        <div className="flex items-center justify-between mt-8 pt-4 border-t border-slate-100 dark:border-slate-800">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            Electronic Signature: 89462, MD
          </span>
          <button className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">print</span>
            Print Note
          </button>
        </div>
      </div>
    </div>
  );
};

export default VisitNotesPanel;
