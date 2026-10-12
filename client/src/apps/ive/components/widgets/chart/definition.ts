import React from 'react';
import type { WidgetComponentProps, WidgetDefinition } from '../types';
import GenericChartWidget, { ChartType } from './index';
import GenericChartSettings, { GenericChartConfig, genericChartDefaults, validateGenericChartConfig } from './settings';

/** One renderer, three registered types — each fixes its chartType. */
const makeComponent = (chartType: ChartType): React.FC<WidgetComponentProps<GenericChartConfig>> =>
  (props) => React.createElement(GenericChartWidget, { ...props, chartType });

export const barChart: WidgetDefinition<GenericChartConfig> = {
  type: 'bar_chart',
  label: 'Bar Chart',
  description: 'Compare discrete values',
  icon: 'bar_chart',
  category: 'chart',
  defaultLayout: { w: 6, h: 'sm' },
  Component: makeComponent('bar_chart'),
  Settings: GenericChartSettings,
  defaults: genericChartDefaults,
  validate: validateGenericChartConfig,
  presets: [
    { title: 'Medication Prevalence', description: 'Top 10 prescribed medications', layout: { w: 6, h: 'sm' } },
  ],
};

export const lineChart: WidgetDefinition<GenericChartConfig> = {
  type: 'line_chart',
  label: 'Line Chart',
  description: 'Visualize trends over time',
  icon: 'show_chart',
  category: 'chart',
  defaultLayout: { w: 6, h: 'sm' },
  Component: makeComponent('line_chart'),
  Settings: GenericChartSettings,
  defaults: genericChartDefaults,
  validate: validateGenericChartConfig,
};

export const pieChart: WidgetDefinition<GenericChartConfig> = {
  type: 'pie_chart',
  label: 'Pie Chart',
  description: 'Distribution analysis',
  icon: 'pie_chart',
  category: 'chart',
  defaultLayout: { w: 4, h: 'sm' },
  Component: makeComponent('pie_chart'),
  Settings: GenericChartSettings,
  defaults: { ...genericChartDefaults, xField: 'label', yField: 'value' },
  validate: validateGenericChartConfig,
};
