import React, { useState, useMemo } from 'react';
import { DashboardLayout } from './widgets/types';

interface LayoutsSidebarProps {
  layouts: DashboardLayout[];
  activeId: string;
  onSelect: (layout: DashboardLayout) => void;
  onBrowseArchive: () => void;
}

const LayoutsSidebar: React.FC<LayoutsSidebarProps> = ({ layouts, activeId, onSelect, onBrowseArchive }) => {
  const INITIAL_COUNT = 4;
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);

  const filteredLayouts = useMemo(() => {
    if (!searchQuery.trim()) return layouts;
    const query = searchQuery.toLowerCase();
    return layouts.filter(layout => 
      layout.name.toLowerCase().includes(query) || 
      layout.tags.some(tag => tag.toLowerCase().includes(query))
    );
  }, [layouts, searchQuery]);

  // Reset visible count when search changes
  React.useEffect(() => {
    setVisibleCount(INITIAL_COUNT);
  }, [searchQuery]);

  return (
    <aside className="w-72 border-r border-slate-200 dark:border-slate-800 bg-panel-light dark:bg-panel-dark overflow-y-auto custom-scrollbar transition-colors duration-300">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Saved Layouts</h3>
          <span className="bg-primary/10 text-primary text-[10px] font-bold px-1.5 py-0.5 rounded border border-primary/20">
            {filteredLayouts.length}
          </span>
        </div>

        {/* Search Bar */}
        <div className="mb-6 relative group">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg transition-colors group-focus-within:text-primary">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter layouts or tags..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          )}
        </div>

        <div className="space-y-4">
          {filteredLayouts.slice(0, visibleCount).map((layout) => (
            <button
              key={layout.id}
              onClick={() => onSelect(layout)}
              className={`w-full text-left p-3 rounded-xl border transition-all group ${
                activeId === layout.id
                  ? 'bg-primary/5 dark:bg-primary/10 border-primary shadow-sm'
                  : 'bg-transparent border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold transition-colors ${
                    activeId === layout.id ? 'text-primary' : 'text-slate-700 dark:text-slate-200'
                  }`}>
                    {layout.name}
                  </span>
                  {activeId === layout.id && (
                    <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                  )}
                </div>

                {/* Mini Visual Schematic */}
                <div className="h-10 bg-slate-50 dark:bg-slate-900 rounded-lg p-1.5 flex gap-1 border border-slate-100 dark:border-slate-800">
                   {layout.widgets.slice(0, 4).map((w, idx) => (
                     <div 
                        key={idx} 
                        className="bg-slate-200 dark:bg-slate-800 rounded-[2px] h-full" 
                        style={{ flex: w.w }}
                     ></div>
                   ))}
                </div>

                <div className="flex flex-wrap gap-1 mt-1">
                  {layout.tags.map(tag => (
                    <span key={tag} className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between mt-1 pt-2 border-t border-slate-100 dark:border-slate-800">
                   <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{layout.date}</span>
                   <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{layout.widgets.length} Widgets</span>
                </div>
              </div>
            </button>
          ))}
          
          {filteredLayouts.length > visibleCount && (
            <div className="flex justify-center pt-2">
              <button 
                onClick={() => setVisibleCount(prev => prev + 4)}
                className="flex items-center gap-1.5 py-2 px-4 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 dark:text-slate-400 hover:bg-primary/10 hover:text-primary transition-all uppercase tracking-widest"
              >
                Load More
              </button>
            </div>
          )}
          
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
             <button 
                onClick={onBrowseArchive}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-slate-400 hover:text-primary hover:border-primary transition-all text-xs font-bold uppercase tracking-widest group"
             >
                <span className="material-symbols-outlined text-lg">settings_suggest</span>
                Manage Layouts
             </button>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default LayoutsSidebar;