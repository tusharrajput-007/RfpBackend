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
const {
  validateRequiredFields,
  validateFutureDate,
  validateQuantity,
  validatePriceRange,
} = require("../utils/validators");
const asyncWrapper = require("../utils/asyncWrapper");
const AppError = require("../utils/AppError");

// create rfp
const createRfp = asyncWrapper(async (req, res) => {
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

  // Required field validations
  const requiredError = validateRequiredFields({
    "Item name": item_name,
    "RFP number": rfp_no,
    Quantity: quantity,
    "Last date": last_date,
    "Minimum price": minimum_price,
    "Maximum price": maximum_price,
    "Item description": item_description,
  });
  if (requiredError) throw new AppError(requiredError, 400);

  // Categories and vendors
  if (!categories || !Array.isArray(categories) || categories.length === 0) {
    throw new AppError("Categories are required", 400);
  }
  if (!vendors || !Array.isArray(vendors) || vendors.length === 0) {
    throw new AppError("Vendors are required", 400);
  }

  // Quantity validation
  const quantityError = validateQuantity(quantity);
  if (quantityError) throw new AppError(quantityError, 400);

  // Price range validation
  const priceError = validatePriceRange(minimum_price, maximum_price);
  if (priceError) throw new AppError(priceError, 400);

  // we check if rfp_no already exists
  const existingRfp = await Rfp.findOne({ where: { rfp_no } });
  if (existingRfp) throw new AppError("RFP number already exists.", 400);

  // Date validation
  const dateError = validateFutureDate(last_date);
  if (dateError) throw new AppError(dateError, 400);

  // we validate categories exist
  const validCategories = await Category.findAll({ where: { id: categories } });
  if (validCategories.length !== categories.length) {
    throw new AppError("Select valid categories.", 400);
  }

  // then validate vendors exist
  const validVendors = await User.findAll({
    where: { id: vendors, user_type: "vendor" },
  });
  if (validVendors.length !== vendors.length) {
    throw new AppError("Select valid Vendors.", 400);
  }

  // we also validate if all vendors are approved (only existence won't be enough)
  const approvedVendors = await VendorDetail.findAll({
    where: { user_id: vendors, status: "approved" },
  });
  if (approvedVendors.length !== vendors.length) {
    throw new AppError("Select valid and approved vendors.", 400);
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

  return res.status(201).json({
    response: "success",
    message: "RFP created successfully",
    id: rfp.id,
  });
});

// update rfp
const updateRfp = asyncWrapper(async (req, res) => {
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

  // Required field validations
  const requiredError = validateRequiredFields({
    "Item name": item_name,
    "RFP number": rfp_no,
    Quantity: quantity,
    "Last date": last_date,
    "Minimum price": minimum_price,
    "Maximum price": maximum_price,
    "Item description": item_description,
  });
  if (requiredError) throw new AppError(requiredError, 400);

  // Categories and vendors
  if (!categories || !Array.isArray(categories) || categories.length === 0) {
    throw new AppError("Categories are required", 400);
  }
  if (!vendors || !Array.isArray(vendors) || vendors.length === 0) {
    throw new AppError("Vendors are required", 400);
  }

  // Quantity validation
  const quantityError = validateQuantity(quantity);
  if (quantityError) throw new AppError(quantityError, 400);

  // Price range validation
  const priceError = validatePriceRange(minimum_price, maximum_price);
  if (priceError) throw new AppError(priceError, 400);

  // if RFP exists
  const rfp = await Rfp.findOne({ where: { id } });
  if (!rfp) throw new AppError("Invalid RFP ID", 404);

  // if RFP is closed
  if (rfp.status === "closed") throw new AppError("RFP is closed", 400);

  // Check if any vendor has already applied
  const quotesExist = await RfpVendor.findOne({
    where: { rfp_id: id, applied: true },
  });
  if (quotesExist) {
    throw new AppError(
      "Cannot update RFP as quotes have already been submitted. Please create a new RFP.",
      400,
    );
  }

  // check if rfp_no already exists for a different RFP
  const existingRfp = await Rfp.findOne({ where: { rfp_no } });
  if (existingRfp && existingRfp.id !== parseInt(id)) {
    throw new AppError("RFP number already exists.", 400);
  }

  // Date validation
  const dateError = validateFutureDate(last_date);
  if (dateError) throw new AppError(dateError, 400);

  // all categories should exist
  const validCategories = await Category.findAll({ where: { id: categories } });
  if (validCategories.length !== categories.length) {
    throw new AppError("Select valid categories.", 400);
  }

  // all vendors should exist
  const validVendors = await User.findAll({
    where: { id: vendors, user_type: "vendor" },
  });
  if (validVendors.length !== vendors.length) {
    throw new AppError("Select valid Vendors.", 400);
  }

  // all vendors should be approved
  const approvedVendors = await VendorDetail.findAll({
    where: { user_id: vendors, status: "approved" },
  });
  if (approvedVendors.length !== vendors.length) {
    throw new AppError("Select valid and approved vendors.", 400);
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
        <p>An RFP you were assigned to has been updated. Please login and review the new details and submit your quote.</p>
        <p>RFP Name: ${item_name}</p>
        <p>End Date: ${last_date}</p>
        <p>Thanks,<br/>Velocity RFP System</p>`,
      );
    } catch (emailError) {
      console.error("Email failed for vendor:", vendor.email, emailError);
    }
  }

  return res.status(200).json({
    response: "success",
    message: "RFP updated successfully",
    id: parseInt(id),
  });
});

// get rfp details
const getRfpDetails = asyncWrapper(async (req, res) => {
  const { id } = req.params;

  // if RFP exists
  const rfp = await Rfp.findOne({ where: { id } });
  if (!rfp) throw new AppError("Invalid RFP ID", 404);

  // categories
  const rfpCategories = await RfpCategory.findAll({ where: { rfp_id: id } });
  const categoryIds = rfpCategories.map((rc) => rc.category_id);

  // vendors
  const rfpVendors = await RfpVendor.findAll({ where: { rfp_id: id } });
  const vendorIds = rfpVendors.map((rv) => rv.vendor_id);

  return res.status(200).json({
    response: "success",
    message: "RFP fetched successfully",
    data: {
      ...rfp.dataValues,
      categories: categoryIds,
      vendors: vendorIds,
    },
  });
});

// get all rfps
const getAllRfps = asyncWrapper(async (req, res) => {
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
    message: "RFPs fetched successfully",
    ...response,
  });
});

// get rfp quotes
const getRfpQuotes = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const { page, limit } = req.query;
  const { limit: parsedLimit, offset } = getPagination(page, limit);

  // if RFP exists
  const rfp = await Rfp.findOne({ where: { id } });
  if (!rfp) throw new AppError("Invalid RFP ID", 404);

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

  if (data.count === 0) throw new AppError("No quotes available", 404);

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
    message: "RFP quotes fetched successfully",
    ...response,
  });
});

// close rfp
const closeRfp = asyncWrapper(async (req, res) => {
  const { id } = req.params;

  // if RFP exists
  const rfp = await Rfp.findOne({ where: { id } });
  if (!rfp) throw new AppError("Invalid RFP ID", 404);

  // if RFP is already closed
  if (rfp.status === "closed") throw new AppError("RFP is already closed", 400);

  // now status to closed
  await Rfp.update({ status: "closed" }, { where: { id } });

  return res.status(200).json({
    response: "success",
    message: "RFP closed successfully",
    id: parseInt(id),
  });
});

// apply for rfp
const applyForRfp = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const { item_price, total_cost } = req.body;

  // Required field validations
  const requiredError = validateRequiredFields({
    "Item price": item_price,
    "Total cost": total_cost,
  });
  if (requiredError) throw new AppError(requiredError, 400);

  // item_price and total_cost should be positive
  if (parseFloat(item_price) <= 0)
    throw new AppError("Item price must be a positive number.", 400);
  if (parseFloat(total_cost) <= 0)
    throw new AppError("Total cost must be a positive number.", 400);

  // if RFP exists
  const rfp = await Rfp.findOne({ where: { id } });
  if (!rfp) throw new AppError("Invalid RFP ID", 404);

  // if RFP is open or not
  if (rfp.status === "closed") throw new AppError("RFP is closed.", 400);

  // check if current date is before last_date
  const today = new Date();
  const lastDate = new Date(rfp.last_date);
  if (today > lastDate)
    throw new AppError("RFP application deadline has passed.", 400);

  // check if vendor is assigned to this RFP
  const rfpVendor = await RfpVendor.findOne({
    where: { rfp_id: id, vendor_id: req.user.id },
  });
  if (!rfpVendor) throw new AppError("Action not allowed.", 403);

  // check if vendor has already applied
  if (rfpVendor.applied)
    throw new AppError("You have already applied for this RFP.", 400);

  // validate total_cost = item_price * quantity
  const expectedTotalCost = parseFloat(item_price) * rfp.quantity;
  if (parseFloat(total_cost) !== expectedTotalCost) {
    throw new AppError(
      `Total cost must equal item price multiplied by quantity (${item_price} * ${rfp.quantity} = ${expectedTotalCost}).`,
      400,
    );
  }

  // update rfp_vendors row
  await RfpVendor.update(
    {
      item_price: parseFloat(item_price),
      total_cost: parseFloat(total_cost),
      applied: true,
    },
    { where: { rfp_id: id, vendor_id: req.user.id } },
  );

  // send email to admin
  const admin = await User.findOne({ where: { id: rfp.admin_id } });
  try {
    await sendEmail(
      admin.email,
      "New Quote Submitted on RFP",
      `<p>Hi Admin,</p>
      <p>Vendor "${req.user.firstname}" has submitted a quote for the RFP named "${rfp.item_name}".</p>
      <p>Quote Price: Rs. ${item_price}</p>
      <p>Total Cost: Rs. ${total_cost}</p>
      <p>Quote Date: ${new Date().toLocaleDateString()}</p>
      <p>Thanks,<br/>Velocity RFP System</p>`,
    );
  } catch (emailError) {
    console.error("Email failed:", emailError);
  }

  return res.status(200).json({
    response: "success",
    message: "Quote submitted successfully",
    id: rfpVendor.id,
  });
});

// get rfps by vendor id
const getRfpsByVendor = asyncWrapper(async (req, res) => {
  const { userId } = req.params;
  const { page, limit } = req.query;
  const { limit: parsedLimit, offset } = getPagination(page, limit);

  // check if user exists
  const user = await User.findOne({
    where: { id: userId, user_type: "vendor" },
  });
  if (!user) throw new AppError("Invalid user ID", 404);

  // fetch rfps assigned to this vendor with full rfp details
  const data = await RfpVendor.findAndCountAll({
    where: { vendor_id: userId },
    include: [
      {
        model: Rfp,
        attributes: [
          "id",
          "item_name",
          "item_description",
          "rfp_no",
          "quantity",
          "last_date",
          "minimum_price",
          "maximum_price",
          "status",
        ],
      },
    ],
    limit: parsedLimit,
    offset,
  });

  if (data.count === 0) throw new AppError("No RFPs found", 404);

  const rfps = data.rows.map((row) => ({
    rfp_id: row.rfp_id,
    item_name: row.Rfp.item_name,
    item_description: row.Rfp.item_description,
    rfp_no: row.Rfp.rfp_no,
    quantity: row.Rfp.quantity,
    last_date: row.Rfp.last_date,
    minimum_price: row.Rfp.minimum_price,
    maximum_price: row.Rfp.maximum_price,
    status: row.Rfp.status,
    applied: row.applied,
    item_price: row.item_price,
    total_cost: row.total_cost,
  }));

  const response = getPagingData(
    { count: data.count, rows: rfps },
    page,
    parsedLimit,
  );

  return res.status(200).json({
    response: "success",
    message: "RFPs fetched successfully",
    ...response,
  });
});

module.exports = {
  createRfp,
  updateRfp,
  getRfpDetails,
  getAllRfps,
  getRfpQuotes,
  closeRfp,
  applyForRfp,
  getRfpsByVendor,
};
