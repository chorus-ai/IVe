import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux';
import { WidgetConfig, WidgetType } from '../components/widgets/types';
import {
  setCurrentWidgets,
  setLayouts,
  addSavedLayout,
  setActiveLayout,
  showIveAlert,
  DEFAULT_LAYOUTS,
} from '../store';
import { listLayouts, createLayout } from '../api/layouts';
import RegistryWidget from '../components/widgets/registry';
import WidgetCreatorModal from '../components/widgets/WidgetCreatorModal';
import ConfigModal from '../components/ConfigModal';
import SaveLayoutModal from '../components/SaveLayoutModal';
import WidgetSettingsModal from '../components/widgets/WidgetSettingsModal';
import LayoutsSidebar from '../components/LayoutsSidebar';
import BrowseArchiveModal from '../components/BrowseArchiveModal';

const Workspace: React.FC = () => {
  const dispatch = useAppDispatch();
  const savedLayouts = useAppSelector((s) => s.ive.savedLayouts);
  const activeLayoutId = useAppSelector((s) => s.ive.activeLayoutId);
  const reduxWidgets = useAppSelector((s) => s.ive.currentWidgets);
  const [widgets, setWidgets] = useState<WidgetConfig[]>(reduxWidgets);

  useEffect(() => {
    setWidgets(reduxWidgets);
  }, [reduxWidgets]);

  // Load layouts from server on mount and append defaults that aren't on the server
  useEffect(() => {
    listLayouts().then((layouts) => {
      const serverIds = new Set(layouts.map((l) => l.id));
      const missingDefaults = DEFAULT_LAYOUTS.filter((l) => !serverIds.has(l.id));
      dispatch(setLayouts([...layouts, ...missingDefaults]));
    }).catch(() => {});
  }, [dispatch]);

  const updateWidgets = (newWidgets: WidgetConfig[] | ((prev: WidgetConfig[]) => WidgetConfig[])) => {
    const updated = typeof newWidgets === 'function' ? newWidgets(widgets) : newWidgets;
    setWidgets(updated);
    dispatch(setCurrentWidgets(updated));
  };

  const [isEditMode, setIsEditModeLocal] = useState(false);
  const [isBrowseArchiveOpen, setIsBrowseArchiveOpen] = useState(false);
  
  const [draggedWidgetId, setDraggedWidgetId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

  // Widget Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingWidget, setEditingWidget] = useState<WidgetConfig | null>(null);

  const handleEditWidget = (widget: WidgetConfig) => {
    setEditingWidget(widget);
    setIsSettingsOpen(true);
  };

  const handleSaveWidgetConfig = (updatedWidget: WidgetConfig) => {
    updateWidgets(widgets.map(w => w.id === updatedWidget.id ? updatedWidget : w));
    setIsSettingsOpen(false);
    setEditingWidget(null);
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    if (!isEditMode) return;
    e.dataTransfer.setData('widgetId', id);
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => setDraggedWidgetId(id), 0);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (dragOverId !== id) {
      setDragOverId(id);
    }
  };

  const handleDragEnd = () => {
    setDraggedWidgetId(null);
    setDragOverId(null);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('widgetId') || draggedWidgetId;
    
    if (!isEditMode || !draggedId || draggedId === targetId) {
      handleDragEnd();
      return;
    }

    const newWidgets = [...widgets];
    const draggedIndex = newWidgets.findIndex(w => w.id === draggedId);
    const targetIndex = newWidgets.findIndex(w => w.id === targetId);

    if (draggedIndex !== -1 && targetIndex !== -1) {
      const [removed] = newWidgets.splice(draggedIndex, 1);
      newWidgets.splice(targetIndex, 0, removed);
      updateWidgets(newWidgets);
    }
    
    handleDragEnd();
  };

  const addWidget = (type: WidgetType, title: string, width: number, height: 'auto' | 'sm' | 'md' | 'lg') => {
    const newWidget: WidgetConfig = {
      id: `w-${Date.now()}`,
      type,
      title,
      w: width,
      h: height
    };
    updateWidgets([...widgets, newWidget]);
  };

  const removeWidget = (id: string) => {
    updateWidgets(widgets.filter(w => w.id !== id));
  };

  const renderWidget = (widget: WidgetConfig) => (
    <RegistryWidget
      widget={widget}
      isEditMode={isEditMode}
      onRemove={() => removeWidget(widget.id)}
      onEdit={() => handleEditWidget(widget)}
    />
  );

  const getHeightClass = (h?: string) => {
    switch (h) {
      case 'sm': return 'h-[250px]';
      case 'md': return 'h-[450px]';
      case 'lg': return 'h-[650px]';
      default: return 'h-auto';
    }
  };

  const onConfirmSaveLayout = (name: string, tags: string[]) => {
    const widgetsCopy: typeof widgets = JSON.parse(JSON.stringify(widgets));
    createLayout({ name, widgets: widgetsCopy })
      .then((saved) => {
        dispatch(addSavedLayout({ ...saved, tags }));
        setIsSaveModalOpen(false);
        dispatch(showIveAlert({ message: 'Layout saved successfully', severity: 'success' }));
      })
      .catch(() => {
        // Fallback: save locally only
        dispatch(addSavedLayout({
          id: `l-${Date.now()}`,
          name,
          tags,
          date: new Date().toISOString().split('T')[0],
          widgets: widgetsCopy,
        }));
        setIsSaveModalOpen(false);
        dispatch(showIveAlert({ message: 'Layout saved successfully', severity: 'success' }));
      });
  };

  return (
    <div className="flex flex-1 overflow-hidden w-full h-full">
      <LayoutsSidebar 
        layouts={savedLayouts} 
        activeId={activeLayoutId} 
        onSelect={(layout) => dispatch(setActiveLayout(layout))} 
        onBrowseArchive={() => setIsBrowseArchiveOpen(true)}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-panel-light dark:bg-panel-dark border-b border-slate-200 dark:border-slate-800 px-6 py-3 flex flex-wrap items-center justify-between gap-4 transition-colors duration-300 relative shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
            <span className="material-symbols-outlined text-lg">medical_information</span>
            <span className="font-semibold text-slate-900 dark:text-white uppercase tracking-widest text-[11px]">Layout</span>
          </div>
          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1"></div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-slate-500/10 text-slate-500 border border-slate-500/20 uppercase tracking-widest">
              Draft
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsCreatorOpen(true)}
            className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">add_circle</span>
            Add Widget
          </button>
          
          <button 
            onClick={() => setIsConfigOpen(true)}
            className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">settings</span>
           View Config
          </button>
          
          <button 
            onClick={() => setIsSaveModalOpen(true)}
            className="flex items-center gap-1.5 bg-primary text-white px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
          >
            <span className="material-symbols-outlined text-lg">save</span>
            Save
          </button>

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1"></div>
          <label className="inline-flex items-center cursor-pointer">
            <span className="mr-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">edit</span>
            <div 
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${isEditMode ? 'bg-primary/40' : 'bg-slate-300 dark:bg-slate-800'}`}
              onClick={() => setIsEditModeLocal(!isEditMode)}
            >
              <div 
                className={`absolute left-1 h-4 w-4 rounded-full bg-primary transition-transform ${isEditMode ? 'translate-x-5' : 'translate-x-0 shadow-sm'}`}
              ></div>
            </div>
          </label>
        </div>
      </div>

      <WidgetCreatorModal 
        isOpen={isCreatorOpen} 
        onClose={() => setIsCreatorOpen(false)} 
        onAdd={addWidget}
      />

      <ConfigModal 
        isOpen={isConfigOpen} 
        onClose={() => setIsConfigOpen(false)} 
        config={widgets}
      />

      <SaveLayoutModal 
        isOpen={isSaveModalOpen} 
        onClose={() => setIsSaveModalOpen(false)} 
        onSave={onConfirmSaveLayout}
        widgets={widgets}
      />

      <WidgetSettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        widget={editingWidget}
        onSave={handleSaveWidgetConfig}
      />

      <div className="flex-1 overflow-auto custom-scrollbar p-6">
        {widgets.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-12 animate-in fade-in duration-700">
            <div className="w-24 h-24 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mb-6 border border-slate-200 dark:border-slate-800 shadow-inner">
              <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-700">dashboard_customize</span>
            </div>
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">Blank Workspace</h3>
            <p className="text-sm text-slate-500 dark:text-slate-500 max-w-sm mb-8">
              This dashboard is currently empty. Use the <strong>Add Widget</strong> button in the toolbar to start building your clinical view.
            </p>
            <button 
              onClick={() => setIsCreatorOpen(true)}
              className="px-6 py-2.5 bg-primary text-white text-xs font-bold rounded-xl uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">add_circle</span>
              Start Building
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-6 items-start max-w-[1600px] mx-auto">
            {widgets.map((widget) => (
              <div 
                key={widget.id} 
                draggable={isEditMode}
                onDragStart={(e) => handleDragStart(e, widget.id)}
                onDragOver={(e) => handleDragOver(e, widget.id)}
                onDragEnd={handleDragEnd}
                onDrop={(e) => handleDrop(e, widget.id)}
                className={`col-span-12 lg:col-span-${widget.w} ${getHeightClass(widget.h)} transition-all duration-300 rounded-xl ${
                  draggedWidgetId === widget.id ? 'opacity-20 scale-95 pointer-events-none' : 'opacity-100'
                } ${
                  dragOverId === widget.id && draggedWidgetId !== widget.id ? 'ring-2 ring-primary ring-offset-4 ring-offset-slate-100 dark:ring-offset-slate-950 scale-[1.02]' : ''
                }`}
              >
                {renderWidget(widget)}
              </div>
            ))}
          </div>
        )}
      </div>
      </div>
      <BrowseArchiveModal 
        isOpen={isBrowseArchiveOpen}
        onClose={() => setIsBrowseArchiveOpen(false)}
        layouts={savedLayouts}
        onRestore={(layout) => dispatch(setActiveLayout(layout))}
      />
    </div>
  );
};

export default Workspace;