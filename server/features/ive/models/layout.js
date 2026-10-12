"use strict";

const LayoutModel = function (sequelize, DataTypes) {
  return sequelize.define(
    "iveLayout",
    {
      id: {
        primaryKey: true,
        autoIncrement: true,
        type: DataTypes.INTEGER,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      config: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
    },
    {
      timestamps: true,
    }
  );
};

module.exports = LayoutModel;
