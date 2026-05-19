const User = require("./User");
const VendorDetail = require("./VendorDetail");
const Category = require("./Category");
const Rfp = require("./Rfp");
const VendorCategory = require("./VendorCategory");
const RfpCategory = require("./RfpCategory");
const RfpVendor = require("./RfpVendor");
const Otp = require("./Otp");

// User - VendorDetail
User.hasOne(VendorDetail, { foreignKey: "user_id" });
VendorDetail.belongsTo(User, { foreignKey: "user_id" });

// User - VendorCategory
User.hasMany(VendorCategory, { foreignKey: "vendor_id" });
VendorCategory.belongsTo(User, { foreignKey: "vendor_id" });

// Category - VendorCategory
Category.hasMany(VendorCategory, { foreignKey: "category_id" });
VendorCategory.belongsTo(Category, { foreignKey: "category_id" });

// Rfp - RfpCategory
Rfp.hasMany(RfpCategory, { foreignKey: "rfp_id" });
RfpCategory.belongsTo(Rfp, { foreignKey: "rfp_id" });

// Category - RfpCategory
Category.hasMany(RfpCategory, { foreignKey: "category_id" });
RfpCategory.belongsTo(Category, { foreignKey: "category_id" });

// Rfp - RfpVendor
Rfp.hasMany(RfpVendor, { foreignKey: "rfp_id" });
RfpVendor.belongsTo(Rfp, { foreignKey: "rfp_id" });

// User - RfpVendor
User.hasMany(RfpVendor, { foreignKey: "vendor_id" });
RfpVendor.belongsTo(User, { foreignKey: "vendor_id" });

// Rfp - User (admin)
User.hasMany(Rfp, { foreignKey: "admin_id" });
Rfp.belongsTo(User, { foreignKey: "admin_id" });

module.exports = {
  User,
  VendorDetail,
  Category,
  Rfp,
  VendorCategory,
  RfpCategory,
  RfpVendor,
  Otp,
};
