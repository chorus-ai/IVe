import type { WidgetDefinition } from '../types';
import { requirePerson } from './settings';
import PersonMeasurementsWidget, { PersonMeasurementsConfig } from './index';
import PersonMeasurementsSettings from './settings';

const personMeasurements: WidgetDefinition<PersonMeasurementsConfig> = {
  type: 'person_measurements',
  label: 'Recent Measurements',
  description: 'Latest measurement values for a subject',
  icon: 'monitor_heart',
  category: 'person',
  defaultLayout: { w: 12, h: 'auto' },
  Component: PersonMeasurementsWidget,
  Settings: PersonMeasurementsSettings,
  defaults: { limit: 10 },
  validate: requirePerson,
  presets: [
    {
      title: 'Recent Measurements',
      description: 'Latest measurement values for a subject',
      config: {
        request: {
          endpoint: '/api/omop/measurement/search?page=1&pageSize=0',
          method: 'POST' as const,
          body: '{ "person_id": {{personId}} }',
        },
        limit: 10,
      },
    },
  ],
};

export default personMeasurements;
