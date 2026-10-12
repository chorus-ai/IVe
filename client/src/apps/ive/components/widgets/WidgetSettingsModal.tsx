import React, { useState, useEffect, useMemo } from 'react';
import { WidgetConfig } from './types';
import { getWidget } from './registry';

interface WidgetSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  widget: WidgetConfig | null;
  onSave: (updatedWidget: WidgetConfig) => void;
}

const WidgetSettingsModal: React.FC<WidgetSettingsModalProps> = ({ isOpen, onClose, widget, onSave }) => {
  const [config, setConfig] = useState<WidgetConfig['config']>({});
  const [title, setTitle] = useState('');

  const entry = useMemo(() => {
    if (!widget) return undefined;
    // Registry-backed widgets carry their settings in their definition.
    const def = getWidget(widget.type);
    if (def) return { Component: def.Settings, defaults: def.defaults, validate: def.validate };
    return undefined;
  }, [widget]);

  useEffect(() => {
    if (widget) {
      setConfig({ ...(entry?.defaults ?? {}), ...(widget.config ?? {}) });
      setTitle(widget.title);
    }
  }, [widget, entry]);

  if (!isOpen || !widget) return null;

  const errors = entry?.validate?.(config) ?? [];

  const handleSave = () => {
    if (errors.length > 0) return;
    onSave({ ...widget, title, config: { ...widget.config, ...config } });
    onClose();
  };

  const SettingsComponent = entry?.Component;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">Widget Settings</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh] custom-scrollbar">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 ">Widget Type</label>
            <div className="w-full bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-600 dark:text-slate-400 font-mono">
              {widget.type}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 ">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 outline-none"
            />
          </div>

          {SettingsComponent ? (
            <SettingsComponent config={config ?? {}} onChange={setConfig} widgetType={widget.type} />
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400 italic">
              No additional settings available for this widget type.
            </p>
          )}

          {errors.length > 0 && (
            <ul className="text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg p-3 space-y-1">
              {errors.map((e, i) => <li key={i}>• {e}</li>)}
            </ul>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/20 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 dark:text-slate-400 text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={errors.length > 0}
            className="px-4 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default WidgetSettingsModal;
