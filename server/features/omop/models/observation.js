module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "observation",
    {
      observation_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      person_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      observation_concept_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      observation_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      observation_datetime: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      observation_type_concept_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      value_as_number: {
        type: DataTypes.DOUBLE,
        allowNull: true,
      },
      value_as_string: {
        type: DataTypes.STRING(60),
        allowNull: true,
      },
      value_as_concept_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      qualifier_concept_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      unit_concept_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
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
      observation_source_value: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      observation_source_concept_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      unit_source_value: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      qualifier_source_value: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      value_source_value: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      observation_event_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      obs_event_field_concept_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      tableName: "observation",
      timestamps: false,
      freezeTableName: true,
    },
  );
};
