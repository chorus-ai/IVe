import type { WidgetDefinition } from '../types';
import GenericTableWidget from './index';
import GenericTableSettings, { GenericTableConfig, genericTableDefaults, validateGenericTableConfig } from './settings';

const table: WidgetDefinition<GenericTableConfig> = {
  type: 'table',
  label: 'Data Table',
  description: 'Comprehensive table of latest lab results',
  icon: 'table_rows',
  category: 'generic',
  defaultLayout: { w: 12, h: 'md' },
  Component: GenericTableWidget,
  Settings: GenericTableSettings,
  defaults: genericTableDefaults,
  validate: validateGenericTableConfig,
  presets: [
    { title: 'Recent Lab Reports', description: 'Comprehensive table of latest lab results', layout: { w: 12, h: 'md' } },
  ],
};

export default table;
