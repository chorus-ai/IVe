"use strict";

const EndpointTagModel = function (sequelize, DataTypes) {
  return sequelize.define(
    "iveEndpointTag",
    {
      iveEndpointId: { type: DataTypes.INTEGER, allowNull: false },
      iveTagId: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
      timestamps: false,
      indexes: [
        { unique: true, fields: ["iveEndpointId", "iveTagId"] },
      ],
    }
  );
};

module.exports = EndpointTagModel;
