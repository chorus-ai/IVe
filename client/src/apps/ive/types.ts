export type SqlDate = string;

export type OmopTables = {
  person: {
    person_id: number;
    gender_concept_id: number;
    year_of_birth: number;
    month_of_birth: number | null;
    day_of_birth: number | null;
    birth_datetime: SqlDate | null;
    race_concept_id: number;
    ethnicity_concept_id: number;
    location_id: number | null;
    provider_id: number | null;
    care_site_id: number | null;
    person_source_value: string | null;
    gender_source_value: string | null;
    gender_source_concept_id: number | null;
    race_source_value: string | null;
    race_source_concept_id: number | null;
    ethnicity_source_value: string | null;
    ethnicity_source_concept_id: number | null;
  };

  observation_period: {
    observation_period_id: number;
    person_id: number;
    observation_period_start_date: SqlDate;
    observation_period_end_date: SqlDate;
    period_type_concept_id: number;
  };

  visit_occurrence: {
    visit_occurrence_id: number;
    person_id: number;
    visit_concept_id: number;
    visit_start_date: SqlDate;
    visit_start_datetime: SqlDate | null;
    visit_end_date: SqlDate;
    visit_end_datetime: SqlDate | null;
    visit_type_concept_id: number;
    provider_id: number | null;
    care_site_id: number | null;
    visit_source_value: string | null;
    visit_source_concept_id: number | null;
    admitted_from_concept_id: number | null;
    admitted_from_source_value: string | null;
    discharged_to_concept_id: number | null;
    discharged_to_source_value: string | null;
    preceding_visit_occurrence_id: number | null;
  };

  visit_detail: {
    visit_detail_id: number;
    person_id: number;
    visit_detail_concept_id: number;
    visit_detail_start_date: SqlDate;
    visit_detail_start_datetime: SqlDate | null;
    visit_detail_end_date: SqlDate;
    visit_detail_end_datetime: SqlDate | null;
    visit_detail_type_concept_id: number;
    provider_id: number | null;
    care_site_id: number | null;
    visit_detail_source_value: string | null;
    visit_detail_source_concept_id: number | null;
    admitted_from_concept_id: number | null;
    admitted_from_source_value: string | null;
    discharged_to_source_value: string | null;
    discharged_to_concept_id: number | null;
    preceding_visit_detail_id: number | null;
    parent_visit_detail_id: number | null;
    visit_occurrence_id: number;
  };

  condition_occurrence: {
    condition_occurrence_id: number;
    person_id: number;
    condition_concept_id: number;
    condition_start_date: SqlDate;
    condition_start_datetime: SqlDate | null;
    condition_end_date: SqlDate | null;
    condition_end_datetime: SqlDate | null;
    condition_type_concept_id: number;
    condition_status_concept_id: number | null;
    stop_reason: string | null;
    provider_id: number | null;
    visit_occurrence_id: number | null;
    visit_detail_id: number | null;
    condition_source_value: string | null;
    condition_source_concept_id: number | null;
    condition_status_source_value: string | null;
  };

  drug_exposure: {
    drug_exposure_id: number;
    person_id: number;
    drug_concept_id: number;
    drug_exposure_start_date: SqlDate;
    drug_exposure_start_datetime: SqlDate | null;
    drug_exposure_end_date: SqlDate;
    drug_exposure_end_datetime: SqlDate | null;
    verbatim_end_date: SqlDate | null;
    drug_type_concept_id: number;
    stop_reason: string | null;
    refills: number | null;
    quantity: number | null;
    days_supply: number | null;
    sig: string | null;
    route_concept_id: number | null;
    lot_number: string | null;
    provider_id: number | null;
    visit_occurrence_id: number | null;
    visit_detail_id: number | null;
    drug_source_value: string | null;
    drug_source_concept_id: number | null;
    route_source_value: string | null;
    dose_unit_source_value: string | null;
  };

  procedure_occurrence: {
    procedure_occurrence_id: number;
    person_id: number;
    procedure_concept_id: number;
    procedure_date: SqlDate;
    procedure_datetime: SqlDate | null;
    procedure_end_date: SqlDate | null;
    procedure_end_datetime: SqlDate | null;
    procedure_type_concept_id: number;
    modifier_concept_id: number | null;
    quantity: number | null;
    provider_id: number | null;
    visit_occurrence_id: number | null;
    visit_detail_id: number | null;
    procedure_source_value: string | null;
    procedure_source_concept_id: number | null;
    modifier_source_value: string | null;
  };

  device_exposure: {
    device_exposure_id: number;
    person_id: number;
    device_concept_id: number;
    device_exposure_start_date: SqlDate;
    device_exposure_start_datetime: SqlDate | null;
    device_exposure_end_date: SqlDate | null;
    device_exposure_end_datetime: SqlDate | null;
    device_type_concept_id: number;
    unique_device_id: string | null;
    production_id: string | null;
    quantity: number | null;
    provider_id: number | null;
    visit_occurrence_id: number | null;
    visit_detail_id: number | null;
    device_source_value: string | null;
    device_source_concept_id: number | null;
    unit_concept_id: number | null;
    unit_source_value: string | null;
    unit_source_concept_id: number | null;
  };

  measurement: {
    measurement_id: number;
    person_id: number;
    measurement_concept_id: number;
    measurement_date: SqlDate;
    measurement_datetime: SqlDate | null;
    measurement_time: string | null;
    measurement_type_concept_id: number;
    operator_concept_id: number | null;
    value_as_number: number | null;
    value_as_concept_id: number | null;
    unit_concept_id: number | null;
    range_low: number | null;
    range_high: number | null;
    provider_id: number | null;
    visit_occurrence_id: number | null;
    visit_detail_id: number | null;
    measurement_source_value: string | null;
    measurement_source_concept_id: number | null;
    unit_source_value: string | null;
    unit_source_concept_id: number | null;
    value_source_value: string | null;
    measurement_event_id: number | null;
    meas_event_field_concept_id: number | null;
  };

  observation: {
    observation_id: number;
    person_id: number;
    observation_concept_id: number;
    observation_date: SqlDate;
    observation_datetime: SqlDate | null;
    observation_type_concept_id: number;
    value_as_number: number | null;
    value_as_string: string | null;
    value_as_concept_id: number | null;
    qualifier_concept_id: number | null;
    unit_concept_id: number | null;
    provider_id: number | null;
    visit_occurrence_id: number | null;
    visit_detail_id: number | null;
    observation_source_value: string | null;
    observation_source_concept_id: number | null;
    unit_source_value: string | null;
    qualifier_source_value: string | null;
    value_source_value: string | null;
    observation_event_id: number | null;
    obs_event_field_concept_id: number | null;
  };

  death: {
    person_id: number;
    death_date: SqlDate;
    death_datetime: SqlDate | null;
    death_type_concept_id: number | null;
    cause_concept_id: number | null;
    cause_source_value: string | null;
    cause_source_concept_id: number | null;
  };

  note: {
    note_id: number;
    person_id: number;
    note_date: SqlDate;
    note_datetime: SqlDate | null;
    note_type_concept_id: number;
    note_class_concept_id: number;
    note_title: string | null;
    note_text: string;
    encoding_concept_id: number;
    language_concept_id: number;
    provider_id: number | null;
    visit_occurrence_id: number | null;
    visit_detail_id: number | null;
    note_source_value: string | null;
    note_event_id: number | null;
    note_event_field_concept_id: number | null;
  };

  note_nlp: {
    note_nlp_id: number;
    note_id: number;
    section_concept_id: number | null;
    snippet: string | null;
    offset: string | null;
    lexical_variant: string;
    note_nlp_concept_id: number | null;
    note_nlp_source_concept_id: number | null;
    nlp_system: string | null;
    nlp_date: SqlDate;
    nlp_datetime: SqlDate | null;
    term_exists: string | null;
    term_temporal: string | null;
    term_modifiers: string | null;
  };

  waveform: {
    waveform_id: number;
    person_id: number;
    waveform_date: SqlDate;
    waveform_datetime: SqlDate | null;
    waveform_concept_id: number;
    [key: string]: any;
  };

  dicom: {
    dicom_id: number;
    person_id: number;
    dicom_date: SqlDate;
    dicom_datetime: SqlDate | null;
    dicom_concept_id: number;
    [key: string]: any;
  };
};

