import type { WidgetDefinition } from '../types';
import OrganTrajectoryWidget from './index';
import OrganTrajectorySettings, { OrganTrajectoryConfig, organTrajectoryDefaults, validateOrganTrajectoryConfig } from './settings';

const organTrajectory: WidgetDefinition<OrganTrajectoryConfig> = {
  type: 'organ_trajectory',
  label: 'Organ Trajectory',
  description: 'SOFA-style organ subscore trajectory with forecast',
  icon: 'monitoring',
  category: 'person',
  defaultLayout: { w: 6, h: 'md' },
  Component: OrganTrajectoryWidget,
  Settings: OrganTrajectorySettings,
  defaults: organTrajectoryDefaults,
  validate: validateOrganTrajectoryConfig,
  presets: [
    { title: 'Organ Trajectory', description: 'SOFA-style organ subscore trajectory with forecast', layout: { w: 6, h: 'md' } },
  ],
};

export default organTrajectory;
