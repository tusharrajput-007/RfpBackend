const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const RfpCategory = sequelize.define(
  "RfpCategory",
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
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "rfp_categories",
    timestamps: false,
  },
);

module.exports = RfpCategory;
