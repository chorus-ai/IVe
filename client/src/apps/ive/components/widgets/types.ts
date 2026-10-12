import type React from 'react';
import type { OmopTables } from '../../types';

export type WidgetType =
  | 'condition'
  | 'demographics'
  | 'timeline'
  | 'stats'
  | 'table'
  | 'bar_chart'
  | 'line_chart'
  | 'pie_chart'
  | 'radar_chart'
  | 'organ_trajectory'
  | 'intervention_suggestions'
  | 'medication_adherence'
  | 'adherence_trend'
  | 'patient_profile'
  | 'domain_table'
  | 'table_card'
  | 'clinical_note'
  | 'visit_header'
  | 'visit_cost'
  | 'person_demographics'
  | 'person_stats'
  | 'cohort_timeline'
  | 'person_top_concepts'
  | 'person_measurements'
  | 'waveform'
  | 'measurement_trend'
  | 'alarm_score'
  | 'alarm_timeline'
  | 'vitals_monitor'
  | 'image_series'
  | 'labs_dotplot';

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  w: number; // grid column span (1-12)
  h?: 'auto' | 'sm' | 'md' | 'lg'; // height preset
  config?: {
    domain?: keyof OmopTables;
    dataSource?: string;
    colors?: string[];
    showTrends?: boolean;
    noteId?: string;
    // New fields
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    endpoint?: string;
    body?: string;
    attributes?: string; // Comma separated list of attributes to display
    group?: string; // Grouping field
    countOnly?: boolean;
    tableKey?: keyof OmopTables;
    personId?: number | string;
    visitId?: number | string;
    source?: 'static' | 'endpoint';
    startDate?: string;
    endDate?: string;
    table?: string;
    conceptCol?: string;
    color?: string;
    topN?: number;
    limit?: number;
    showSummary?: boolean;
    filename?: string;
    offset?: number;
    showControls?: boolean;
    conceptIds?: string;
    sourceValue?: string;
    /** Executable request template; {{param}} placeholders are filled from live fields. */
    request?: { endpoint: string; method?: 'GET' | 'POST'; body?: string };
  };
}

export interface DashboardLayout {
  id: string;
  name: string;
  /** Tag slugs from the iveTag join table. */
  tags: string[];
  date: string;
  widgets: WidgetConfig[];
  createdBy?: { id: number; username?: string; email?: string; firstName?: string; lastName?: string };
  iveTags?: { id: number; slug: string }[];
}

export type HeightPreset = 'auto' | 'sm' | 'md' | 'lg';

/**
 * Executable request template stored in a widget's config. {{param}}
 * placeholders are filled from the widget's live fields at fetch time
 * (URI-encoded in the endpoint, JSON-encoded in the body), so the saved
 * spec is exactly what the widget executes.
 */
export interface RequestSpec {
  endpoint: string;
  method?: 'GET' | 'POST';
  body?: string;
}

export type WidgetCategory = 'cohort' | 'person' | 'visit' | 'chart' | 'generic';

/**
 * Props every widget component receives from the generic renderer.
 * `config` is `def.defaults` merged with the saved `widget.config`, so
 * widgets can read it without null checks on individual defaults.
 */
export interface WidgetComponentProps<C = Record<string, unknown>> {
  title: string;
  config: C;
  isEditMode: boolean;
  onRemove?: () => void;
  onEdit?: () => void;
}

/** Props every settings panel receives from WidgetSettingsModal. */
export interface WidgetSettingsProps<C = Record<string, unknown>> {
  config: C;
  onChange: (next: C) => void;
  widgetType: WidgetType;
}

/** A pre-configured entry shown in the creator modal's Widget Library tab. */
export interface WidgetPreset<C = Record<string, unknown>> {
  title: string;
  description?: string;
  layout?: { w: number; h: HeightPreset };
  config?: Partial<C>;
}

/**
 * The store listing for one widget: everything the workspace needs to
 * render, configure, and offer it. One definition per catalog folder,
 * registered once in `widgets/registry.ts`.
 */
export interface WidgetDefinition<C = Record<string, unknown>> {
  type: WidgetType;
  label: string;
  description: string;
  /** Material Symbols icon name. */
  icon: string;
  category: WidgetCategory;
  defaultLayout: { w: number; h: HeightPreset };
  Component: React.FC<WidgetComponentProps<C>>;
  Settings?: React.FC<WidgetSettingsProps<C>>;
  defaults?: Partial<C>;
  validate?: (config: C) => string[];
  /**
   * Pre-configured examples. Doubles as the AI-assembly context: presets
   * (and the built-in layouts) carry explicit `request` templates, so an
   * agent learns each widget's data access from runnable configs rather
   * than prose metadata.
   */
  presets?: WidgetPreset<C>[];
}
