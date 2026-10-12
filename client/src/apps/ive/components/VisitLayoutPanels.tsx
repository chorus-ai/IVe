import React from 'react';

const Card: React.FC<{ title: string; subtitle?: string; tone?: string; children: React.ReactNode }> = ({
  title, subtitle, tone = 'slate', children,
}) => (
  <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm`}>
    <div className="flex items-baseline justify-between mb-3">
      <div>
        <h4 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h4>
        {subtitle && <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-0.5">{subtitle}</p>}
      </div>
      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest bg-${tone}-500/10 text-${tone}-500 border border-${tone}-500/20`}>
        Mock
      </span>
    </div>
    {children}
  </div>
);

const Bar: React.FC<{ label: string; value: number; max?: number; tone?: string }> = ({
  label, value, max = 100, tone = 'primary',
}) => (
  <div className="space-y-1">
    <div className="flex justify-between text-[11px]">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{value}</span>
    </div>
    <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
      <div className={`h-full bg-${tone === 'primary' ? 'primary' : tone + '-500'}`} style={{ width: `${Math.min(100, (value / max) * 100)}%` }} />
    </div>
  </div>
);

export const SepsisLayout: React.FC = () => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
    <Card title="qSOFA Score" subtitle="Quick Sepsis-related Organ Failure" tone="red">
      <div className="text-4xl font-bold text-red-500 mb-3">2 / 3</div>
      <ul className="text-xs space-y-1.5 text-slate-600 dark:text-slate-400">
        <li className="flex items-center gap-2"><span className="material-symbols-outlined text-red-500 text-sm">check_circle</span>RR ≥ 22/min (24)</li>
        <li className="flex items-center gap-2"><span className="material-symbols-outlined text-red-500 text-sm">check_circle</span>SBP ≤ 100 mmHg (96)</li>
        <li className="flex items-center gap-2"><span className="material-symbols-outlined text-slate-300 text-sm">radio_button_unchecked</span>Altered mentation (GCS 15)</li>
      </ul>
    </Card>

    <Card title="Lactate Trend" subtitle="Last 24 hours" tone="amber">
      <div className="flex items-end gap-1 h-20">
        {[2.1, 3.4, 4.2, 3.8, 3.1, 2.4, 2.0, 1.6].map((v, i) => (
          <div key={i} className="flex-1 bg-amber-500/70 rounded-t" style={{ height: `${(v / 5) * 100}%` }} title={`${v} mmol/L`} />
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-slate-400 mt-2 font-mono">
        <span>24h ago</span><span className="text-amber-500 font-bold">Current: 1.6</span>
      </div>
    </Card>

    <Card title="Sepsis Bundle" subtitle="3-hour compliance" tone="emerald">
      <ul className="text-xs space-y-2 text-slate-700 dark:text-slate-300">
        <li className="flex items-center justify-between"><span>Lactate drawn</span><span className="text-emerald-500 font-bold">12 min</span></li>
        <li className="flex items-center justify-between"><span>Blood cultures</span><span className="text-emerald-500 font-bold">28 min</span></li>
        <li className="flex items-center justify-between"><span>Broad-spectrum abx</span><span className="text-emerald-500 font-bold">47 min</span></li>
        <li className="flex items-center justify-between"><span>30 mL/kg crystalloid</span><span className="text-amber-500 font-bold">in progress</span></li>
        <li className="flex items-center justify-between"><span>Vasopressors if MAP &lt; 65</span><span className="text-slate-400">—</span></li>
      </ul>
    </Card>

    <Card title="Suspected Source" tone="slate">
      <div className="space-y-2 text-xs">
        <div className="p-2 bg-slate-50 dark:bg-slate-800/40 rounded">
          <div className="font-semibold text-slate-800 dark:text-slate-200">Pulmonary</div>
          <div className="text-slate-500 dark:text-slate-400">CXR: RLL infiltrate. Procalcitonin 2.4 ng/mL.</div>
        </div>
        <div className="p-2 bg-slate-50 dark:bg-slate-800/40 rounded opacity-60">
          <div className="font-semibold text-slate-800 dark:text-slate-200">Urinary</div>
          <div className="text-slate-500 dark:text-slate-400">UA: 5–10 WBC, no nitrites.</div>
        </div>
      </div>
    </Card>

    <Card title="Empiric Antibiotics" tone="blue">
      <ul className="text-xs space-y-2">
        <li className="flex items-center gap-2"><span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-500 rounded font-mono font-bold">IV</span><span>Ceftriaxone 2g q24h</span></li>
        <li className="flex items-center gap-2"><span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-500 rounded font-mono font-bold">IV</span><span>Azithromycin 500 mg q24h</span></li>
        <li className="flex items-center gap-2"><span className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-500 rounded font-mono">PO</span><span className="text-slate-400">Reassess at 48h</span></li>
      </ul>
    </Card>

    <Card title="Hemodynamics" tone="rose">
      <div className="space-y-2.5">
        <Bar label="MAP" value={72} max={100} tone="rose" />
        <Bar label="HR" value={112} max={150} tone="rose" />
        <Bar label="UOP (mL/kg/h)" value={0.4} max={1} tone="amber" />
      </div>
    </Card>
  </div>
);

export const ArdsLayout: React.FC = () => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
    <Card title="P/F Ratio" subtitle="PaO₂ / FiO₂" tone="red">
      <div className="text-4xl font-bold text-red-500 mb-1">142</div>
      <div className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">Moderate ARDS (Berlin)</div>
      <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
        <div className="bg-red-500" style={{ width: '30%' }} title="Severe ≤100" />
        <div className="bg-amber-500" style={{ width: '20%' }} title="Moderate 100-200" />
        <div className="bg-emerald-500" style={{ width: '50%' }} title="Mild 200-300+" />
      </div>
    </Card>

    <Card title="Vent Settings" subtitle="ARDSNet lung-protective" tone="blue">
      <ul className="text-xs space-y-1.5">
        <li className="flex justify-between"><span className="text-slate-500">Mode</span><span className="font-mono font-semibold">VC-AC</span></li>
        <li className="flex justify-between"><span className="text-slate-500">Vt</span><span className="font-mono font-semibold">6 mL/kg PBW</span></li>
        <li className="flex justify-between"><span className="text-slate-500">PEEP</span><span className="font-mono font-semibold">12 cmH₂O</span></li>
        <li className="flex justify-between"><span className="text-slate-500">FiO₂</span><span className="font-mono font-semibold">60%</span></li>
        <li className="flex justify-between"><span className="text-slate-500">Plateau P</span><span className="font-mono font-semibold text-amber-500">29 cmH₂O</span></li>
        <li className="flex justify-between"><span className="text-slate-500">Driving P</span><span className="font-mono font-semibold">17 cmH₂O</span></li>
      </ul>
    </Card>

    <Card title="Gas Exchange" subtitle="Last ABG" tone="indigo">
      <div className="grid grid-cols-2 gap-y-1 text-xs">
        <span className="text-slate-500">pH</span><span className="font-mono">7.31</span>
        <span className="text-slate-500">PaCO₂</span><span className="font-mono">52</span>
        <span className="text-slate-500">PaO₂</span><span className="font-mono">85</span>
        <span className="text-slate-500">HCO₃</span><span className="font-mono">24</span>
        <span className="text-slate-500">SaO₂</span><span className="font-mono">94%</span>
        <span className="text-slate-500">Lactate</span><span className="font-mono">2.1</span>
      </div>
    </Card>

    <Card title="Adjuncts in Use" tone="violet">
      <ul className="text-xs space-y-2">
        <li className="flex items-center gap-2"><span className="size-2 rounded-full bg-emerald-500" />Prone positioning · 14h</li>
        <li className="flex items-center gap-2"><span className="size-2 rounded-full bg-emerald-500" />Neuromuscular blockade · cisatracurium</li>
        <li className="flex items-center gap-2"><span className="size-2 rounded-full bg-slate-300" />Inhaled epoprostenol — not started</li>
        <li className="flex items-center gap-2"><span className="size-2 rounded-full bg-slate-300" />ECMO consult — not requested</li>
      </ul>
    </Card>

    <Card title="Fluid Balance" subtitle="24h cumulative" tone="amber">
      <div className="text-4xl font-bold text-amber-500 mb-2">+1.8 L</div>
      <div className="text-xs text-slate-500 dark:text-slate-400">
        Goal: net even to slightly negative. Consider diuresis if hemodynamics tolerate.
      </div>
    </Card>

    <Card title="Lung Mechanics" tone="rose">
      <div className="space-y-2.5">
        <Bar label="Compliance (mL/cmH₂O)" value={28} max={80} tone="rose" />
        <Bar label="Resistance (cmH₂O/L/s)" value={14} max={30} tone="rose" />
        <Bar label="PEEPi" value={2} max={10} tone="amber" />
      </div>
    </Card>
  </div>
);

export const DelayedRecoveryLayout: React.FC = () => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
    <Card title="ICU LOS" subtitle="vs. expected" tone="amber">
      <div className="text-4xl font-bold text-amber-500 mb-1">11 days</div>
      <div className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">Expected 5 — APACHE II 18</div>
      <div className="flex gap-0.5 h-3">
        {Array.from({ length: 14 }).map((_, i) => (
          <div key={i} className={`flex-1 rounded-sm ${i < 11 ? 'bg-amber-500' : 'bg-slate-200 dark:bg-slate-800'}`} />
        ))}
      </div>
    </Card>

    <Card title="Sedation & Delirium" tone="violet">
      <ul className="text-xs space-y-2">
        <li className="flex justify-between"><span className="text-slate-500">RASS (current)</span><span className="font-mono font-bold">-3</span></li>
        <li className="flex justify-between"><span className="text-slate-500">CAM-ICU</span><span className="font-mono font-bold text-red-500">Positive</span></li>
        <li className="flex justify-between"><span className="text-slate-500">Sedation days</span><span className="font-mono font-bold">7</span></li>
        <li className="flex justify-between"><span className="text-slate-500">SAT/SBT today</span><span className="font-mono font-bold text-slate-400">Held</span></li>
      </ul>
    </Card>

    <Card title="Mobility Score" subtitle="ICU Mobility Scale" tone="rose">
      <div className="text-4xl font-bold text-rose-500 mb-2">2 / 10</div>
      <div className="text-[11px] text-slate-500 dark:text-slate-400">
        Sitting on edge of bed with assist. PT consulted, twice-daily sessions planned.
      </div>
    </Card>

    <Card title="Nutrition" tone="emerald">
      <ul className="text-xs space-y-1.5">
        <li className="flex justify-between"><span className="text-slate-500">Route</span><span className="font-mono font-semibold">NG tube feeds</span></li>
        <li className="flex justify-between"><span className="text-slate-500">Goal kcal</span><span className="font-mono">1680 kcal/d</span></li>
        <li className="flex justify-between"><span className="text-slate-500">Achieved</span><span className="font-mono text-amber-500">62%</span></li>
        <li className="flex justify-between"><span className="text-slate-500">Protein</span><span className="font-mono">1.2 g/kg/d</span></li>
      </ul>
    </Card>

    <Card title="Acquired Conditions" tone="red">
      <ul className="text-xs space-y-2">
        <li className="flex items-center gap-2"><span className="material-symbols-outlined text-red-500 text-sm">warning</span>ICU-acquired weakness (MRC 38/60)</li>
        <li className="flex items-center gap-2"><span className="material-symbols-outlined text-red-500 text-sm">warning</span>VAP — day 6, on tx</li>
        <li className="flex items-center gap-2"><span className="material-symbols-outlined text-amber-500 text-sm">info</span>Stage 2 sacral pressure injury</li>
      </ul>
    </Card>

    <Card title="Discharge Barriers" subtitle="Next steps" tone="blue">
      <ul className="text-xs space-y-2">
        <li className="flex items-center gap-2"><span className="size-2 rounded-full bg-red-500" />Persistent vasopressor requirement</li>
        <li className="flex items-center gap-2"><span className="size-2 rounded-full bg-amber-500" />Failed last SBT (rapid shallow index 130)</li>
        <li className="flex items-center gap-2"><span className="size-2 rounded-full bg-amber-500" />Tracheostomy decision pending day 14</li>
        <li className="flex items-center gap-2"><span className="size-2 rounded-full bg-slate-300" />Social work for rehab placement</li>
      </ul>
    </Card>
  </div>
);
