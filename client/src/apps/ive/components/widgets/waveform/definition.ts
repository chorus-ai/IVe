import type { WidgetDefinition } from '../types';
import WaveformWidget, { WaveformConfig } from './index';
import WaveformSettings from './settings';

const waveform: WidgetDefinition<WaveformConfig> = {
  type: 'waveform',
  label: 'Waveform',
  description: 'WFDB waveform viewer: synced bedside-monitor channels with pan and zoom',
  icon: 'ecg_heart',
  category: 'person',
  defaultLayout: { w: 12, h: 'auto' },
  Component: WaveformWidget,
  Settings: WaveformSettings,
  defaults: { showControls: false },
};

export default waveform;
