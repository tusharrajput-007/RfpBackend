const {
  User,
  VendorDetail,
  VendorCategory,
  Category,
} = require("../models/index");
const { getPagination, getPagingData } = require("../utils/pagination");
const asyncWrapper = require("../utils/asyncWrapper");
const AppError = require("../utils/AppError");
const { sendEmail } = require("../utils/email");
const { validateRequiredFields } = require("../utils/validators");
const { Op } = require("sequelize");

// get all vendors
const getVendors = asyncWrapper(async (req, res) => {
  const { page, limit, name, status } = req.query;
  const { limit: parsedLimit, offset } = getPagination(page, limit);

  // vendor detail where clause for status filter
  const vendorDetailWhere = {};
  if (status) vendorDetailWhere.status = status;

  // user where clause for name filter
  const userWhere = { user_type: "vendor" };
  if (name)
    userWhere[Op.or] = [
      { firstname: { [Op.like]: `%${name}%` } },
      { lastname: { [Op.like]: `%${name}%` } },
    ];

  const data = await User.findAndCountAll({
    where: userWhere,
    attributes: ["id", "firstname", "lastname", "email", "mobile"],
    include: [
      {
        model: VendorDetail,
        attributes: ["no_of_employees", "status"],
        where: vendorDetailWhere,
      },
    ],
    limit: parsedLimit,
    offset,
  });

  const vendors = data.rows.map((row) => ({
    user_id: row.id,
    name: row.firstname + " " + row.lastname,
    email: row.email,
    mobile: row.mobile,
    no_of_employees: row.VendorDetail.no_of_employees,
    status: row.VendorDetail.status,
  }));

  const response = getPagingData(
    { count: data.count, rows: vendors },
    page,
    parsedLimit,
  );

  return res.status(200).json({
    response: "success",
    message: "Vendors fetched successfully",
    ...response,
  });
});

// get vendors by category id
const getVendorsByCategory = asyncWrapper(async (req, res) => {
  const { categoryId } = req.params;
  const { page, limit } = req.query;
  const { limit: parsedLimit, offset } = getPagination(page, limit);

  // check if category exists
  const category = await Category.findOne({ where: { id: categoryId } });
  if (!category) throw new AppError("No category exist", 404);

  // fetch vendors by category
  const data = await VendorCategory.findAndCountAll({
    where: { category_id: categoryId },
    include: [
      {
        model: User,
        attributes: ["id", "firstname", "lastname", "email", "mobile"],
        include: [
          {
            model: VendorDetail,
            attributes: ["no_of_employees", "status"],
          },
        ],
      },
    ],
    limit: parsedLimit,
    offset,
  });

  const vendors = data.rows.map((row) => ({
    user_id: row.User.id,
    name: row.User.firstname + " " + row.User.lastname,
    email: row.User.email,
    mobile: row.User.mobile,
    no_of_employees: row.User.VendorDetail.no_of_employees,
    status: row.User.VendorDetail.status,
  }));

  const response = getPagingData(
    { count: data.count, rows: vendors },
    page,
    parsedLimit,
  );

  return res.status(200).json({
    response: "success",
    message: data.count === 0 ? "No vendors mapped with the category." : "Vendors fetched successfully",
    ...response,
  });
});

// approve vendor
const approveVendor = asyncWrapper(async (req, res) => {
  const { user_id, status } = req.body;

  // Required field validations
  const requiredError = validateRequiredFields({
    "User ID": user_id,
    Status: status,
  });
  if (requiredError) throw new AppError(requiredError, 400);

  // validate status
  if (!["pending", "approved", "rejected"].includes(status)) {
    throw new AppError(
      "Select valid status (pending, approved, rejected)",
      400,
    );
  }

  // check if vendor exists
  const vendor = await User.findOne({
    where: { id: user_id, user_type: "vendor" },
  });
  if (!vendor) throw new AppError("User not exist", 404);

  // update status
  await VendorDetail.update({ status }, { where: { user_id } });

  // send email notification
  try {
    await sendEmail(
      vendor.email,
      "RFP System Account Update",
      `<p>Hi ${vendor.firstname},</p>
            <p>Your account status has been updated to <strong>${status}</strong>.</p>
            <p>Thanks,<br/>Velocity RFP System</p>`,
    );
  } catch (emailError) {
    console.error("Email failed:", emailError);
  }

  return res.status(200).json({
    response: "success",
    message: `Vendor status updated to ${status} successfully`,
    id: parseInt(user_id),
  });
});

module.exports = { getVendors, getVendorsByCategory, approveVendor };
