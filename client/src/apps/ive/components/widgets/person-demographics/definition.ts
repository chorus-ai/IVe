import type { WidgetDefinition } from '../types';
import { CohortWidgetConfig, requirePerson } from './settings';
import PersonDemographicsWidget from './index';
import PersonDemographicsSettings from './settings';

const personDemographics: WidgetDefinition<CohortWidgetConfig> = {
  type: 'person_demographics',
  label: 'Person Demographics',
  description: 'OMOP person record for a subject: age, gender, race, ethnicity',
  icon: 'person',
  category: 'person',
  defaultLayout: { w: 12, h: 'auto' },
  Component: PersonDemographicsWidget,
  Settings: PersonDemographicsSettings,
  validate: requirePerson,
};

export default personDemographics;
