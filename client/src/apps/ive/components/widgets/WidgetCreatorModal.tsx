import React, { useState } from 'react';
import { WIDGET_REGISTRY } from './registry';
import type { WidgetType, WidgetDefinition } from './types';

interface WidgetCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (type: WidgetType, title: string, width: number, height: 'auto' | 'sm' | 'md' | 'lg') => void;
}

type ModalTab = 'library' | 'builder';

interface LibraryWidget {
  id: string;
  type: WidgetType;
  title: string;
  w: number;
  h: 'auto' | 'sm' | 'md' | 'lg';
  desc: string;
  icon: string;
}

// Library entries for registry-backed widgets: each definition contributes
// its presets (or itself, if it declares none), so a newly registered widget
// shows up here without touching this file.
const REGISTRY_LIBRARY: LibraryWidget[] = Object.values(WIDGET_REGISTRY).flatMap(
  (def: WidgetDefinition<any>) =>
    (def.presets?.length
      ? def.presets
      : [{ title: def.label, description: def.description }]
    ).map((preset, i) => ({
      id: `${def.type}-${i}`,
      type: def.type,
      title: preset.title,
      w: preset.layout?.w ?? def.defaultLayout.w,
      h: preset.layout?.h ?? def.defaultLayout.h,
      desc: preset.description ?? def.description,
      icon: def.icon,
    }))
);

// Every widget is registry-backed; the library is derived from the registry.
const WIDGET_LIBRARY: LibraryWidget[] = REGISTRY_LIBRARY;

