module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "drug_exposure",
    {
      drug_exposure_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
      },
      person_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      drug_concept_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      drug_exposure_start_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      drug_exposure_start_datetime: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      drug_exposure_end_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      drug_exposure_end_datetime: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      verbatim_end_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      drug_type_concept_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      stop_reason: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      refills: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      quantity: {
        type: DataTypes.DOUBLE,
        allowNull: true,
      },
      days_supply: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      sig: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      route_concept_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      lot_number: {
        type: DataTypes.STRING(50),
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
      drug_source_value: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      drug_source_concept_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      route_source_value: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      dose_unit_source_value: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
    },
    {
      tableName: "drug_exposure",
      timestamps: false,
      freezeTableName: true,
    },
  );
};
