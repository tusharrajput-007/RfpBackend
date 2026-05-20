const express = require("express");
const router = express.Router();
const { createRfp, updateRfp } = require("../controllers/rfp.controller");
const { verifyToken } = require("../middleware/auth.middleware");
const { isAdmin } = require("../middleware/admin.middleware");

router.post("/createrfp", verifyToken, isAdmin, createRfp);
router.put("/updaterfp/:id", verifyToken, isAdmin, updateRfp);

module.exports = router;
