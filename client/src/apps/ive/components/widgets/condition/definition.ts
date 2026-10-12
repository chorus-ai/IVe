import type { WidgetDefinition } from '../types';
import OmopConditionOccurrenceWidget from './index';
import OmopConditionOccurrenceSettings, { ConditionConfig, conditionDefaults, validateConditionConfig } from './settings';

const condition: WidgetDefinition<ConditionConfig> = {
  type: 'condition',
  label: 'Active Conditions',
  description: 'Detailed list of patient conditions and codes',
  icon: 'clinical_notes',
  category: 'person',
  defaultLayout: { w: 8, h: 'auto' },
  Component: OmopConditionOccurrenceWidget,
  Settings: OmopConditionOccurrenceSettings,
  defaults: conditionDefaults,
  validate: validateConditionConfig,
  presets: [
    { title: 'Active Conditions', description: 'Detailed list of patient conditions and codes' },
  ],
};

export default condition;
