module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "observation_period",
    {
      observation_period_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      person_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      observation_period_start_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      observation_period_end_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      period_type_concept_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      tableName: "observation_period",
      freezeTableName: true,
      timestamps: false,
    },
  );
};
