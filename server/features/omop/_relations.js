module.exports = (db) => {

  db.observation_period.belongsTo(db.person, { foreignKey: 'person_id' });

  db.death.belongsTo(db.person, { foreignKey: 'person_id' });
  
  db.visit_occurrence.belongsTo(db.person, { foreignKey: 'person_id' });
  
  db.visit_detail.belongsTo(db.person, { foreignKey: 'person_id' });
  db.visit_detail.belongsTo(db.visit_detail, { foreignKey: 'preceding_visit_detail_id' });
  db.visit_detail.belongsTo(db.visit_detail, { foreignKey: 'parent_visit_detail_id' });
  db.visit_detail.belongsTo(db.visit_occurrence, { foreignKey: 'visit_occurrence_id' });
  
  db.condition_occurrence.belongsTo(db.person, { foreignKey: 'person_id' });
  db.condition_occurrence.belongsTo(db.visit_occurrence, { foreignKey: 'visit_occurrence_id' });
  db.condition_occurrence.belongsTo(db.visit_detail, { foreignKey: 'visit_detail_id' });

  db.drug_exposure.belongsTo(db.person, { foreignKey: 'person_id' });
  db.drug_exposure.belongsTo(db.visit_occurrence, { foreignKey: 'visit_occurrence_id' });
  db.drug_exposure.belongsTo(db.visit_detail, { foreignKey: 'visit_detail_id' });
  
  db.procedure_occurrence.belongsTo(db.person, { foreignKey: 'person_id' });
  db.procedure_occurrence.belongsTo(db.visit_occurrence, { foreignKey: 'visit_occurrence_id' });
  db.procedure_occurrence.belongsTo(db.visit_detail, { foreignKey: 'visit_detail_id' });

  db.note.belongsTo(db.person, { foreignKey: 'person_id' });
  db.note.belongsTo(db.visit_occurrence, { foreignKey: 'visit_occurrence_id' });
  db.note.belongsTo(db.visit_detail, { foreignKey: 'visit_detail_id' });
  
  db.note_nlp.belongsTo(db.note, { foreignKey: 'note_id' });
  
  db.device_exposure.belongsTo(db.person, { foreignKey: 'person_id' });
  db.device_exposure.belongsTo(db.visit_occurrence, { foreignKey: 'visit_occurrence_id' });
  db.device_exposure.belongsTo(db.visit_detail, { foreignKey: 'visit_detail_id' });
  
  db.observation.belongsTo(db.person, { foreignKey: 'person_id' });
  db.observation.belongsTo(db.visit_occurrence, { foreignKey: 'visit_occurrence_id' });
  db.observation.belongsTo(db.visit_detail, { foreignKey: 'visit_detail_id' });
  
  db.measurement.belongsTo(db.person, { foreignKey: 'person_id' });
  db.measurement.belongsTo(db.visit_occurrence, { foreignKey: 'visit_occurrence_id' });
  db.measurement.belongsTo(db.visit_detail, { foreignKey: 'visit_detail_id' });

  db.cohort.belongsTo(db.cohort_definition, { foreignKey: 'cohort_definition_id' });
};
