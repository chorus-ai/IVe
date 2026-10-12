
const vocabConceptModel = (sequelize, DataTypes) => {
    return sequelize.define('concept', {
      concept_id: {
      type: DataTypes.INTEGER,
        primaryKey: true,
      },
      concept_name: DataTypes.STRING,
      concept_class_id: {
        type: DataTypes.STRING(20),
        allowNull: false
      },
      concept_code: {
        type: DataTypes.STRING(50),
        allowNull: false
      },
      vocabulary_id: {
        type: DataTypes.STRING(20),
        allowNull: false
      },
      table_name: {
        type: DataTypes.STRING,
        primaryKey: true,
      },
      column_name: {
        type: DataTypes.STRING,
        primaryKey: true,
      },
      count: DataTypes.INTEGER,
      // standard_concept: {
      //   type: DataTypes.CHAR(1)
      // },
      // valid_start_date: {
      //   type: DataTypes.DATEONLY,
      //   allowNull: false
      // },
      // valid_end_date: {
      //   type: DataTypes.DATEONLY,
      //   allowNull: false
      // },
      // invalid_reason: {
      //   type: DataTypes.CHAR(1)
      // }
    }, {
      tableName: 'concepts',
      timestamps: false,
      freezeTableName: true,
      indexes: [
        { fields: ['table_name', 'column_name'] },
        { fields: ['concept_name'] },
        { fields: ['vocabulary_id'] },
        { fields: ['concept_class_id'] },
        { fields: ['concept_code'] },
      ],
    });
  };
  
module.exports = vocabConceptModel;