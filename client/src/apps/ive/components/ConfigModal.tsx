import React from 'react';
import { WidgetConfig } from './widgets/types';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: WidgetConfig[];
}

const ConfigModal: React.FC<ConfigModalProps> = ({ isOpen, onClose, config }) => {
  if (!isOpen) return null;

  const jsonString = JSON.stringify(config, null, 2);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(jsonString);
    alert('Configuration copied to clipboard!');
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 h-[80vh] transition-colors duration-300">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/30 transition-colors duration-300">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">code</span>
            Dashboard Layout Config
          </h2>
          <div className="flex items-center gap-2">
            <button 
              onClick={copyToClipboard}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
            >
              <span className="material-symbols-outlined text-sm">content_copy</span>
              Copy
            </button>
            <button onClick={onClose} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-white transition-colors">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden p-6">
          <div className="h-full w-full bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-4 font-mono text-xs text-blue-600 dark:text-blue-300 overflow-auto custom-scrollbar transition-colors duration-300">
            <pre>{jsonString}</pre>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-800/20 transition-colors duration-300">
          <p className="text-[10px] text-slate-400 dark:text-slate-500 italic mr-auto mt-2">
            This JSON defines the order, type, and size of all active dashboard components.
          </p>
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-white text-xs font-bold rounded-lg uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfigModal;