module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "note_nlp",
    {
      note_nlp_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      note_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      section_concept_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      snippet: {
        type: DataTypes.STRING(250),
        allowNull: true,
      },
      offset: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      lexical_variant: {
        type: DataTypes.STRING(250),
        allowNull: false,
      },
      note_nlp_concept_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      note_nlp_source_concept_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      nlp_system: {
        type: DataTypes.STRING(250),
        allowNull: true,
      },
      nlp_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      nlp_datetime: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      term_exists: {
        type: DataTypes.STRING(1),
        allowNull: true,
      },
      term_temporal: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      term_modifiers: {
        type: DataTypes.STRING(2000),
        allowNull: true,
      },
    },
    {
      tableName: "note_nlp",
      timestamps: false,
      freezeTableName: true,
    },
  );
};
