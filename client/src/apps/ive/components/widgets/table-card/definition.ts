import type { WidgetDefinition } from '../types';
import OmopTableCardWidget from './index';
import OmopTableCardSettings, { TableCardConfig, tableCardDefaults, validateTableCardConfig } from './settings';

const tableCard: WidgetDefinition<TableCardConfig> = {
  type: 'table_card',
  label: 'Table Card',
  description: 'Preview of an OMOP table scoped to a person or visit',
  icon: 'table_view',
  category: 'person',
  defaultLayout: { w: 6, h: 'md' },
  Component: OmopTableCardWidget,
  Settings: OmopTableCardSettings,
  defaults: tableCardDefaults,
  validate: validateTableCardConfig,
  presets: [
    { title: 'Table Card', description: 'Preview of an OMOP table scoped to a person or visit', layout: { w: 6, h: 'md' } },
  ],
};

export default tableCard;
