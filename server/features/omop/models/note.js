module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "note",
    {
      note_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      person_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      note_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      note_datetime: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      note_type_concept_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      note_class_concept_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      note_title: {
        type: DataTypes.STRING(250),
        allowNull: true,
      },
      note_text: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      encoding_concept_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      language_concept_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      provider_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      visit_occurrence_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      visit_detail_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      note_source_value: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      note_event_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      note_event_field_concept_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      tableName: "note",
      timestamps: false,
      freezeTableName: true,
    },
  );
};
