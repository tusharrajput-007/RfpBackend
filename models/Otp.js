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
      type: DataTypes.STRING(30),
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    otp: {
      type: DataTypes.STRING(6),
      allowNull: false,
    },
  },
  {
    tableName: "otps",
    timestamps: true,
  },
);

module.exports = Otp;
