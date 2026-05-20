const express = require("express");
const router = express.Router();
const {
  login,
  registerAdmin,
  registerVendor,
  logout,
} = require("../controllers/auth.controller");
const { verifyToken } = require("../middleware/auth.middleware");

router.post("/login", login);
router.post("/registeradmin", registerAdmin);
router.post("/registervendor", registerVendor);
router.post("/logout", verifyToken, logout);

module.exports = router;
