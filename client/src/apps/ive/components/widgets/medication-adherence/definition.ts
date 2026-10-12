import type { WidgetDefinition } from '../types';
import MedicationAdherenceWidget from './index';
import MedicationAdherenceSettings, { MedAdherenceConfig, medAdherenceDefaults, validateMedAdherenceConfig } from './settings';

const medicationAdherence: WidgetDefinition<MedAdherenceConfig> = {
  type: 'medication_adherence',
  label: 'Medication Adherence',
  description: 'Per-medication PDC with adherence status',
  icon: 'medication',
  category: 'person',
  defaultLayout: { w: 6, h: 'md' },
  Component: MedicationAdherenceWidget,
  Settings: MedicationAdherenceSettings,
  defaults: medAdherenceDefaults,
  validate: validateMedAdherenceConfig,
  presets: [
    { title: 'Medication Adherence', description: 'Per-medication PDC with adherence status', layout: { w: 6, h: 'md' } },
  ],
};

export default medicationAdherence;
