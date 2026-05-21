const express = require("express");
const router = express.Router();
const {
  getCategories,
  addCategory,
  deleteCategory,
  getCategoryById,
  updateCategory,
} = require("../controllers/category.controller");
const { verifyToken } = require("../middleware/auth.middleware");
const { isAdmin } = require("../middleware/admin.middleware");

router.get("/categories", getCategories);
router.post("/categories", verifyToken, isAdmin, addCategory);
router.delete("/categories/:id", verifyToken, isAdmin, deleteCategory);
router.get("/categories/:id", getCategoryById);
router.put("/categories/:id", verifyToken, isAdmin, updateCategory);

module.exports = router;
