const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const RfpVendor = sequelize.define(
  "RfpVendor",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    rfp_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    vendor_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    item_price: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: null,
    },
    total_cost: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: null,
    },
    applied: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: "rfp_vendors",
    timestamps: true,
  },
);

module.exports = RfpVendor;
