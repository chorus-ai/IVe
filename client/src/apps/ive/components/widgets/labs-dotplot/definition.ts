import type { WidgetDefinition } from '../types';
import LabsDotplotWidget, { LabsDotplotConfig } from './index';
import LabsDotplotSettings from './settings';

const labsDotplot: WidgetDefinition<LabsDotplotConfig> = {
  type: 'labs_dotplot',
  label: 'Labs Dot Plot',
  description: 'Lab results over time: one dot row per analyte, depth = abnormality (mock data)',
  icon: 'labs',
  category: 'person',
  defaultLayout: { w: 4, h: 'lg' },
  Component: LabsDotplotWidget,
  Settings: LabsDotplotSettings,
};

export default labsDotplot;
