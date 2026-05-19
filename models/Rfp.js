const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Rfp = sequelize.define(
  "Rfp",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    admin_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    item_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    item_description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    rfp_no: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    last_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    minimum_price: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    maximum_price: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("open", "closed"),
      defaultValue: "open",
    },
  },
  {
    tableName: "rfps",
    timestamps: true,
  },
);

module.exports = Rfp;
