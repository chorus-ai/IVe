"use strict";

const WidgetTagModel = function (sequelize, DataTypes) {
  return sequelize.define(
    "iveWidgetTag",
    {
      iveWidgetId: { type: DataTypes.INTEGER, allowNull: false },
      iveTagId: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
      timestamps: false,
      indexes: [
        { unique: true, fields: ["iveWidgetId", "iveTagId"] },
      ],
    }
  );
};

module.exports = WidgetTagModel;
