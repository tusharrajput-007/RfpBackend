const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Otp = sequelize.define(
  "Otp",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    otp: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: "otps",
    timestamps: true,
  },
);

module.exports = Otp;
