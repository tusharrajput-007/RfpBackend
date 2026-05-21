const { getPagination, getPagingData } = require("../utils/pagination");
const { Category, VendorCategory, RfpCategory } = require("../models/index");

// get all categories
const getCategories = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const { limit: parsedLimit, offset } = getPagination(page, limit);

    const data = await Category.findAndCountAll({
      attributes: ["id", "name", "status"],
      limit: parsedLimit,
      offset,
      order: [["createdAt", "DESC"]],
    });

    const response = getPagingData(data, page, parsedLimit);

    return res.status(200).json({
      response: "success",
      ...response,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ response: "error", error: "Internal server error" });
  }
};

// add a category
const addCategory = async (req, res) => {
  try {
    const { name } = req.body;

    // Validation
    if (!name || name.trim() === "") {
      return res
        .status(400)
        .json({ response: "error", error: "Category name is required" });
    }

    const trimmedName = name.trim();

    // if category already exists
    const existingCategory = await Category.findOne({
      where: { name: trimmedName },
    });
    if (existingCategory) {
      return res
        .status(400)
        .json({ response: "error", error: "Category already exist" });
    }

    // create
    await Category.create({ name: trimmedName });

    return res.status(201).json({ response: "success" });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ response: "error", error: "Internal server error" });
  }
};

// delete a category
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // if category exists
    const category = await Category.findOne({ where: { id } });
    if (!category) {
      return res.status(404).json({ response: "error", error: "Invalid ID" });
    }

    // additionals added (required)
    // don't delete if category is used in vendor_categories
    const vendorCategory = await VendorCategory.findOne({
      where: { category_id: id },
    });
    if (vendorCategory) {
      return res.status(400).json({
        response: "error",
        error: "Category is in use and cannot be deleted.",
      });
    }

    // don't delete if category is used in rfp_categories
    const rfpCategory = await RfpCategory.findOne({
      where: { category_id: id },
    });
    if (rfpCategory) {
      return res.status(400).json({
        response: "error",
        error: "Category is in use and cannot be deleted.",
      });
    }

    // Delete category
    await Category.destroy({ where: { id } });

    return res.status(200).json({ response: "success" });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ response: "error", error: "Internal server error" });
  }
};

// get category by id
const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findOne({
      where: { id },
      attributes: ["id", "name", "status"],
    });

    if (!category) {
      return res
        .status(404)
        .json({ response: "error", error: "Invalid Category ID" });
    }

    return res.status(200).json({
      response: "success",
      category,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ response: "error", error: "Internal server error" });
  }
};

// update category
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, status } = req.body;

    // check if category exists
    const category = await Category.findOne({ where: { id } });
    if (!category) {
      return res
        .status(404)
        .json({ response: "error", error: "Invalid Category ID" });
    }

    // validate name
    if (!name || name.trim() === "") {
      return res
        .status(400)
        .json({ response: "error", error: "Name is required" });
    }

    // if new name already exists for a different category
    const existingCategory = await Category.findOne({
      where: { name: name.trim() },
    });
    if (existingCategory && existingCategory.id !== parseInt(id)) {
      return res
        .status(400)
        .json({ response: "error", error: "Category already exist" });
    }

    // validate status if provided
    if (status && !["active", "inactive"].includes(status)) {
      return res
        .status(400)
        .json({ response: "error", error: "Invalid status" });
    }

    // now update category
    await Category.update(
      {
        name: name.trim(),
        status: status || category.status,
      },
      { where: { id } },
    );

    return res.status(200).json({ response: "success" });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ response: "error", error: "Internal server error" });
  }
};

module.exports = {
  getCategories,
  addCategory,
  deleteCategory,
  getCategoryById,
  updateCategory,
};