export interface Concept {
  concept_id: number;
  table_name: string;
  column_name?: string;
  concept_name: string;
  count: number;
  vocabulary_id?: string;
  concept_class_id?: string;
  concept_code?: string;
}

/** Runtime column lists per OMOP table */
const TABLE_COLUMNS: Record<keyof OmopTables, string[]> = {
  person: ['person_id','gender_concept_id','year_of_birth','month_of_birth','day_of_birth','birth_datetime','race_concept_id','ethnicity_concept_id','location_id','provider_id','care_site_id','person_source_value','gender_source_value','gender_source_concept_id','race_source_value','race_source_concept_id','ethnicity_source_value','ethnicity_source_concept_id'],
  observation_period: ['observation_period_id','person_id','observation_period_start_date','observation_period_end_date','period_type_concept_id'],
  visit_occurrence: ['visit_occurrence_id','person_id','visit_concept_id','visit_start_date','visit_start_datetime','visit_end_date','visit_end_datetime','visit_type_concept_id','provider_id','care_site_id','visit_source_value','visit_source_concept_id','admitted_from_concept_id','admitted_from_source_value','discharged_to_concept_id','discharged_to_source_value','preceding_visit_occurrence_id'],
  visit_detail: ['visit_detail_id','person_id','visit_detail_concept_id','visit_detail_start_date','visit_detail_start_datetime','visit_detail_end_date','visit_detail_end_datetime','visit_detail_type_concept_id','provider_id','care_site_id','visit_detail_source_value','visit_detail_source_concept_id','admitted_from_concept_id','admitted_from_source_value','discharged_to_source_value','discharged_to_concept_id','preceding_visit_detail_id','parent_visit_detail_id','visit_occurrence_id'],
  condition_occurrence: ['condition_occurrence_id','person_id','condition_concept_id','condition_start_date','condition_start_datetime','condition_end_date','condition_end_datetime','condition_type_concept_id','condition_status_concept_id','stop_reason','provider_id','visit_occurrence_id','visit_detail_id','condition_source_value','condition_source_concept_id','condition_status_source_value'],
  drug_exposure: ['drug_exposure_id','person_id','drug_concept_id','drug_exposure_start_date','drug_exposure_start_datetime','drug_exposure_end_date','drug_exposure_end_datetime','verbatim_end_date','drug_type_concept_id','stop_reason','refills','quantity','days_supply','sig','route_concept_id','lot_number','provider_id','visit_occurrence_id','visit_detail_id','drug_source_value','drug_source_concept_id','route_source_value','dose_unit_source_value'],
  procedure_occurrence: ['procedure_occurrence_id','person_id','procedure_concept_id','procedure_date','procedure_datetime','procedure_end_date','procedure_end_datetime','procedure_type_concept_id','modifier_concept_id','quantity','provider_id','visit_occurrence_id','visit_detail_id','procedure_source_value','procedure_source_concept_id','modifier_source_value'],
  device_exposure: ['device_exposure_id','person_id','device_concept_id','device_exposure_start_date','device_exposure_start_datetime','device_exposure_end_date','device_exposure_end_datetime','device_type_concept_id','unique_device_id','production_id','quantity','provider_id','visit_occurrence_id','visit_detail_id','device_source_value','device_source_concept_id','unit_concept_id','unit_source_value','unit_source_concept_id'],
  measurement: ['measurement_id','person_id','measurement_concept_id','measurement_date','measurement_datetime','measurement_time','measurement_type_concept_id','operator_concept_id','value_as_number','value_as_concept_id','unit_concept_id','range_low','range_high','provider_id','visit_occurrence_id','visit_detail_id','measurement_source_value','measurement_source_concept_id','unit_source_value','unit_source_concept_id','value_source_value','measurement_event_id','meas_event_field_concept_id'],
  observation: ['observation_id','person_id','observation_concept_id','observation_date','observation_datetime','observation_type_concept_id','value_as_number','value_as_string','value_as_concept_id','qualifier_concept_id','unit_concept_id','provider_id','visit_occurrence_id','visit_detail_id','observation_source_value','observation_source_concept_id','unit_source_value','qualifier_source_value','value_source_value','observation_event_id','obs_event_field_concept_id'],
  death: ['person_id','death_date','death_datetime','death_type_concept_id','cause_concept_id','cause_source_value','cause_source_concept_id'],
  note: ['note_id','person_id','note_date','note_datetime','note_type_concept_id','note_class_concept_id','note_title','note_text','encoding_concept_id','language_concept_id','provider_id','visit_occurrence_id','visit_detail_id','note_source_value','note_event_id','note_event_field_concept_id'],
  note_nlp: ['note_nlp_id','note_id','section_concept_id','snippet','offset','lexical_variant','note_nlp_concept_id','note_nlp_source_concept_id','nlp_system','nlp_date','nlp_datetime','term_exists','term_temporal','term_modifiers'],
  waveform: ['waveform_id','person_id','waveform_date','waveform_datetime','waveform_concept_id'],
  dicom: ['dicom_id','person_id','dicom_date','dicom_datetime','dicom_concept_id'],
};

