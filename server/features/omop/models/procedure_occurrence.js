module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "procedure_occurrence",
    {
      procedure_occurrence_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      person_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      procedure_concept_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      procedure_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      procedure_datetime: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      procedure_end_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      procedure_end_datetime: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      procedure_type_concept_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      modifier_concept_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      quantity: {
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
      procedure_source_value: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      procedure_source_concept_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      modifier_source_value: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
    },
    {
      tableName: "procedure_occurrence",
      timestamps: false,
      freezeTableName: true,
    },
  );
};
