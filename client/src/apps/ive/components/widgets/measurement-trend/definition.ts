import type { WidgetDefinition } from '../types';
import { requirePerson } from './settings';
import MeasurementTrendWidget, { MeasurementTrendConfig } from './index';
import MeasurementTrendSettings from './settings';

// Explicit request template carried by every preset: live fields (personId,
// conceptIds) are injected at fetch time, and saved layouts stay executable
// and self-describing (they double as AI-assembly examples).
const MEASUREMENT_REQUEST = {
  endpoint: '/api/omop/measurement/search?page=1&pageSize=0',
  method: 'POST' as const,
  body: '{ "person_id": {{personId}}, "measurement_concept_id": {{conceptIds}} }',
};

// Preset concept ids exist in the dev OMOP data (MIMIC-derived); colors were
// validated for contrast against both app surfaces (see doc/ive/ive_widget.md).
const measurementTrend: WidgetDefinition<MeasurementTrendConfig> = {
  type: 'measurement_trend',
  label: 'Measurement Trend',
  description: 'Line chart of one measurement over time for a subject',
  icon: 'show_chart',
  category: 'person',
  defaultLayout: { w: 4, h: 'auto' },
  Component: MeasurementTrendWidget,
  Settings: MeasurementTrendSettings,
  defaults: { limit: 100, color: '#136dec' },
  validate: (c) => {
    const errors = [...requirePerson(c)];
    if (!c.request?.endpoint && !c.conceptIds && !c.sourceValue) {
      errors.push('Concept IDs, a source value, or a custom request is required.');
    }
    return errors;
  },
  presets: [
    { title: 'Lactate', description: 'Arterial/venous lactate trend', config: { request: MEASUREMENT_REQUEST, conceptIds: '3018405, 3047181', color: '#dc2626' } },
    { title: 'White Blood Count', description: 'WBC trend', config: { request: MEASUREMENT_REQUEST, conceptIds: '3000905', color: '#7c3aed' } },
    { title: 'MAP (Arterial)', description: 'Mean arterial pressure trend', config: { request: MEASUREMENT_REQUEST, conceptIds: '21490852', color: '#136dec' } },
    { title: 'Temperature', description: 'Body temperature trend', config: { request: MEASUREMENT_REQUEST, conceptIds: '3020891', color: '#b45309' } },
    { title: 'Creatinine', description: 'Creatinine trend', config: { request: MEASUREMENT_REQUEST, conceptIds: '3016723', color: '#0369a1' } },
    { title: 'Platelet Count', description: 'Platelet trend', config: { request: MEASUREMENT_REQUEST, conceptIds: '3024929', color: '#be185d' } },
  ],
};

export default measurementTrend;
