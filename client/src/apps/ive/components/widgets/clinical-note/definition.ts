import type { WidgetDefinition } from '../types';
import ClinicalNotesWidget from './index';
import ClinicalNotesSettings, {
  ClinicalNotesConfig,
  clinicalNotesDefaults,
  validateClinicalNotesConfig,
} from './settings';

const clinicalNote: WidgetDefinition<ClinicalNotesConfig> = {
  type: 'clinical_note',
  label: 'Clinical Note',
  description: 'Full-text clinical documentation (SOAP format)',
  icon: 'description',
  category: 'person',
  defaultLayout: { w: 8, h: 'auto' },
  Component: ClinicalNotesWidget,
  Settings: ClinicalNotesSettings,
  defaults: clinicalNotesDefaults,
  validate: validateClinicalNotesConfig,
  presets: [
    { title: 'Physician Progress Note', description: 'Full-text clinical documentation (SOAP format)' },
  ],
};

export default clinicalNote;
