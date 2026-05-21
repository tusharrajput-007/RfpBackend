const express = require("express");
const router = express.Router();
const {
  createRfp,
  updateRfp,
  getRfpDetails,
  getAllRfps,
  getRfpQuotes,
  closeRfp,
} = require("../controllers/rfp.controller");
const { verifyToken } = require("../middleware/auth.middleware");
const { isAdmin } = require("../middleware/admin.middleware");

router.post("/createrfp", verifyToken, isAdmin, createRfp);
router.put("/updaterfp/:id", verifyToken, isAdmin, updateRfp);
router.get("/getrfp/:id", verifyToken, getRfpDetails);
router.get("/getallrfps", verifyToken, isAdmin, getAllRfps);
router.get("/quotes/:id", verifyToken, isAdmin, getRfpQuotes);
router.put("/closerfp/:id", verifyToken, isAdmin, closeRfp);

module.exports = router;
