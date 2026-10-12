import type { WidgetDefinition } from '../types';
import { CohortWidgetConfig, requirePerson } from './settings';
import CohortTimelineWidget from './index';
import CohortTimelineSettings from './settings';

const cohortTimeline: WidgetDefinition<CohortWidgetConfig> = {
  type: 'cohort_timeline',
  label: 'Subject Events Timeline',
  description: 'Chronological clinical events for a subject over a date range',
  icon: 'timeline',
  category: 'person',
  defaultLayout: { w: 12, h: 'auto' },
  Component: CohortTimelineWidget,
  Settings: CohortTimelineSettings,
  validate: (c) => {
    const errors = [...requirePerson(c)];
    if (!c.startDate || !c.endDate) errors.push('Start and end dates are required.');
    return errors;
  },
};

export default cohortTimeline;