export interface TableCard {
  key: keyof OmopTables;
  name: string;
  description: string;
  icon: string;
  color: string;
  domainKeywords: string[];
  type?: 'CDM V5.4' | 'Imaging' | 'Signal';
  columns?: string[]; // Populated at runtime from TABLE_COLUMNS
}

export const OMOP_TABLE_CARDS: TableCard[] = [
  { key: 'condition_occurrence', name: 'Condition Occurrence', description: 'Contains records of events where a person has been diagnosed with a disease, sign, or symptom.', icon: 'medical_services', color: 'blue', domainKeywords: ['Condition'], type: 'CDM V5.4' , columns: TABLE_COLUMNS.condition_occurrence },
  { key: 'procedure_occurrence', name: 'Procedure Occurrence', description: 'Records of activities performed on patients, such as surgeries or diagnostic tests.', icon: 'healing', color: 'purple',  domainKeywords: ['Procedure'], type: 'CDM V5.4' , columns: TABLE_COLUMNS.procedure_occurrence },
  { key: 'device_exposure', name: 'Device Exposure', description: 'Captures information about medical devices used by or implanted in a person.', icon: 'precision_manufacturing', color: 'orange', domainKeywords: ['Device'], type: 'CDM V5.4' , columns: TABLE_COLUMNS.device_exposure },
  { key: 'measurement', name: 'Measurement', description: 'Structured data from laboratory tests and vital signs.', icon: 'monitoring', color: 'pink', domainKeywords: ['Measurement'], type: 'CDM V5.4' , columns: TABLE_COLUMNS.measurement },
  { key: 'drug_exposure', name: 'Drug Exposure', description: 'Records of drug consumption, prescriptions, or administration for the person.', icon: 'mixture_med', color: 'emerald', domainKeywords: ['Drug'], type: 'CDM V5.4' , columns: TABLE_COLUMNS.drug_exposure },
  { key: 'visit_occurrence', name: 'Visit Occurrence', description: 'Records of person\'s interactions with the healthcare system.', icon: 'meeting_room', color: 'indigo', domainKeywords: ['Visit'], type: 'CDM V5.4' , columns: TABLE_COLUMNS.visit_occurrence },
  { key: 'observation', name: 'Observation', description: 'Clinical facts about a person that do not fit into other domains, such as smoking status.', icon: 'visibility', color: 'amber', domainKeywords: ['Observation'], type: 'CDM V5.4' , columns: TABLE_COLUMNS.observation },
  { key: 'observation_period', name: 'Observation Period', description: 'Time spans for which a person is at-risk to have clinical events recorded.', icon: 'date_range', color: 'lime', domainKeywords: [], type: 'CDM V5.4' , columns: TABLE_COLUMNS.observation_period },
  { key: 'visit_detail', name: 'Visit Detail', description: 'Finer-grained records of healthcare encounters, nested within visit_occurrence.', icon: 'meeting_room', color: 'blue', domainKeywords: [], type: 'CDM V5.4' , columns: TABLE_COLUMNS.visit_detail },
  { key: 'person', name: 'Person', description: 'Demographics and administrative information about the patient population.', icon: 'person', color: 'cyan', domainKeywords: ['Gender', 'Race', 'Ethnicity'], type: 'CDM V5.4' , columns: TABLE_COLUMNS.person },
  { key: 'death', name: 'Death', description: 'Records of mortality events and cause of death.', icon: 'skull', color: 'red', domainKeywords: ['Death'], type: 'CDM V5.4' , columns: TABLE_COLUMNS.death },
  { key: 'note', name: 'Note', description: 'Unstructured clinical text documents such as progress notes and discharge summaries.', icon: 'description', color: 'teal', domainKeywords: [], type: 'CDM V5.4' , columns: TABLE_COLUMNS.note },
  { key: 'note_nlp', name: 'Note NLP', description: 'Structured features extracted from clinical notes using Natural Language Processing.', icon: 'psychology', color: 'violet', domainKeywords: [], type: 'CDM V5.4' , columns: TABLE_COLUMNS.note_nlp },
];

export const MEDIA_TABLE_CARDS: TableCard[] = [
  { key: 'waveform', name: 'Waveform', description: 'Continuous signal data such as ECG, EEG, or hemodynamic waveforms.', icon: 'monitor_heart', color: 'rose', domainKeywords: [], type: 'Signal', columns: TABLE_COLUMNS.waveform },
  { key: 'dicom', name: 'DICOM', description: 'Medical imaging data including CT, MRI, and X-ray studies.', icon: 'radiology', color: 'slate', domainKeywords: [], type: 'Imaging', columns: TABLE_COLUMNS.dicom },
];

export const TABLE_CARDS: TableCard[] = [...OMOP_TABLE_CARDS, ...MEDIA_TABLE_CARDS];

const byKey = new Map(TABLE_CARDS.map(t => [t.key as string, t]));

/** API table key → TableCard (or undefined) */
export function getTableCard(apiKey: string): TableCard | undefined {
  return byKey.get(apiKey);
}

export function getTableColumns(tableName: keyof OmopTables): string[] {
  return TABLE_CARDS.find(t => t.key === tableName)?.columns ?? [];
}

export function getOmopTableKeys(): (keyof OmopTables)[] {
  return TABLE_CARDS.map(t => t.key as keyof OmopTables);
}
