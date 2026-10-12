"use strict";

const UserModel = function (sequelize, DataTypes) {
  return sequelize.define(
    "user",
    {
      id: {
        primaryKey: true,
        autoIncrement: true,
        type: DataTypes.INTEGER,
      },
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false
      },
      password: {
        type: DataTypes.STRING,
        allowNull: true
      },
      firstName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      lastName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      avatar: DataTypes.TEXT,
      token: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      loginType: DataTypes.STRING,
      isBot: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      passwordResetAt: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
      },
      tokenResetAt: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
      },
    },
    {
      timestamps: false,
      defaultScope: {
        attributes: { exclude: ["password"] },
      },
      scopes: {
        withPassword: {
          attributes: {},
        },
      },
    }
  );
};

module.exports = UserModel;
