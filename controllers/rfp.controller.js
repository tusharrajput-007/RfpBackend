const {
  Rfp,
  RfpCategory,
  RfpVendor,
  Category,
  User,
  VendorDetail,
} = require("../models/index");
const { sendEmail } = require("../utils/email");
const { getPagination, getPagingData } = require("../utils/pagination");

// create rfp
const createRfp = async (req, res) => {
  try {
    const {
      item_name,
      rfp_no,
      quantity,
      last_date,
      minimum_price,
      maximum_price,
      item_description,
      categories,
      vendors,
    } = req.body;

    // Validations
    if (!item_name) {
      return res
        .status(400)
        .json({ response: "error", errors: "Item name is required" });
    }
    if (!rfp_no) {
      return res
        .status(400)
        .json({ response: "error", errors: "RFP number is required" });
    }
    if (!quantity) {
      return res
        .status(400)
        .json({ response: "error", errors: "Quantity is required" });
    }
    if (!Number.isInteger(quantity)) {
      return res
        .status(400)
        .json({ response: "error", errors: "Enter valid quantity" });
    }
    if (!last_date) {
      return res
        .status(400)
        .json({ response: "error", errors: "Last date is required" });
    }
    if (!minimum_price) {
      return res
        .status(400)
        .json({ response: "error", errors: "Minimum price is required" });
    }
    if (!maximum_price) {
      return res
        .status(400)
        .json({ response: "error", errors: "Maximum price is required" });
    }
    if (!item_description) {
      return res
        .status(400)
        .json({ response: "error", errors: "Item description is required" });
    }
    if (!categories || !Array.isArray(categories) || categories.length === 0) {
      return res
        .status(400)
        .json({ response: "error", errors: "Categories are required" });
    }
    if (!vendors || !Array.isArray(vendors) || vendors.length === 0) {
      return res
        .status(400)
        .json({ response: "error", errors: "Vendors are required" });
    }

    // minimum price should be less than max price
    if (parseFloat(minimum_price) >= parseFloat(maximum_price)) {
      return res.status(400).json({
        response: "error",
        errors: "Minimum price should be less than maximum price.",
      });
    }

    // qty shuld be positive
    if (quantity <= 0) {
      return res
        .status(400)
        .json({ response: "error", errors: "Enter valid quantity." });
    }

    // we check if rfp_no already exists
    const existingRfp = await Rfp.findOne({ where: { rfp_no } });
    if (existingRfp) {
      return res
        .status(400)
        .json({ response: "error", errors: "RFP number already exists." });
    }

    // we validate last_date is future date
    const rfpLastDate = new Date(last_date);
    const today = new Date();
    if (rfpLastDate <= today) {
      return res.status(400).json({
        response: "error",
        errors: "Last date should be a future date.",
      });
    }

    // we validatee categories exist
    const validCategories = await Category.findAll({
      where: { id: categories },
    });
    if (validCategories.length !== categories.length) {
      return res
        .status(400)
        .json({ response: "error", errors: "Select valid categories." });
    }

    // then validate vendors exist
    const validVendors = await User.findAll({
      where: { id: vendors, user_type: "vendor" },
    });
    if (validVendors.length !== vendors.length) {
      return res
        .status(400)
        .json({ response: "error", errors: "Select valid Vendors." });
    }

    // we also validate if all vendors are approved (only existence won't be enough)
    const approvedVendors = await VendorDetail.findAll({
      where: {
        user_id: vendors,
        status: "approved",
      },
    });
    if (approvedVendors.length !== vendors.length) {
      return res
        .status(400)
        .json({ response: "error", errors: "Select valid Vendors." });
    }

    // create RFP
    const rfp = await Rfp.create({
      admin_id: req.user.id,
      item_name,
      rfp_no,
      quantity,
      last_date,
      minimum_price,
      maximum_price,
      item_description,
      status: "open",
    });

    // Insert rfp_categories
    const rfpCategories = categories.map((category_id) => ({
      rfp_id: rfp.id,
      category_id,
    }));
    await RfpCategory.bulkCreate(rfpCategories);

    // Insert rfp_vendors
    const rfpVendors = vendors.map((vendor_id) => ({
      rfp_id: rfp.id,
      vendor_id,
      item_price: null,
      total_cost: null,
      applied: false,
    }));
    await RfpVendor.bulkCreate(rfpVendors);

    // Send email to each vendor
    for (const vendor of validVendors) {
      try {
        await sendEmail(
          vendor.email,
          "Velocity has open an RFP for Quotation",
          `<p>Dear ${vendor.firstname},</p>
                <p>We want to inform that Velocity has opened an RFP & requesting the quotation on the same. Please find below the RFP details.</p>
                <p>RFP Name: ${item_name}</p>
                <p>End Date: ${last_date}</p>
                <p>Kindly login into the RFP system and submit your quote.</p>
                <p>Thanks,<br/>Velocity RFP System</p>`,
        );
      } catch (emailError) {
        console.error("Email failed for vendor:", vendor.email, emailError);
      }
    }

    return res.status(201).json({ response: "success" });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ response: "error", error: "Internal server error" });
  }
};

