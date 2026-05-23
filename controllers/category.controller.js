const { getPagination, getPagingData } = require("../utils/pagination");
const { Category, VendorCategory, RfpCategory } = require("../models/index");
const { validateRequiredFields } = require("../utils/validators");
const asyncWrapper = require("../utils/asyncWrapper");
const AppError = require("../utils/AppError");
const { Op } = require("sequelize");

// get all categories
const getCategories = asyncWrapper(async (req, res) => {
  const { page, limit, name, status } = req.query;
  const { limit: parsedLimit, offset } = getPagination(page, limit);

  // where clause based on filters
  const where = {};
  if (name) where.name = { [Op.like]: `%${name}%` };
  if (status) where.status = status;

  const data = await Category.findAndCountAll({
    where,
    attributes: ["id", "name", "status"],
    limit: parsedLimit,
    offset,
    order: [["createdAt", "DESC"]],
  });

  const response = getPagingData(data, page, parsedLimit);

  return res.status(200).json({
    response: "success",
    message: "Categories fetched successfully",
    ...response,
  });
});

// add a category
const addCategory = asyncWrapper(async (req, res) => {
  const { name } = req.body;

  // Validation
  const requiredError = validateRequiredFields({ Name: name });
  if (requiredError) throw new AppError(requiredError, 400);

  const trimmedName = name.trim();

  // if category already exists
  const existingCategory = await Category.findOne({
    where: { name: trimmedName },
  });
  if (existingCategory) throw new AppError("Category already exist", 400);

  // create
  const category = await Category.create({ name: trimmedName });

  return res.status(201).json({
    response: "success",
    message: "Category created successfully",
    id: category.id,
  });
});

// delete a category
const deleteCategory = asyncWrapper(async (req, res) => {
  const { id } = req.params;

  // if category exists
  const category = await Category.findOne({ where: { id } });
  if (!category) throw new AppError("Invalid ID", 404);

  // additionals added (required)
  // don't delete if category is used in vendor_categories
  const vendorCategory = await VendorCategory.findOne({
    where: { category_id: id },
  });
  if (vendorCategory)
    throw new AppError("Category is in use and cannot be deleted.", 400);

  // don't delete if category is used in rfp_categories
  const rfpCategory = await RfpCategory.findOne({ where: { category_id: id } });
  if (rfpCategory)
    throw new AppError("Category is in use and cannot be deleted.", 400);

  // Delete category
  await Category.destroy({ where: { id } });

  return res.status(200).json({
    response: "success",
    message: "Category deleted successfully",
    id: parseInt(id),
  });
});

// get category by id
const getCategoryById = asyncWrapper(async (req, res) => {
  const { id } = req.params;

  const category = await Category.findOne({
    where: { id },
    attributes: ["id", "name", "status"],
  });

  if (!category) throw new AppError("Invalid Category ID", 404);

  return res.status(200).json({
    response: "success",
    message: "Category fetched successfully",
    data: category,
  });
});

// update category
const updateCategory = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const { name, status } = req.body;

  // check if category exists
  const category = await Category.findOne({ where: { id } });
  if (!category) throw new AppError("Invalid Category ID", 404);

  // validate name
  const requiredError = validateRequiredFields({ Name: name });
  if (requiredError) throw new AppError(requiredError, 400);

  // if new name already exists for a different category
  const existingCategory = await Category.findOne({
    where: { name: name.trim() },
  });
  if (existingCategory && existingCategory.id !== parseInt(id)) {
    throw new AppError("Category already exist", 400);
  }

  // validate status if provided
  if (status && !["active", "inactive"].includes(status)) {
    throw new AppError("Invalid status", 400);
  }

  // now update category
  await Category.update(
    {
      name: name.trim(),
      status: status || category.status,
    },
    { where: { id } },
  );

  return res.status(200).json({
    response: "success",
    message: "Category updated successfully",
    id: parseInt(id),
  });
});

// get all active categories for dropdown
const getActiveCategories = asyncWrapper(async (req, res) => {
  const categories = await Category.findAll({
    where: { status: "active" },
    attributes: ["id", "name"],
    order: [["name", "ASC"]],
  });

  return res.status(200).json({
    response: "success",
    message: "Active categories fetched successfully",
    data: categories,
  });
});

module.exports = {
  getCategories,
  addCategory,
  deleteCategory,
  getCategoryById,
  updateCategory,
  getActiveCategories,
};
