module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "device_exposure",
    {
      device_exposure_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      person_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      device_concept_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      device_exposure_start_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      device_exposure_start_datetime: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      device_exposure_end_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      device_exposure_end_datetime: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      device_type_concept_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      unique_device_id: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      production_id: {
        type: DataTypes.STRING(255),
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
      device_source_value: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      device_source_concept_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      unit_concept_id: {
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
    },
    {
      tableName: "device_exposure",
      timestamps: false,
      freezeTableName: true,
    },
  );
};
