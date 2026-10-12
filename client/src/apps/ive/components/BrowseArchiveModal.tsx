import React, { useState, useMemo } from 'react';
import { useAppDispatch } from '../../../hooks/redux';
import { removeSavedLayout } from '../store';
import { deleteLayout } from '../api/layouts';
import { DashboardLayout } from './widgets/types';

interface BrowseArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  layouts: DashboardLayout[];
  onRestore: (layout: DashboardLayout) => void;
}

const BrowseArchiveModal: React.FC<BrowseArchiveModalProps> = ({ isOpen, onClose, layouts, onRestore }) => {
  const dispatch = useAppDispatch();
  const [searchTerm, setSearchTerm] = useState('');

  const handleDelete = (layout: DashboardLayout) => {
    deleteLayout(layout.id).catch(() => {});
    dispatch(removeSavedLayout(layout.id));
  };

  const filteredLayouts = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return layouts.filter(l => 
      l.name.toLowerCase().includes(term) || 
      l.tags.some(tag => tag.toLowerCase().includes(term))
    );
  }, [layouts, searchTerm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-4xl h-[80vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 transition-colors duration-300">
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 transition-colors duration-300">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-3xl">inventory_2</span>
              Layout Archive
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-white transition-colors">
              <span className="material-symbols-outlined text-2xl">close</span>
            </button>
          </div>

          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">search</span>
            <input 
              type="text" 
              placeholder="Search by layout name or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all text-slate-800 dark:text-white"
            />
          </div>
        </div>

        {/* Layout Gallery */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
          {filteredLayouts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 gap-4 opacity-60">
               <span className="material-symbols-outlined text-6xl">search_off</span>
               <p className="text-lg font-bold">No layouts found matching "{searchTerm}"</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredLayouts.map((layout) => (
                <div 
                  key={layout.id}
                  className="group bg-slate-50/50 dark:bg-slate-800/20 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:shadow-xl hover:border-primary/50 transition-all flex flex-col"
                >
                  <div className="h-32 bg-slate-100 dark:bg-slate-900/60 p-4 border-b border-slate-100 dark:border-slate-800 transition-colors">
                    {/* Visual schematic */}
                    <div className="grid grid-cols-12 gap-1.5 h-full opacity-40 group-hover:opacity-70 transition-opacity">
                      {layout.widgets.map((w, idx) => (
                        <div key={idx} className={`bg-slate-300 dark:bg-slate-700 rounded-sm`} style={{ gridColumn: `span ${Math.min(w.w, 12)}` }}></div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-slate-800 dark:text-white truncate max-w-[150px]">{layout.name}</h3>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">{layout.date}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-6">
                      {layout.tags.map(tag => (
                        <span key={tag} className="px-2 py-0.5 bg-primary/5 text-primary border border-primary/10 rounded text-[9px] font-bold uppercase tracking-wider">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="mt-auto flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                        {layout.widgets.length} Widgets
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDelete(layout)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                          title="Delete layout"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                        <button
                          onClick={() => onRestore(layout)}
                          className="bg-primary text-white text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                        >
                          Select
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-8 py-4 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between transition-colors duration-300">
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            {filteredLayouts.length} Layouts archived
          </p>
          <div className="flex gap-4">
             <button className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline">Bulk Export</button>
             <button className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest hover:text-slate-600 dark:hover:text-white">Clean Old Snapshots</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrowseArchiveModal;