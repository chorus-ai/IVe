import type { WidgetDefinition } from '../types';
import RadarChartWidget from './index';
import RadarChartSettings, { RadarConfig, radarDefaults, validateRadarConfig } from './settings';

const radarChart: WidgetDefinition<RadarConfig> = {
  type: 'radar_chart',
  label: 'Radar Chart',
  description: 'Multi-axis risk comparison',
  icon: 'radar',
  category: 'chart',
  defaultLayout: { w: 4, h: 'md' },
  Component: RadarChartWidget,
  Settings: RadarChartSettings,
  defaults: radarDefaults,
  validate: validateRadarConfig,
  presets: [
    { title: 'Risk Radar', description: 'Multi-axis risk comparison', layout: { w: 4, h: 'md' } },
  ],
};

export default radarChart;
