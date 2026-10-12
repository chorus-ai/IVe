import type { WidgetDefinition } from '../types';
import PatientProfileWidget from './index';
import PatientProfileSettings, {
  PatientProfileConfig,
  patientProfileDefaults,
  validatePatientProfileConfig,
} from './settings';

const patientProfile: WidgetDefinition<PatientProfileConfig> = {
  type: 'patient_profile',
  label: 'Patient Profile',
  description: 'Demographic and identity summary banner for a person',
  icon: 'badge',
  category: 'person',
  defaultLayout: { w: 12, h: 'auto' },
  Component: PatientProfileWidget,
  Settings: PatientProfileSettings,
  defaults: patientProfileDefaults,
  validate: validatePatientProfileConfig,
  presets: [
    { title: 'Patient Profile', description: 'Demographic and identity summary banner for a person' },
  ],
};

export default patientProfile;
