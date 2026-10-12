import type { WidgetDefinition } from '../types';
import VitalsMonitorWidget, { VitalsMonitorConfig } from './index';
import VitalsMonitorSettings from './settings';

const vitalsMonitor: WidgetDefinition<VitalsMonitorConfig> = {
  type: 'vitals_monitor',
  label: 'Vital Trends',
  description: 'HR / RESP / SpO2 trend rows with alarm limits and value histograms (mock data)',
  icon: 'vital_signs',
  category: 'person',
  defaultLayout: { w: 12, h: 'auto' },
  Component: VitalsMonitorWidget,
  Settings: VitalsMonitorSettings,
};

export default vitalsMonitor;
