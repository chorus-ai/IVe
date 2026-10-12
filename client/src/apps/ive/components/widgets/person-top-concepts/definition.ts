import type { WidgetDefinition } from '../types';
import { requirePerson } from './settings';
import PersonTopConceptsWidget, { PersonTopConceptsConfig } from './index';
import PersonTopConceptsSettings from './settings';

// Explicit request template carried by every preset; {{table}} and
// {{personId}} are injected from the live fields at fetch time.
const TABLE_REQUEST = {
  endpoint: '/api/omop/{{table}}/search?page=1&pageSize=0',
  method: 'POST' as const,
  body: '{ "person_id": {{personId}} }',
};

const personTopConcepts: WidgetDefinition<PersonTopConceptsConfig> = {
  type: 'person_top_concepts',
  label: 'Top Concepts',
  description: 'Most frequent concepts in an OMOP table for a subject',
  icon: 'leaderboard',
  category: 'person',
  defaultLayout: { w: 4, h: 'auto' },
  Component: PersonTopConceptsWidget,
  Settings: PersonTopConceptsSettings,
  defaults: { table: 'condition_occurrence', conceptCol: 'condition_concept_id', color: '#f97316', limit: 8 },
  validate: (c) => {
    const errors = [...requirePerson(c)];
    if (!c.table) errors.push('OMOP table is required.');
    if (!c.conceptCol) errors.push('Concept column is required.');
    return errors;
  },
  presets: [
    {
      title: 'Conditions',
      description: 'Most frequent condition concepts for a subject',
      config: { request: TABLE_REQUEST, table: 'condition_occurrence', conceptCol: 'condition_concept_id', color: '#f97316' },
    },
    {
      title: 'Drugs',
      description: 'Most frequent drug concepts for a subject',
      config: { request: TABLE_REQUEST, table: 'drug_exposure', conceptCol: 'drug_concept_id', color: '#3b82f6' },
    },
    {
      title: 'Procedures',
      description: 'Most frequent procedure concepts for a subject',
      config: { request: TABLE_REQUEST, table: 'procedure_occurrence', conceptCol: 'procedure_concept_id', color: '#8b5cf6' },
    },
  ],
};

export default personTopConcepts;
