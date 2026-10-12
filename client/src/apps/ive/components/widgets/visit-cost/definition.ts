import type { WidgetDefinition } from '../types';
import VisitCostWidget from './index';
import VisitCostSettings, { VisitCostConfig, visitCostDefaults, validateVisitCostConfig } from './settings';

const visitCost: WidgetDefinition<VisitCostConfig> = {
  type: 'visit_cost',
  label: 'Visit Cost',
  description: 'Cost analysis and insurance split for a visit',
  icon: 'payments',
  category: 'visit',
  defaultLayout: { w: 4, h: 'auto' },
  Component: VisitCostWidget,
  Settings: VisitCostSettings,
  defaults: visitCostDefaults,
  validate: validateVisitCostConfig,
  presets: [
    { title: 'Visit Cost', description: 'Cost analysis and insurance split for a visit', layout: { w: 4, h: 'auto' } },
  ],
};

export default visitCost;
