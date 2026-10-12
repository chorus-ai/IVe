import type { WidgetDefinition } from '../types';
import AlarmScoreWidget, { AlarmScoreConfig } from './index';
import AlarmScoreSettings from './settings';

const alarmScore: WidgetDefinition<AlarmScoreConfig> = {
  type: 'alarm_score',
  label: 'SuperAlarm Score',
  description: 'SuperAlarm score event strip with the current score and trigger time (mock data)',
  icon: 'crisis_alert',
  category: 'person',
  defaultLayout: { w: 12, h: 'auto' },
  Component: AlarmScoreWidget,
  Settings: AlarmScoreSettings,
  defaults: { threshold: 50, eventCount: 260 },
};

export default alarmScore;
