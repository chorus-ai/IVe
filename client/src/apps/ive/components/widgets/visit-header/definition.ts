import type { WidgetDefinition } from '../types';
import VisitHeaderWidget from './index';
import VisitHeaderSettings, { VisitHeaderConfig, visitHeaderDefaults, validateVisitHeaderConfig } from './settings';

const visitHeader: WidgetDefinition<VisitHeaderConfig> = {
  type: 'visit_header',
  label: 'Visit Header',
  description: 'Header banner summarizing a visit occurrence',
  icon: 'event',
  category: 'visit',
  defaultLayout: { w: 12, h: 'auto' },
  Component: VisitHeaderWidget,
  Settings: VisitHeaderSettings,
  defaults: visitHeaderDefaults,
  validate: validateVisitHeaderConfig,
  presets: [
    { title: 'Visit Header', description: 'Header banner summarizing a visit occurrence', layout: { w: 12, h: 'auto' } },
  ],
};

export default visitHeader;
