module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "measurement",
    {
      measurement_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      person_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      measurement_concept_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      measurement_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      measurement_datetime: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      measurement_time: {
        type: DataTypes.STRING(10),
        allowNull: true,
      },
      measurement_type_concept_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      operator_concept_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      value_as_number: {
        type: DataTypes.DOUBLE,
        allowNull: true,
      },
      value_as_concept_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      unit_concept_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      range_low: {
        type: DataTypes.DOUBLE,
        allowNull: true,
      },
      range_high: {
        type: DataTypes.DOUBLE,
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
      measurement_source_value: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      measurement_source_concept_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      unit_source_value: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      unit_source_concept_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      value_source_value: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      measurement_event_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      meas_event_field_concept_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      tableName: "measurement",
      timestamps: false,
      freezeTableName: true,
    },
  );
};
