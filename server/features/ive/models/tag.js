"use strict";

const TagModel = function (sequelize, DataTypes) {
  return sequelize.define(
    "iveTag",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      slug: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: true,
          is: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        },
      },
    },
    {
      timestamps: true
    }
  );
};

module.exports = TagModel;
