const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const VendorDetail = sequelize.define(
  "VendorDetail",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    revenue: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    no_of_employees: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    pancard_no: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    gst_no: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("pending", "approved", "rejected"),
      defaultValue: "pending",
    },
  },
  {
    tableName: "vendor_details",
    timestamps: true,
  },
);

module.exports = VendorDetail;
