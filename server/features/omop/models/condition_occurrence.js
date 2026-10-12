module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "condition_occurrence",
    {
      condition_occurrence_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
      },
      person_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      condition_concept_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      condition_start_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      condition_start_datetime: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      condition_end_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      condition_end_datetime: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      condition_type_concept_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      condition_status_concept_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      stop_reason: {
        type: DataTypes.STRING(20),
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
      condition_source_value: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      condition_source_concept_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      condition_status_source_value: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
    },
    {
      tableName: "condition_occurrence",
      timestamps: false,
      freezeTableName: true,
    },
  );
};
