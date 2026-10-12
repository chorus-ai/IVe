import React from 'react';
import type { WidgetType, WidgetDefinition, WidgetConfig } from './types';
import demographics from './demographics/definition';
import personDemographics from './person-demographics/definition';
import personStats from './person-stats/definition';
import cohortTimeline from './cohort-timeline/definition';
import personTopConcepts from './person-top-concepts/definition';
import personMeasurements from './person-measurements/definition';
import waveform from './waveform/definition';
import measurementTrend from './measurement-trend/definition';
import alarmScore from './monitor-alarm-score/definition';
import alarmTimeline from './monitor-alarm-timeline/definition';
import vitalsMonitor from './monitor-vitals/definition';
import imageSeries from './image-series/definition';
import labsDotplot from './labs-dotplot/definition';
import clinicalNote from './clinical-note/definition';
import patientProfile from './patient-profile/definition';
import domainTable from './domain-table/definition';
import condition from './condition/definition';
import timeline from './timeline/definition';
import stats from './stats/definition';
import table from './table/definition';
import { barChart, lineChart, pieChart } from './chart/definition';
import radarChart from './radar-chart/definition';
import organTrajectory from './organ-trajectory/definition';
import interventionSuggestions from './intervention-suggestions/definition';
import medicationAdherence from './medication-adherence/definition';
import adherenceTrend from './adherence-trend/definition';
import tableCard from './table-card/definition';
import visitHeader from './visit-header/definition';
import visitCost from './visit-cost/definition';

/**
 * The widget store: one entry per catalog folder. Adding a widget =
 * create `catalog/<name>/{definition.ts,<Name>Widget.tsx,<Name>Settings.tsx}`
 * and register the definition here. The renderer (RegistryWidget, below),
 * the settings modal, and the creator modal's library all read this map,
 * so a registered widget is immediately renderable, configurable, and
 * offered in the Add Widget picker.
 *
 * Every WidgetType is registered here; the renderer returns null for any
 * type missing from the map. The WidgetType union in types.ts is kept in
 * sync by hand (it can't be derived here without a circular import).
 */
export const WIDGET_REGISTRY = {
  demographics,
  person_demographics: personDemographics,
  person_stats: personStats,
  cohort_timeline: cohortTimeline,
  person_top_concepts: personTopConcepts,
  person_measurements: personMeasurements,
  waveform,
  measurement_trend: measurementTrend,
  alarm_score: alarmScore,
  alarm_timeline: alarmTimeline,
  vitals_monitor: vitalsMonitor,
  image_series: imageSeries,
  labs_dotplot: labsDotplot,
  clinical_note: clinicalNote,
  patient_profile: patientProfile,
  domain_table: domainTable,
  condition,
  timeline,
  stats,
  table,
  bar_chart: barChart,
  line_chart: lineChart,
  pie_chart: pieChart,
  radar_chart: radarChart,
  organ_trajectory: organTrajectory,
  intervention_suggestions: interventionSuggestions,
  medication_adherence: medicationAdherence,
  adherence_trend: adherenceTrend,
  table_card: tableCard,
  visit_header: visitHeader,
  visit_cost: visitCost,
} satisfies Partial<Record<WidgetType, WidgetDefinition<any>>>;

export function getWidget(type: WidgetType): WidgetDefinition<any> | undefined {
  return (WIDGET_REGISTRY as Partial<Record<WidgetType, WidgetDefinition<any>>>)[type];
}

/**
 * Serializable catalog of every registered widget — the context an AI/agent
 * needs to assemble a layout from a prompt. Data access is taught by
 * example: presets carry explicit, executable `request` templates. Feed the
 * result (as JSON) into the prompt; validate the model's proposed
 * WidgetConfig[] with each definition's `validate` before rendering.
 */
export function describeRegistry() {
  return Object.values(WIDGET_REGISTRY).map((def: WidgetDefinition<any>) => ({
    type: def.type,
    label: def.label,
    description: def.description,
    category: def.category,
    defaultLayout: def.defaultLayout,
    defaults: def.defaults,
    presets: def.presets?.map(({ title, description, config }) => ({ title, description, config })),
  }));
}

interface RegistryWidgetProps {
  widget: WidgetConfig;
  isEditMode: boolean;
  onRemove?: () => void;
  onEdit?: () => void;
  /** Config values from the hosting page's context (e.g. the selected subject); win over the saved config. */
  overrides?: Record<string, unknown>;
}

/**
 * Generic renderer for registry-backed widgets. Returns null for types not
 * (yet) in WIDGET_REGISTRY so callers can fall back to their legacy switch.
 */
const RegistryWidget: React.FC<RegistryWidgetProps> = ({ widget, isEditMode, onRemove, onEdit, overrides }) => {
  const def = getWidget(widget.type);
  if (!def) return null;
  const config = { ...def.defaults, ...widget.config, ...overrides };
  return (
    <def.Component
      title={widget.title}
      config={config}
      isEditMode={isEditMode}
      onRemove={onRemove}
      onEdit={onEdit}
    />
  );
};

export default RegistryWidget;
