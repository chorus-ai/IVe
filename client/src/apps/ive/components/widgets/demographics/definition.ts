import type { WidgetDefinition } from '../types';
import DemographicsWidget, { DemographicsConfig } from './index';
import DemographicsSettings from './settings';

const demographics: WidgetDefinition<DemographicsConfig> = {
  type: 'demographics',
  label: 'Demographics',
  description: 'Gender and age distribution for a cohort',
  icon: 'groups',
  category: 'cohort',
  defaultLayout: { w: 4, h: 'auto' },
  Component: DemographicsWidget,
  Settings: DemographicsSettings,
  defaults: { source: 'static', showSummary: true },
  validate: (c) =>
    (c.source ?? 'static') === 'endpoint' && !c.endpoint ? ['Endpoint is required.'] : [],
  presets: [
    {
      title: 'Cohort Demographics',
      description: 'Gender and age distribution for selected cohort',
    },
  ],
};

export default demographics;
