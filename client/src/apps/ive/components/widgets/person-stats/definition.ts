import type { WidgetDefinition } from '../types';
import { CohortWidgetConfig, requirePerson } from './settings';
import PersonStatsWidget from './index';
import PersonStatsSettings from './settings';

const personStats: WidgetDefinition<CohortWidgetConfig> = {
  type: 'person_stats',
  label: 'Record Summary',
  description: 'Record counts per OMOP table for a subject',
  icon: 'analytics',
  category: 'person',
  defaultLayout: { w: 12, h: 'auto' },
  Component: PersonStatsWidget,
  Settings: PersonStatsSettings,
  validate: requirePerson,
};

export default personStats;
