module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "person",
    {
      person_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      gender_concept_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      year_of_birth: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      month_of_birth: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      day_of_birth: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      birth_datetime: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      race_concept_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      ethnicity_concept_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      location_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      provider_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      care_site_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      person_source_value: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      gender_source_value: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      gender_source_concept_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      race_source_value: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      race_source_concept_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      ethnicity_source_value: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      ethnicity_source_concept_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      tableName: "person",
      freezeTableName: true,
      timestamps: false,
    },
  );
};
