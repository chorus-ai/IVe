module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "cohort",
    {
      cohort_definition_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      subject_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      cohort_start_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      cohort_end_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
    },
    {
      tableName: "cohort",
      timestamps: false,
      freezeTableName: true,
    },
  );
};
