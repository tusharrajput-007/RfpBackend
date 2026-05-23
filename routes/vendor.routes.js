const express = require("express");
const router = express.Router();
const {
  getVendors,
  getVendorsByCategory,
  approveVendor,
} = require("../controllers/vendor.controller");
const { verifyToken } = require("../middleware/auth.middleware");
const { isAdmin } = require("../middleware/admin.middleware");

router.get("/vendorlist", verifyToken, isAdmin, getVendors);
router.get(
  "/vendorlist/:categoryId",
  verifyToken,
  isAdmin,
  getVendorsByCategory,
);
router.put("/approvevendor", verifyToken, isAdmin, approveVendor);

module.exports = router;
