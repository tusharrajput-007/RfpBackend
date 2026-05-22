const express = require("express");
const router = express.Router();
const { getVendors } = require("../controllers/vendor.controller");
const { verifyToken } = require("../middleware/auth.middleware");
const { isAdmin } = require("../middleware/admin.middleware");

router.get("/vendorlist", verifyToken, isAdmin, getVendors);

module.exports = router;
