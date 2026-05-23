const express = require("express");
const router = express.Router();
const {
  resetPassword,
  forgotPassword,
  confirmOtp,
} = require("../controllers/password.controller");
const { verifyToken } = require("../middleware/auth.middleware");

router.post("/resetPassword", verifyToken, resetPassword);
router.post("/forgotPassword", forgotPassword);
router.post("/confirmotpresetPassword", confirmOtp);

module.exports = router;
