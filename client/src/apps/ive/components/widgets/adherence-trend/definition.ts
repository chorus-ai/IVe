import type { WidgetDefinition } from '../types';
import AdherenceTrendWidget from './index';
import AdherenceTrendSettings, { AdherenceTrendConfig, adherenceTrendDefaults, validateAdherenceTrendConfig } from './settings';

const adherenceTrend: WidgetDefinition<AdherenceTrendConfig> = {
  type: 'adherence_trend',
  label: 'Adherence Trend',
  description: 'Monthly PDC trend with refill events',
  icon: 'trending_up',
  category: 'person',
  defaultLayout: { w: 6, h: 'md' },
  Component: AdherenceTrendWidget,
  Settings: AdherenceTrendSettings,
  defaults: adherenceTrendDefaults,
  validate: validateAdherenceTrendConfig,
  presets: [
    { title: 'Adherence Trend', description: 'Monthly PDC trend with refill events', layout: { w: 6, h: 'md' } },
  ],
};

export default adherenceTrend;