// update rfp
const updateRfp = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      item_name,
      rfp_no,
      quantity,
      last_date,
      minimum_price,
      maximum_price,
      item_description,
      categories,
      vendors,
    } = req.body;

    // Validations
    if (!item_name) {
      return res
        .status(400)
        .json({ response: "error", errors: "Item name is required" });
    }
    if (!rfp_no) {
      return res
        .status(400)
        .json({ response: "error", errors: "RFP number is required" });
    }
    if (!quantity) {
      return res
        .status(400)
        .json({ response: "error", errors: "Quantity is required" });
    }
    if (!Number.isInteger(quantity)) {
      return res
        .status(400)
        .json({ response: "error", errors: "Enter valid quantity" });
    }
    if (quantity <= 0) {
      return res
        .status(400)
        .json({ response: "error", errors: "Enter valid quantity" });
    }
    if (!last_date) {
      return res
        .status(400)
        .json({ response: "error", errors: "Last date is required" });
    }
    if (!minimum_price) {
      return res
        .status(400)
        .json({ response: "error", errors: "Minimum price is required" });
    }
    if (!maximum_price) {
      return res
        .status(400)
        .json({ response: "error", errors: "Maximum price is required" });
    }
    if (parseFloat(minimum_price) >= parseFloat(maximum_price)) {
      return res.status(400).json({
        response: "error",
        errors: "Minimum price should be less than maximum price.",
      });
    }
    if (!item_description) {
      return res
        .status(400)
        .json({ response: "error", errors: "Item description is required" });
    }
    if (!categories || !Array.isArray(categories) || categories.length === 0) {
      return res
        .status(400)
        .json({ response: "error", errors: "Categories are required" });
    }
    if (!vendors || !Array.isArray(vendors) || vendors.length === 0) {
      return res
        .status(400)
        .json({ response: "error", errors: "Vendors are required" });
    }

    // if RFP exists
    const rfp = await Rfp.findOne({ where: { id } });
    if (!rfp) {
      return res
        .status(404)
        .json({ response: "error", errors: "Invalid RFP ID" });
    }

    // if RFP is closed
    if (rfp.status === "closed") {
      return res
        .status(400)
        .json({ response: "error", errors: "RFP is closed" });
    }

    // check if rfp_no already exists for a different RFP
    const existingRfp = await Rfp.findOne({ where: { rfp_no } });
    if (existingRfp && existingRfp.id !== parseInt(id)) {
      return res
        .status(400)
        .json({ response: "error", errors: "RFP number already exists." });
    }

    // we check last_date is future date
    const rfpLastDate = new Date(last_date);
    const today = new Date();
    if (rfpLastDate <= today) {
      return res.status(400).json({
        response: "error",
        errors: "Last date should be a future date.",
      });
    }

    // all categories should exist
    const validCategories = await Category.findAll({
      where: { id: categories },
    });
    if (validCategories.length !== categories.length) {
      return res
        .status(400)
        .json({ response: "error", errors: "Select valid categories." });
    }

    // alll vendors  should exist
    const validVendors = await User.findAll({
      where: { id: vendors, user_type: "vendor" },
    });
    if (validVendors.length !== vendors.length) {
      return res
        .status(400)
        .json({ response: "error", errors: "Select valid Vendors." });
    }

    // all vendors should be approved
    const approvedVendors = await VendorDetail.findAll({
      where: {
        user_id: vendors,
        status: "approved",
      },
    });
    if (approvedVendors.length !== vendors.length) {
      return res
        .status(400)
        .json({ response: "error", errors: "Select valid Vendors." });
    }

    // Update RFP
    await Rfp.update(
      {
        item_name,
        rfp_no,
        quantity,
        last_date,
        minimum_price,
        maximum_price,
        item_description,
      },
      { where: { id } },
    );

    // Delete and re-insert rfp_categories
    await RfpCategory.destroy({ where: { rfp_id: id } });
    const rfpCategories = categories.map((category_id) => ({
      rfp_id: parseInt(id),
      category_id,
    }));
    await RfpCategory.bulkCreate(rfpCategories);

    // Delete and re-insert rfp_vendors
    await RfpVendor.destroy({ where: { rfp_id: id } });
    const rfpVendors = vendors.map((vendor_id) => ({
      rfp_id: parseInt(id),
      vendor_id,
      item_price: null,
      total_cost: null,
      applied: false,
    }));
    await RfpVendor.bulkCreate(rfpVendors);

    // email to each vendor
    for (const vendor of validVendors) {
      try {
        await sendEmail(
          vendor.email,
          "Velocity RFP has been Updated",
          `<p>Dear ${vendor.firstname},</p>
                    <p>An RFP has been updated and your previous quote has been reset. Please login and re-submit your quote.</p>
                    <p>RFP Name: ${item_name}</p>
                    <p>End Date: ${last_date}</p>
                    <p>Thanks,<br/>Velocity RFP System</p>`,
        );
      } catch (emailError) {
        console.error("Email failed for vendor:", vendor.email, emailError);
      }
    }

    return res.status(200).json({ response: "success" });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ response: "error", error: "Internal server error" });
  }
};

