"use strict";

const LayoutTagModel = function (sequelize, DataTypes) {
  return sequelize.define(
    "iveLayoutTag",
    {
      iveLayoutId: { type: DataTypes.INTEGER, allowNull: false },
      iveTagId: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
      timestamps: false,
      indexes: [
        { unique: true, fields: ["iveLayoutId", "iveTagId"] },
      ],
    }
  );
};

module.exports = LayoutTagModel;
