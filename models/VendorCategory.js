const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const VendorCategory = sequelize.define(
  "VendorCategory",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    vendor_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "vendor_categories",
    timestamps: false,
  },
);

module.exports = VendorCategory;