// get rfp details
const getRfpDetails = async (req, res) => {
  try {
    const { id } = req.params;

    // if RFP exists
    const rfp = await Rfp.findOne({ where: { id } });
    if (!rfp) {
      return res
        .status(404)
        .json({ response: "error", error: "Invalid RFP ID" });
    }

    // categories
    const rfpCategories = await RfpCategory.findAll({ where: { rfp_id: id } });
    const categoryIds = rfpCategories.map((rc) => rc.category_id);

    // vendors
    const rfpVendors = await RfpVendor.findAll({ where: { rfp_id: id } });
    const vendorIds = rfpVendors.map((rv) => rv.vendor_id);

    return res.status(200).json({
      response: "success",
      rfp: {
        ...rfp.dataValues,
        categories: categoryIds,
        vendors: vendorIds,
      },
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ response: "error", error: "Internal server error" });
  }
};

// get all rfps
const getAllRfps = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const { limit: parsedLimit, offset } = getPagination(page, limit);

    const data = await Rfp.findAndCountAll({
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

// get rfp quotes
const getRfpQuotes = async (req, res) => {
  try {
    const { id } = req.params;
    const { page, limit } = req.query;
    const { limit: parsedLimit, offset } = getPagination(page, limit);

    // if RFP exists
    const rfp = await Rfp.findOne({ where: { id } });
    if (!rfp) {
      return res
        .status(404)
        .json({ response: "error", error: "Invalid RFP ID" });
    }

    // quotes with vendor details
    const data = await RfpVendor.findAndCountAll({
      where: { rfp_id: id, applied: true },
      include: [
        {
          model: User,
          attributes: ["id", "firstname", "lastname", "email", "mobile"],
        },
      ],
      limit: parsedLimit,
      offset,
    });

    if (data.count === 0) {
      return res
        .status(404)
        .json({ response: "error", error: "No quotes available" });
    }

    const quotes = data.rows.map((row) => ({
      vendor_id: row.vendor_id,
      name: row.User.firstname + " " + row.User.lastname,
      email: row.User.email,
      mobile: row.User.mobile,
      item_price: row.item_price,
      total_cost: row.total_cost,
      item_name: rfp.item_name,
      rfp_no: rfp.rfp_no,
    }));

    const response = getPagingData(
      { count: data.count, rows: quotes },
      page,
      parsedLimit,
    );

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

// close rfp
const closeRfp = async (req, res) => {
  try {
    const { id } = req.params;

    // if RFP exists
    const rfp = await Rfp.findOne({ where: { id } });
    if (!rfp) {
      return res
        .status(404)
        .json({ response: "error", error: "Invalid RFP ID" });
    }

    // if RFP is already closed
    if (rfp.status === "closed") {
      return res
        .status(400)
        .json({ response: "error", message: "RFP is already closed" });
    }

    // now status to closed
    await Rfp.update({ status: "closed" }, { where: { id } });

    return res.status(200).json({ response: "success", message: "RFP closed" });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ response: "error", error: "Internal server error" });
  }
};

module.exports = {
  createRfp,
  updateRfp,
  getRfpDetails,
  getAllRfps,
  getRfpQuotes,
  closeRfp,
};