const WidgetCreatorModal: React.FC<WidgetCreatorModalProps> = ({ isOpen, onClose, onAdd }) => {
  const INITIAL_COUNT = 6;
  const [activeTab, setActiveTab] = useState<ModalTab>('library');
  const [searchQuery, setSearchQuery] = useState('');
  const [vizSearchQuery, setVizSearchQuery] = useState('');
  const [visibleWidgetsCount, setVisibleWidgetsCount] = useState(INITIAL_COUNT);
  const [selectedType, setSelectedType] = useState<WidgetType>('bar_chart');
  const [title, setTitle] = useState('');
  const [width, setWidth] = useState(4);
  const [height, setHeight] = useState<'auto' | 'sm' | 'md' | 'lg'>('auto');

  if (!isOpen) return null;

  const types: { id: WidgetType; label: string; icon: string; desc: string }[] = [
    { id: 'clinical_note', label: 'Clinical Note', icon: 'description', desc: 'Document textual medical notes' },
    { id: 'table', label: 'Data Table', icon: 'table_rows', desc: 'Raw record views' },
    { id: 'bar_chart', label: 'Bar Chart', icon: 'bar_chart', desc: 'Compare discrete values' },
    { id: 'line_chart', label: 'Line Chart', icon: 'show_chart', desc: 'Visualize trends over time' },
    { id: 'pie_chart', label: 'Pie Chart', icon: 'pie_chart', desc: 'Distribution analysis' },
    { id: 'stats', label: 'Stats Grid', icon: 'grid_view', desc: 'High-level KPIs' },
  ];

  const heights: { id: 'auto' | 'sm' | 'md' | 'lg'; label: string; icon: string }[] = [
    { id: 'auto', label: 'Auto', icon: 'height' },
    { id: 'sm', label: 'Small', icon: 'vertical_align_center' },
    { id: 'md', label: 'Medium', icon: 'vertical_align_bottom' },
    { id: 'lg', label: 'Large', icon: 'stat_3' },
  ];

  const handleCreate = () => {
    onAdd(selectedType, title || `New ${selectedType}`, width, height);
    setTitle('');
    onClose();
  };

  const handleAddFromLibrary = (lib: LibraryWidget) => {
    onAdd(lib.type, lib.title, lib.w, lib.h);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 transition-colors duration-300">
        
        {/* Header */}
        <div className="px-6 pt-6 bg-white dark:bg-slate-900 transition-colors duration-300">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">add_box</span>
              Add Dashboard Element
            </h2>
            <button onClick={onClose} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-white transition-colors">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-6 border-b border-slate-200 dark:border-slate-800">
            <button 
              onClick={() => setActiveTab('library')}
              className={`pb-3 text-sm font-bold transition-all border-b-2 px-1 ${
                activeTab === 'library' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              Widget Library
            </button>
            <button 
              onClick={() => setActiveTab('builder')}
              className={`pb-3 text-sm font-bold transition-all border-b-2 px-1 ${
                activeTab === 'builder' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              Custom Builder
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar max-h-[60vh]">
          {activeTab === 'library' ? (
            <div className="space-y-6">
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm group-focus-within:text-primary transition-colors">search</span>
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setVisibleWidgetsCount(INITIAL_COUNT); }}
                  placeholder="Search widgets by title or description..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
                {searchQuery && (
                  <button 
                    onClick={() => { setSearchQuery(''); setVisibleWidgetsCount(INITIAL_COUNT); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {WIDGET_LIBRARY.filter(lib => 
                  lib.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                  lib.desc.toLowerCase().includes(searchQuery.toLowerCase())
                ).slice(0, visibleWidgetsCount).map((lib) => (
                  <button
                    key={lib.id}
                    onClick={() => handleAddFromLibrary(lib)}
                    className="flex items-start gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:border-primary/50 hover:bg-primary/5 dark:hover:bg-primary/10 transition-all text-left group"
                  >
                  <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-primary transition-colors">
                    <span className="material-symbols-outlined text-2xl">{lib.icon}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-bold text-slate-800 dark:text-white">{lib.title}</p>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                        {lib.w}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-tight">{lib.desc}</p>
                  </div>
                </button>
              ))}

              {WIDGET_LIBRARY.filter(lib => 
                lib.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                lib.desc.toLowerCase().includes(searchQuery.toLowerCase())
              ).length === 0 && (
                <div className="col-span-full py-12 text-center">
                  <span className="material-symbols-outlined text-4xl text-slate-200 dark:text-slate-700 mb-2">search_off</span>
                  <p className="text-slate-500 dark:text-slate-400 text-sm italic">No widgets found matching "{searchQuery}"</p>
                  <button 
                    onClick={() => { setSearchQuery(''); setVisibleWidgetsCount(INITIAL_COUNT); }}
                    className="mt-3 text-primary text-xs font-bold uppercase tracking-widest hover:underline"
                  >
                    Clear Search
                  </button>
                </div>
              )}
            </div>

            {WIDGET_LIBRARY.filter(lib => 
                lib.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                lib.desc.toLowerCase().includes(searchQuery.toLowerCase())
              ).length > visibleWidgetsCount && (
                <div className="flex justify-center pt-2">
                  <button 
                        onClick={() => setVisibleWidgetsCount(prev => prev + 6)}
                    className="flex items-center gap-1.5 py-2 px-4 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 dark:text-slate-400 hover:bg-primary/10 hover:text-primary transition-all uppercase tracking-widest"
                  >
                    Load More
                  </button>
                </div>
              )}
            </div>
        ) : (
            <div className="space-y-8">
              <section>
                <div className="flex flex-col gap-4 mb-4">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">1. Select Visualization</label>
                  <div className="relative group">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm group-focus-within:text-primary transition-colors">search</span>
                    <input 
                      type="text"
                      value={vizSearchQuery}
                      onChange={(e) => setVizSearchQuery(e.target.value)}
                      placeholder="Search visualization types..."
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                    {vizSearchQuery && (
                      <button 
                        onClick={() => setVizSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                      >
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {types.filter(t => 
                    t.label.toLowerCase().includes(vizSearchQuery.toLowerCase()) ||
                    t.desc.toLowerCase().includes(vizSearchQuery.toLowerCase())
                  ).map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedType(t.id)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all text-center group ${
                        selectedType === t.id 
                          ? 'bg-primary/5 dark:bg-primary/10 border-primary ring-1 ring-primary' 
                          : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500'
                      }`}
                    >
                      <span className={`material-symbols-outlined text-3xl ${selectedType === t.id ? 'text-primary' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`}>
                        {t.icon}
                      </span>
                      <div>
                        <p className={`text-sm font-bold ${selectedType === t.id ? 'text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>{t.label}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight mt-1">{t.desc}</p>
                      </div>
                    </button>
                  ))}
                  {types.filter(t => 
                    t.label.toLowerCase().includes(vizSearchQuery.toLowerCase()) ||
                    t.desc.toLowerCase().includes(vizSearchQuery.toLowerCase())
                  ).length === 0 && (
                    <div className="col-span-full py-8 text-center bg-slate-50 dark:bg-slate-900/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                      <p className="text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-widest italic">No matching visualizations</p>
                    </div>
                  )}
                </div>
              </section>

              <section>
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">2. Widget Height</label>
                <div className="grid grid-cols-4 gap-3">
                  {heights.map((h) => (
                    <button
                      key={h.id}
                      onClick={() => setHeight(h.id)}
                      className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${
                        height === h.id 
                          ? 'bg-primary/5 dark:bg-primary/10 border-primary text-primary' 
                          : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:border-slate-400 dark:hover:border-slate-500'
                      }`}
                    >
                      <span className="material-symbols-outlined text-lg">{h.icon}</span>
                      <span className="text-xs font-bold">{h.label}</span>
                    </button>
                  ))}
                </div>
              </section>

              <section className="grid grid-cols-2 gap-6 pb-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">3. Widget Title</label>
                  <input 
                    type="text" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Clinical Summary"
                    className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-white focus:ring-primary focus:border-primary placeholder:text-slate-300 dark:placeholder:text-slate-600 transition-colors duration-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">4. Grid Width</label>
                  <select 
                    value={width}
                    onChange={(e) => setWidth(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-white focus:ring-primary focus:border-primary transition-colors duration-300 px-3 py-2 appearance-none"
                  >
                    <option value={4}>Small (1/3 Width)</option>
                    <option value={6}>Medium (1/2 Width)</option>
                    <option value={8}>Large (2/3 Width)</option>
                    <option value={12}>Full (Entire Row)</option>
                  </select>
                </div>
              </section>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-800/20 transition-colors duration-300">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-white transition-colors uppercase tracking-widest"
          >
            Cancel
          </button>
          {activeTab === 'builder' && (
            <button 
              onClick={handleCreate}
              className="px-6 py-2 bg-primary text-white text-xs font-bold rounded-lg uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
            >
              Create Widget
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default WidgetCreatorModal;