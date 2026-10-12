import React from 'react';
import { WaveformPanel } from '../components/widgets/waveform';

const WaveformView: React.FC = () => {
  return (
    <div className="flex flex-col h-full bg-background-light text-slate-900 dark:bg-slate-950 dark:text-slate-100 overflow-y-auto transition-colors duration-300">
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-transparent px-6 py-4 flex items-center gap-3">
        <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-500 text-3xl">ecg_heart</span>
        <div>
          <h1 className="text-xl font-bold">Waveform Viewer</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">WFDB records via /api/waveform/wfdb · streams forward as you scrub</p>
        </div>
      </div>

      <div className="flex-1 px-6 py-4">
        <WaveformPanel />
      </div>
    </div>
  );
};

export default WaveformView;
