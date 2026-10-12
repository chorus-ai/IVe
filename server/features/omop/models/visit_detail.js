module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "visit_detail",
    {
      visit_detail_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      person_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      visit_detail_concept_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      visit_detail_start_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      visit_detail_start_datetime: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      visit_detail_end_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      visit_detail_end_datetime: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      visit_detail_type_concept_id: {
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
      visit_detail_source_value: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      visit_detail_source_concept_id: {
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
      discharged_to_source_value: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      discharged_to_concept_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      preceding_visit_detail_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      parent_visit_detail_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      visit_occurrence_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      tableName: "visit_detail",
      timestamps: false,
      freezeTableName: true,
    },
  );
};
