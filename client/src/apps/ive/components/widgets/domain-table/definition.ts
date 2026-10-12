import type { WidgetDefinition } from '../types';
import OmopDomainTableWidget from './index';
import OmopDomainTableSettings, { DomainTableConfig, domainTableDefaults, validateDomainTableConfig } from './settings';

const domainTable: WidgetDefinition<DomainTableConfig> = {
  type: 'domain_table',
  label: 'Domain Table',
  description: 'OMOP domain records (measurements, drugs, procedures, conditions) for a person',
  icon: 'table_rows',
  category: 'person',
  defaultLayout: { w: 8, h: 'md' },
  Component: OmopDomainTableWidget,
  Settings: OmopDomainTableSettings,
  defaults: domainTableDefaults,
  validate: validateDomainTableConfig,
  presets: [
    { title: 'Domain Table', description: 'OMOP domain records for a person', layout: { w: 8, h: 'md' } },
  ],
};

export default domainTable;
