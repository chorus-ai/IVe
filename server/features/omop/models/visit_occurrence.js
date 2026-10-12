module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "visit_occurrence",
    {
      visit_occurrence_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      person_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      visit_concept_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      visit_start_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      visit_start_datetime: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      visit_end_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      visit_end_datetime: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      visit_type_concept_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      provider_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      care_site_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      visit_source_value: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      visit_source_concept_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      admitted_from_concept_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      admitted_from_source_value: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      discharged_to_concept_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      discharged_to_source_value: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      preceding_visit_occurrence_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      tableName: "visit_occurrence",
      timestamps: false,
      freezeTableName: true,
    },
  );
};
