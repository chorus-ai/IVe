import React from 'react';
import type { WidgetConfig } from './types';
import RegistryWidget from './registry';

const heightClass = (h?: string) => {
  switch (h) {
    case 'sm': return 'h-[250px]';
    case 'md': return 'h-[450px]';
    case 'lg': return 'h-[650px]';
    default: return 'h-auto';
  }
};

interface WidgetGridProps {
  widgets: WidgetConfig[];
  /** Config values that win over each widget's saved config (page context, e.g. the selected subject). */
  overrides?: Record<string, unknown>;
}

/**
 * Read-only grid of registry-backed widgets, for pages that host a layout
 * outside the workspace editor. Non-registry widget types are skipped.
 */
const WidgetGrid: React.FC<WidgetGridProps> = ({ widgets, overrides }) => (
  <div className="grid grid-cols-12 gap-6 items-start">
    {widgets.map((widget) => (
      <div key={widget.id} className={`col-span-12 lg:col-span-${widget.w} ${heightClass(widget.h)}`}>
        <RegistryWidget widget={widget} overrides={overrides} isEditMode={false} />
      </div>
    ))}
  </div>
);

export default WidgetGrid;
