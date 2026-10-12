import React from 'react';

interface WidgetFrameProps {
  title: string;
  isEditMode: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
  onRemove?: () => void;
  onEdit?: () => void;
}

const WidgetFrame: React.FC<WidgetFrameProps> = ({ 
  title, 
  isEditMode, 
  children, 
  footer, 
  onRemove,
  onEdit
}) => {
  return (
    <div 
      className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl overflow-hidden flex flex-col group animate-in fade-in slide-in-from-bottom-2 duration-500 h-full transition-all duration-300 ${
        isEditMode ? 'ring-1 ring-slate-300 dark:ring-slate-700/50' : ''
      }`}
    >
      <div className={`flex items-center justify-between px-4 py-2 border-b border-slate-200 dark:border-slate-800 transition-colors shrink-0 ${isEditMode ? 'bg-slate-100 dark:bg-slate-700/30' : 'bg-slate-50 dark:bg-slate-800/30'}`}>
        <div className="flex items-center gap-2">
          {isEditMode && (
            <span className="material-symbols-outlined text-slate-400 dark:text-slate-500 cursor-grab active:cursor-grabbing hover:text-primary transition-colors">drag_indicator</span>
          )}
          <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest pointer-events-none">{title}</span>
        </div>
        <div className="flex items-center gap-1">
          {isEditMode && (
            <>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.();
              }}
              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              <span className="material-symbols-outlined text-lg">settings</span>
            </button>

          <button 
            onClick={(e) => {
              e.stopPropagation();
              onRemove?.();
            }}
            className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
            </>
          )}
        </div>
      </div>
      
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        {children}
      </div>

      {footer && (
        <div className="px-6 py-3 bg-slate-50/50 dark:bg-slate-800/20 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 transition-colors duration-300">
          {footer}
        </div>
      )}
    </div>
  );
};

export default WidgetFrame;