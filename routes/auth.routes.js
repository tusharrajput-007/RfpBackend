const express = require("express");
const router = express.Router();
const { login, registerAdmin } = require("../controllers/auth.controller");

router.post("/login", login);
router.post("/registeradmin", registerAdmin);

module.exports = router;
