module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "death",
    {
      person_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      death_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      death_datetime: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      death_type_concept_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      cause_concept_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      cause_source_value: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      cause_source_concept_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      tableName: "death",
      timestamps: false,
      freezeTableName: true,
    },
  );
};
