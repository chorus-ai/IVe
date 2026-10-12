import React, { useState } from 'react';
import { WidgetConfig } from './widgets/types';
import TagInput from './ui/TagInput';

interface SaveLayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, tags: string[]) => void;
  widgets: WidgetConfig[];
}

const SaveLayoutModal: React.FC<SaveLayoutModalProps> = ({ isOpen, onClose, onSave, widgets }) => {
  const [name, setName] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!name.trim()) return;
    onSave(name, tags);
    setName('');
    setTags([]);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-xl rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 transition-colors duration-300">
        
        <div className="px-6 py-6 bg-slate-50 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800 transition-colors duration-300">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-2xl">bookmark_add</span>
            Save Current Layout
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Snapshot the active widget arrangement and configuration.</p>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2 ">Layout Title</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Q3 Oncology Dashboard"
              className="m-0 w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all text-slate-800 dark:text-white"
            />
          </div>

          <TagInput
            label="Tags (Press Enter)"
            value={tags}
            onChange={setTags}
          />

          <div>
             <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2 ">Configuration Preview</label>
              <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 h-32 overflow-auto custom-scrollbar border border-slate-200 dark:border-slate-800 transition-colors duration-300">
                <pre className="text-[10px] text-blue-600 dark:text-blue-400 font-mono">
                  {JSON.stringify(widgets, null, 2)}
                </pre>
             </div>

          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 transition-colors duration-300">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-white transition-colors uppercase tracking-widest"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={!name.trim()}
            className="px-6 py-2 bg-primary text-white text-xs font-bold rounded-xl uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirm & Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaveLayoutModal;