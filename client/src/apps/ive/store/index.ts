import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import type { WidgetConfig, DashboardLayout } from '../components/widgets/types';
import type { SavedEndpoint } from '../api/endpoints';

/* ─────────────────────────── Types ─────────────────────────── */

export interface Alert {
  message: string;
  severity: 'success' | 'info' | 'warning' | 'error';
}

export interface TableState {
  header: string[];
  rows: unknown[][];
  count: number; // -1 => unknown total
  filters: Record<string, unknown>;
  page: number;
  pageSize: number;
  loading: boolean;
  error: string | null;
}

export const makeTable = (): TableState => ({
  header: [],
  rows: [],
  count: -1,
  filters: {},
  page: 1,
  pageSize: 20,
  loading: false,
  error: null,
});

export interface ConceptRecord {
  concept_id: number | string;
  concept_name?: string;
  domain_id?: string;
  vocabulary_id?: string;
  concept_class_id?: string;
  concept_code?: string;
  [key: string]: unknown;
}

export interface ConceptsState {
  byId: Record<string, ConceptRecord>;
  loading: Record<string, boolean>;
  errors: Record<string, string>;
}

export interface IveState {
  // Layouts
  currentWidgets: WidgetConfig[];
  savedLayouts: DashboardLayout[];
  activeLayoutId: string;
  // Endpoints
  endpoint: SavedEndpoint[];
  // OMOP
  tables: Record<string, TableState>;
  tableCounts: Record<string, number | null>;
  // Vocab concepts cache
  concepts: ConceptsState;
  // UI
  alert: Alert | null;
}

/* ─────────────────────────── Defaults ─────────────────────────── */

// Executable request templates carried by the single-query widgets below.
// Live fields ({{personId}}, {{conceptIds}}, {{table}}) are injected at
// fetch time, so each saved config is self-describing and runnable —
// including as an example for AI layout assembly.
const TABLE_SEARCH_REQUEST = {
  endpoint: '/api/omop/{{table}}/search?page=1&pageSize=0',
  method: 'POST' as const,
  body: '{ "person_id": {{personId}} }',
};
const MEASUREMENT_SEARCH_REQUEST = {
  endpoint: '/api/omop/measurement/search?page=1&pageSize=0',
  method: 'POST' as const,
  body: '{ "person_id": {{personId}} }',
};
const MEASUREMENT_TREND_REQUEST = {
  endpoint: '/api/omop/measurement/search?page=1&pageSize=0',
  method: 'POST' as const,
  body: '{ "person_id": {{personId}}, "measurement_concept_id": {{conceptIds}} }',
};

// Reproduces the cohort-detail view (CohortSubjectView) as a workspace layout.
// Every widget is person-scoped; multi-query widgets (demographics, stats,
// timeline) fetch internally, single-query widgets carry their request.
const COHORT_DETAIL_PERSON_ID = 4009;
const COHORT_DETAIL_START = '2020-03-14';
const COHORT_DETAIL_END = '2020-04-13';

const SUBJECT_EVENT_TIMELINE_WIDGETS: WidgetConfig[] = [
  {
    id: 'ge-demographics', type: 'person_demographics', title: 'Demographics', w: 12, h: 'auto',
    config: { personId: COHORT_DETAIL_PERSON_ID },
  },
  {
    id: 'ge-timeline', type: 'cohort_timeline', title: 'Subject Events Timeline', w: 12, h: 'auto',
    config: { personId: COHORT_DETAIL_PERSON_ID, startDate: COHORT_DETAIL_START, endDate: COHORT_DETAIL_END },
  },
  {
    id: 'ge-conditions', type: 'person_top_concepts', title: 'Conditions', w: 4, h: 'auto',
    config: {
      request: TABLE_SEARCH_REQUEST, personId: COHORT_DETAIL_PERSON_ID,
      table: 'condition_occurrence', conceptCol: 'condition_concept_id', color: '#f97316', limit: 8,
    },
  },
  {
    id: 'ge-drugs', type: 'person_top_concepts', title: 'Drugs', w: 4, h: 'auto',
    config: {
      request: TABLE_SEARCH_REQUEST, personId: COHORT_DETAIL_PERSON_ID,
      table: 'drug_exposure', conceptCol: 'drug_concept_id', color: '#3b82f6', limit: 8,
    },
  },
  {
    id: 'ge-procedures', type: 'person_top_concepts', title: 'Procedures', w: 4, h: 'auto',
    config: {
      request: TABLE_SEARCH_REQUEST, personId: COHORT_DETAIL_PERSON_ID,
      table: 'procedure_occurrence', conceptCol: 'procedure_concept_id', color: '#8b5cf6', limit: 8,
    },
  },
  {
    id: 'ge-measurements', type: 'person_measurements', title: 'Recent Measurements', w: 12, h: 'auto',
    config: { request: MEASUREMENT_SEARCH_REQUEST, personId: COHORT_DETAIL_PERSON_ID, limit: 10 },
  },
  {
    id: 'ge-waveform', type: 'waveform', title: 'Waveform', w: 12, h: 'auto',
    config: {},
  },
];

// Sepsis-focused subject review. Trend concept ids match the dev OMOP data
// (MIMIC-derived); person 2870077 is the sample subject with the richest
// measurement record. Drug/condition widgets are included for completeness
// but the dev drug_exposure / condition_occurrence tables are empty.
const SEPSIS_PERSON_ID = 2870077;
const SEPSIS_START = '2021-10-15';
const SEPSIS_END = '2021-11-14';

const SUBJECT_SEPSIS_WIDGETS: WidgetConfig[] = [
  {
    id: 'sep-demographics', type: 'person_demographics', title: 'Demographics', w: 12, h: 'auto',
    config: { personId: SEPSIS_PERSON_ID },
  },
  {
    id: 'sep-timeline', type: 'cohort_timeline', title: 'Sepsis Episode Timeline', w: 12, h: 'auto',
    config: { personId: SEPSIS_PERSON_ID, startDate: SEPSIS_START, endDate: SEPSIS_END },
  },
  {
    id: 'sep-lactate', type: 'measurement_trend', title: 'Lactate', w: 4, h: 'auto',
    config: { request: MEASUREMENT_TREND_REQUEST, personId: SEPSIS_PERSON_ID, conceptIds: '3018405, 3047181', color: '#dc2626', limit: 100 },
  },
  {
    id: 'sep-wbc', type: 'measurement_trend', title: 'White Blood Count', w: 4, h: 'auto',
    config: { request: MEASUREMENT_TREND_REQUEST, personId: SEPSIS_PERSON_ID, conceptIds: '3000905', color: '#7c3aed', limit: 100 },
  },
  {
    id: 'sep-temp', type: 'measurement_trend', title: 'Temperature', w: 4, h: 'auto',
    config: { request: MEASUREMENT_TREND_REQUEST, personId: SEPSIS_PERSON_ID, conceptIds: '3020891', color: '#b45309', limit: 100 },
  },
  {
    id: 'sep-map', type: 'measurement_trend', title: 'MAP (Arterial)', w: 4, h: 'auto',
    config: { request: MEASUREMENT_TREND_REQUEST, personId: SEPSIS_PERSON_ID, conceptIds: '21490852', color: '#136dec', limit: 100 },
  },
  {
    id: 'sep-creatinine', type: 'measurement_trend', title: 'Creatinine', w: 4, h: 'auto',
    config: { request: MEASUREMENT_TREND_REQUEST, personId: SEPSIS_PERSON_ID, conceptIds: '3016723', color: '#0369a1', limit: 100 },
  },
  {
    id: 'sep-platelets', type: 'measurement_trend', title: 'Platelet Count', w: 4, h: 'auto',
    config: { request: MEASUREMENT_TREND_REQUEST, personId: SEPSIS_PERSON_ID, conceptIds: '3024929', color: '#be185d', limit: 100 },
  },
  {
    id: 'sep-drugs', type: 'person_top_concepts', title: 'Antimicrobials & Vasopressors', w: 6, h: 'auto',
    config: {
      request: TABLE_SEARCH_REQUEST, personId: SEPSIS_PERSON_ID,
      table: 'drug_exposure', conceptCol: 'drug_concept_id', color: '#3b82f6', limit: 8,
    },
  },
  {
    id: 'sep-infections', type: 'person_top_concepts', title: 'Infection Diagnoses', w: 6, h: 'auto',
    config: {
      request: TABLE_SEARCH_REQUEST, personId: SEPSIS_PERSON_ID,
      table: 'condition_occurrence', conceptCol: 'condition_concept_id', color: '#f97316', limit: 8,
    },
  },
  {
    id: 'sep-labs', type: 'person_measurements', title: 'Recent Labs & Vitals', w: 12, h: 'auto',
    config: { request: MEASUREMENT_SEARCH_REQUEST, personId: SEPSIS_PERSON_ID, limit: 12 },
  },
];

// SuperAlarm-style ICU alarm review (doc/cadaPlus/icu_event_timeline.jpg):
// subject event timeline + vital trends on top, then alarm strips (real
// waveform viewer) and the imaging series side by side. The vitals panel is
// a mock widget until its endpoint exists; the timeline queries OMOP and the
// waveform panel streams the bundled WFDB sample.
// Anchored on the sepsis sample subject: person 4009 has no rows in the
// current dev OMOP DB, so the timeline would render empty there.
const ICU_ALARM_WIDGETS: WidgetConfig[] = [
  {
    id: 'icu-timeline', type: 'cohort_timeline', title: 'Subject Events Timeline', w: 12, h: 'auto',
    config: { personId: SEPSIS_PERSON_ID, startDate: SEPSIS_START, endDate: SEPSIS_END },
  },
  {
    id: 'icu-vitals', type: 'vitals_monitor', title: 'Vital Sign Trends', w: 12, h: 'auto',
    config: { personId: SEPSIS_PERSON_ID, startDate: SEPSIS_START },
  },
  {
    id: 'icu-strips', type: 'waveform', title: 'Alarm Strips', w: 8, h: 'lg',
    config: { showControls: false },
  },
  {
    id: 'icu-images', type: 'image_series', title: 'Images', w: 4, h: 'lg',
    config: { personId: SEPSIS_PERSON_ID },
  },
];

const PATIENT_VIEW_WIDGETS: WidgetConfig[] = [
  { id: 'p-header', type: 'patient_profile', title: 'Person #18462 (Historical Record)', w: 12, h: 'auto' },
  { id: 'p-note', type: 'clinical_note', title: 'Clinical Progress Note (Latest Encounter)', w: 8, h: 'auto' },
  { id: 'p-stats', type: 'stats', title: 'Past Vital Trends', w: 4, h: 'auto' },
  { id: 'p-cond', type: 'domain_table', title: 'Documented Diagnoses', w: 6, h: 'auto', config: { domain: 'conditions' } },
  { id: 'p-labs', type: 'domain_table', title: 'Historical Lab Results', w: 6, h: 'auto', config: { domain: 'measurements' } },
  { id: 'p-meds', type: 'domain_table', title: 'Historical Medication Log', w: 12, h: 'auto', config: { domain: 'medications' } },
];

const SUBJECT_EVENT_TIMELINE_LAYOUT: DashboardLayout = {
  id: 'l-subject-event-timeline',
  name: 'Subject Event Timeline',
  tags: ['Cohort', 'Timeline', 'Default'],
  date: '2026-06-17',
  widgets: SUBJECT_EVENT_TIMELINE_WIDGETS,
};

const ICU_ALARM_LAYOUT: DashboardLayout = {
  id: 'l-icu-alarm-review',
  name: 'ICU Alarm Review (SuperAlarm)',
  tags: ['ICU', 'Alarms', 'Monitor'],
  date: '2026-07-11',
  widgets: ICU_ALARM_WIDGETS,
};

const SUBJECT_SEPSIS_LAYOUT: DashboardLayout = {
  id: 'l-subject-sepsis',
  name: 'Subject Sepsis Review',
  tags: ['Cohort', 'Sepsis', 'ICU'],
  date: '2026-07-07',
  widgets: SUBJECT_SEPSIS_WIDGETS,
};

export const DEFAULT_LAYOUTS: DashboardLayout[] = [
  {
    id: 'l-blank',
    name: 'Blank Clinical Canvas',
    tags: ['New', 'Custom', 'Empty'],
    date: '2024-05-21',
    widgets: [],
  },
  SUBJECT_EVENT_TIMELINE_LAYOUT,
  SUBJECT_SEPSIS_LAYOUT,
  ICU_ALARM_LAYOUT,
  {
    id: 'l-patient-1',
    name: 'Patient Retrospective Review',
    tags: ['Clinical', 'Historical', 'Archive'],
    date: '2024-05-20',
    widgets: PATIENT_VIEW_WIDGETS,
  },
  {
    id: 'l-visit-1',
    name: 'Visit Occurrence Review',
    tags: ['Visit', 'Encounter', 'Detail'],
    date: '2024-05-18',
    widgets: [
      { id: 'v-header', type: 'patient_profile', title: 'Person #18462 - Visit: 2024-05-18 (Outpatient)', w: 12, h: 'auto' },
      { id: 'v-note', type: 'clinical_note', title: 'Visit Progress Note', w: 6, h: 'auto' },
      { id: 'v-cond', type: 'domain_table', title: 'Visit Diagnoses', w: 6, h: 'auto', config: { domain: 'conditions' } },
      { id: 'v-meds', type: 'domain_table', title: 'Medications Administered/Prescribed', w: 6, h: 'auto', config: { domain: 'medications' } },
      { id: 'v-procs', type: 'domain_table', title: 'Procedures Performed', w: 6, h: 'auto', config: { domain: 'procedures' } },
      { id: 'v-labs', type: 'domain_table', title: 'Labs & Measurements', w: 12, h: 'auto', config: { domain: 'measurements' } },
    ],
  },
  {
    id: 'l1',
    name: 'Cohort Archive Dashboard',
    tags: ['Population', 'Historical'],
    date: '2023-10-12',
    widgets: [
      { id: 'w1', type: 'condition', title: 'Historical Condition Occurrence', w: 8, h: 'auto' },
      { id: 'w2', type: 'demographics', title: 'Cohort Demographics (Static)', w: 4, h: 'auto' },
      { id: 'w3', type: 'timeline', title: 'Retrospective Timeline Summary', w: 4, h: 'auto' },
      { id: 'w4', type: 'stats', title: 'Historical Indicators', w: 4, h: 'auto' },
    ],
  },
  {
    id: 'l-icu-forecast',
    name: 'ICU Deterioration Forecast (2–6h)',
    tags: ['ICU', 'Forecast', 'Risk', 'AI'],
    date: '2026-05-08',
    widgets: [
      { id: 'icu-header', type: 'patient_profile', title: 'Patient — ICU Bedside View', w: 12, h: 'auto' },
      { id: 'icu-organ-traj', type: 'organ_trajectory', title: 'Projected Organ Failure Trajectories (next 2–6h)', w: 8, h: 'md' },
      { id: 'icu-risk-radar', type: 'radar_chart', title: 'Risk Profile — Death & Major Events', w: 4, h: 'md' },
      { id: 'icu-key-labs', type: 'stats', title: 'Key Labs — Hb · Lactate · PO₂', w: 6, h: 'auto' },
      { id: 'icu-vitals', type: 'timeline', title: 'Recent Vitals & Trends', w: 6, h: 'auto' },
      { id: 'icu-interventions', type: 'intervention_suggestions', title: 'Suggested Interventions (next 2–6h)', w: 12, h: 'lg' },
    ],
  },
  {
    id: 'l2',
    name: 'Medication Adherence History',
    tags: ['Pharmacy', 'Research'],
    date: '2023-10-10',
    widgets: [
      { id: 'w-med-header', type: 'patient_profile', title: 'Patient — Pharmacy Review', w: 12, h: 'auto' },
      { id: 'w-med-trend', type: 'adherence_trend', title: 'Adherence Trend (12-Month PDC)', w: 8, h: 'md' },
      { id: 'w-med-stats', type: 'stats', title: 'Adherence Summary · MPR / PDC / Gaps', w: 4, h: 'md' },
      { id: 'w-med-list', type: 'medication_adherence', title: 'Per-Medication Adherence', w: 8, h: 'lg' },
      { id: 'w-med-conditions', type: 'domain_table', title: 'Active Conditions Driving Therapy', w: 4, h: 'lg', config: { domain: 'conditions' } },
      { id: 'w-med-history', type: 'domain_table', title: 'Dispense / Refill History', w: 12, h: 'md', config: { domain: 'medications' } },
    ],
  },
];

const initialState: IveState = {
  currentWidgets: SUBJECT_EVENT_TIMELINE_LAYOUT.widgets,
  savedLayouts: DEFAULT_LAYOUTS,
  activeLayoutId: SUBJECT_EVENT_TIMELINE_LAYOUT.id,
  endpoint: [],
  tables: {},
  tableCounts: {},
  concepts: { byId: {}, loading: {}, errors: {} },
  alert: null,
};

/* ─────────────────────────── Slice ─────────────────────────── */

const iveSlice = createSlice({
  name: 'ive',
  initialState,
  reducers: {
    /* ---- Layouts ---- */
    setCurrentWidgets(state, action: PayloadAction<WidgetConfig[]>) {
      state.currentWidgets = action.payload;
    },
    setActiveLayout(state, action: PayloadAction<DashboardLayout>) {
      state.activeLayoutId = action.payload.id;
      state.currentWidgets = [...action.payload.widgets];
    },
    setLayouts(state, action: PayloadAction<DashboardLayout[]>) {
      state.savedLayouts = action.payload;
    },
    addSavedLayout(state, action: PayloadAction<DashboardLayout>) {
      state.savedLayouts = [action.payload, ...state.savedLayouts];
      state.activeLayoutId = action.payload.id;
      state.currentWidgets = [...action.payload.widgets];
    },
    updateSavedLayout(state, action: PayloadAction<DashboardLayout>) {
      const idx = state.savedLayouts.findIndex((l) => l.id === action.payload.id);
      if (idx !== -1) state.savedLayouts[idx] = action.payload;
      if (state.activeLayoutId === action.payload.id) {
        state.currentWidgets = [...action.payload.widgets];
      }
    },
    removeSavedLayout(state, action: PayloadAction<string>) {
      state.savedLayouts = state.savedLayouts.filter((l) => l.id !== action.payload);
      if (state.activeLayoutId === action.payload) {
        state.activeLayoutId = state.savedLayouts[0]?.id ?? '';
        state.currentWidgets = state.savedLayouts[0]?.widgets ?? [];
      }
    },

    /* ---- Endpoints ---- */
    setEndpoints(state, action: PayloadAction<SavedEndpoint[]>) {
      state.endpoint = action.payload;
    },
    addEndpoint(state, action: PayloadAction<SavedEndpoint>) {
      state.endpoint.push(action.payload);
    },
    removeEndpoint(state, action: PayloadAction<number>) {
      state.endpoint = state.endpoint.filter((_, i) => i !== action.payload);
    },

    /* ---- OMOP tables ---- */
    setTableLoading(state, action: PayloadAction<{ table: string }>) {
      const { table } = action.payload;
      if (!state.tables[table]) state.tables[table] = makeTable();
      state.tables[table].loading = true;
      state.tables[table].error = null;
    },
    setTableData(
      state,
      action: PayloadAction<{
        table: string;
        header: string[];
        rows: unknown[][];
        count?: number;
        page: number;
        pageSize: number;
        filters: Record<string, unknown>;
      }>,
    ) {
      const { table, header, rows, count, page, pageSize, filters } = action.payload;
      if (!state.tables[table]) state.tables[table] = makeTable();
      state.tables[table].header = header;
      state.tables[table].rows = rows;
      // Only overwrite count when an explicit, valid count is provided.
      // Page changes shouldn't clobber the cached total — that disables the
      // next-page button until the count effect refetches.
      if (typeof count === 'number' && count >= 0) {
        state.tables[table].count = count;
      }
      state.tables[table].page = page;
      state.tables[table].pageSize = pageSize;
      state.tables[table].filters = filters;
      state.tables[table].loading = false;
      state.tables[table].error = null;
    },
    setTableError(state, action: PayloadAction<{ table: string; error: string }>) {
      const { table, error } = action.payload;
      if (!state.tables[table]) state.tables[table] = makeTable();
      state.tables[table].loading = false;
      state.tables[table].error = error;
    },
    setTableCount(state, action: PayloadAction<{ table: string; count: number }>) {
      const { table, count } = action.payload;
      if (state.tables[table]) {
        state.tables[table].count = count;
      }
    },
    setTableFilters(
      state,
      action: PayloadAction<{ table: string; filters: Record<string, unknown> }>,
    ) {
      const { table, filters } = action.payload;
      if (!state.tables[table]) state.tables[table] = makeTable();
      state.tables[table].filters = filters;
      state.tables[table].page = 1;
    },
    setTablePage(state, action: PayloadAction<{ table: string; page: number }>) {
      const { table, page } = action.payload;
      if (!state.tables[table]) state.tables[table] = makeTable();
      state.tables[table].page = page;
    },
    setTablePageSize(state, action: PayloadAction<{ table: string; pageSize: number }>) {
      const { table, pageSize } = action.payload;
      if (!state.tables[table]) state.tables[table] = makeTable();
      state.tables[table].pageSize = pageSize;
      state.tables[table].page = 1;
    },
    setTableCounts(state, action: PayloadAction<Record<string, number | null>>) {
      state.tableCounts = { ...state.tableCounts, ...action.payload };
    },

    /* ---- Vocab concepts ---- */
    conceptLoading(state, action: PayloadAction<string>) {
      state.concepts.loading[action.payload] = true;
      delete state.concepts.errors[action.payload];
    },
    conceptLoaded(state, action: PayloadAction<ConceptRecord>) {
      const key = String(action.payload.concept_id);
      state.concepts.byId[key] = action.payload;
      delete state.concepts.loading[key];
      delete state.concepts.errors[key];
    },
    conceptError(state, action: PayloadAction<{ id: string; error: string }>) {
      delete state.concepts.loading[action.payload.id];
      state.concepts.errors[action.payload.id] = action.payload.error;
    },

    /* ---- Alert ---- */
    showIveAlert(state, action: PayloadAction<Alert>) {
      state.alert = action.payload;
    },
    clearIveAlert(state) {
      state.alert = null;
    },
  },
});

export const {
  // Layouts
  setCurrentWidgets,
  setActiveLayout,
  setLayouts,
  addSavedLayout,
  updateSavedLayout,
  removeSavedLayout,
  // Endpoints
  setEndpoints,
  addEndpoint,
  removeEndpoint,
  // OMOP
  setTableLoading,
  setTableData,
  setTableError,
  setTableCount,
  setTableFilters,
  setTablePage,
  setTablePageSize,
  setTableCounts,
  // Vocab concepts
  conceptLoading,
  conceptLoaded,
  conceptError,
  // Alert
  showIveAlert,
  clearIveAlert,
} = iveSlice.actions;

export const iveReducer = iveSlice.reducer;
export default iveReducer;
