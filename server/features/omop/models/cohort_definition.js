module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "cohort_definition",
    {
    // This table is populated from an ATLAS-style cohort catalog (id, name,
    // description, expression_type, created_date, ...), not the standard
    // OMOP CDM cohort_definition columns — see python-scripts/omop_sample.py.
    // `field:` keeps the CDM-shaped attribute names the API/client expect
    // while mapping onto the actual ATLAS columns underneath.
    cohort_definition_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: "id",
    },
    cohort_definition_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "name",
    },
    cohort_definition_description: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "description",
    },
    cohort_definition_syntax: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "expression_type",
    },
    cohort_initiation_date: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "created_date",
    }
    },
    {
      tableName: "cohort_definition",
      timestamps: false,
      freezeTableName: true,
    }
  );
};
