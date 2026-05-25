const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
  User,
  VendorDetail,
  Category,
  VendorCategory,
} = require("../models/index");
const { sendEmail } = require("../utils/email");
const {
  validateRequiredFields,
  validateEmail,
  validateMobile,
  validatePAN,
  validateGST,
} = require("../utils/validators");
const asyncWrapper = require("../utils/asyncWrapper");
const AppError = require("../utils/AppError");

// login
const login = asyncWrapper(async (req, res) => {
  const { email, password } = req.body;

  // Validation
  const requiredError = validateRequiredFields({
    Email: email,
    Password: password,
  });
  if (requiredError) throw new AppError(requiredError, 400);

  const user = await User.findOne({ where: { email } });
  if (!user) throw new AppError("Invalid credentials", 401);

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new AppError("Invalid credentials", 401);

  // Vendor status check
  if (user.user_type === "vendor") {
    const vendorDetail = await VendorDetail.findOne({
      where: { user_id: user.id },
    });
    if (!vendorDetail)
      throw new AppError(
        "Vendor details not found. Please contact admin.",
        403,
      );
    if (vendorDetail.status !== "approved")
      throw new AppError("Account status Pending", 403);
  }

  const token = jwt.sign(
    { id: user.id, user_type: user.user_type },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN },
  );

  return res.status(200).json({
    response: "success",
    message: "Logged in successfully",
    id: user.id,
    type: user.user_type,
    name: user.firstname + " " + user.lastname,
    email: user.email,
    token,
  });
});

// register admin
const registerAdmin = asyncWrapper(async (req, res) => {
  const { firstname, lastname, email, password, mobile } = req.body;

  // Required field validations
  const requiredError = validateRequiredFields({
    Firstname: firstname,
    Lastname: lastname,
    Email: email,
    Password: password,
    Mobile: mobile,
  });
  if (requiredError) throw new AppError(requiredError, 400);

  // Format validations
  const emailError = validateEmail(email);
  if (emailError) throw new AppError(emailError, 400);

  const mobileError = validateMobile(mobile);
  if (mobileError) throw new AppError(mobileError, 400);

  // checks
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) throw new AppError("User already exist.", 400);

  // check if mobile already exists
  const existingMobile = await User.findOne({ where: { mobile } });
  if (existingMobile)
    throw new AppError("Mobile number already registered.", 400);

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    firstname,
    lastname,
    email,
    password: hashedPassword,
    mobile,
    user_type: "admin",
  });

  return res.status(201).json({
    response: "success",
    message: "Admin registered successfully",
    id: user.id,
  });
});

// register vendor
const registerVendor = asyncWrapper(async (req, res) => {
  const {
    firstname,
    lastname,
    email,
    password,
    mobile,
    revenue,
    no_of_employees,
    pancard_no,
    gst_no,
    categories,
  } = req.body;

  // Required field validations
  const requiredError = validateRequiredFields({
    Firstname: firstname,
    Lastname: lastname,
    Email: email,
    Password: password,
    Mobile: mobile,
    Revenue: revenue,
    Employees: no_of_employees,
    Pancard: pancard_no,
    GST: gst_no,
  });
  if (requiredError) throw new AppError(requiredError, 400);

  // Categories validation
  if (!categories || !Array.isArray(categories) || categories.length === 0) {
    throw new AppError("Category is required", 400);
  }

  // Format validations
  const emailError = validateEmail(email);
  if (emailError) throw new AppError(emailError, 400);

  const mobileError = validateMobile(mobile);
  if (mobileError) throw new AppError(mobileError, 400);

  const panError = validatePAN(pancard_no);
  if (panError) throw new AppError(panError, 400);

  const gstError = validateGST(gst_no);
  if (gstError) throw new AppError(gstError, 400);

  const revenueArray = revenue.split(",");
  if (revenueArray.length !== 3) {
    throw new AppError("Enter last three years revenue.", 400);
  }

  const revenueData = revenueArray.map((r) => parseInt(r.trim()));
  if (revenueData.some((r) => isNaN(r))) {
    throw new AppError("Enter valid revenue values.", 400);
  }

  // email check in db
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) throw new AppError("User already exist.", 400);

  // check if mobile already exists
  const existingMobile = await User.findOne({ where: { mobile } });
  if (existingMobile)
    throw new AppError("Mobile number already registered.", 400);

  // now we check if all categories that came are valid or not
  const validCategories = await Category.findAll({ where: { id: categories } });
  if (validCategories.length !== categories.length) {
    throw new AppError("Select valid categories.", 400);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  // user
  const user = await User.create({
    firstname,
    lastname,
    email,
    password: hashedPassword,
    mobile,
    user_type: "vendor",
  });

  // vendor details
  await VendorDetail.create({
    user_id: user.id,
    revenue: revenueData,
    no_of_employees,
    pancard_no,
    gst_no,
    status: "pending",
  });

  // vendor categories
  const vendorCategories = categories.map((category_id) => ({
    vendor_id: user.id,
    category_id,
  }));
  await VendorCategory.bulkCreate(vendorCategories);

  // confirmation email
  try {
    await sendEmail(
      email,
      "Welcome to RFP System",
      `<p>Hi ${firstname},</p>
      <p>Thanks for registering on our RFP System. We will review your details and approve your account shortly.</p>
      <p>Thanks,<br/>Velocity RFP System</p>`,
    );
  } catch (emailError) {
    console.error("Email failed:", emailError);
  }

  return res.status(201).json({
    response: "success",
    message: "Vendor registered successfully",
    id: user.id,
  });
});

// logout
const logout = asyncWrapper(async (req, res) => {
  return res.status(200).json({
    response: "success",
    message: "Logged out successfully",
  });
});

module.exports = { login, registerAdmin, registerVendor, logout };
