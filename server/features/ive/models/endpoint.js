"use strict";

const EndpointModel = function (sequelize, DataTypes) {
  return sequelize.define(
    "iveEndpoint",
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      endpoint: { type: DataTypes.STRING, allowNull: false },
      method: { type: DataTypes.STRING, allowNull: false, defaultValue: "POST" },
      params: { type: DataTypes.TEXT, allowNull: true },
      description: { type: DataTypes.STRING, allowNull: true },
      isPublic: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      isCached: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    },
    { timestamps: true }
  );
};

module.exports = EndpointModel;
