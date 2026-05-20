const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
  User,
  VendorDetail,
  Category,
  VendorCategory,
} = require("../models/index");
const { sendEmail } = require("../utils/email");

// login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email) {
      return res.status(400).json({
        response: "error",
        error: "Email is required",
      });
    }
    if (!password) {
      return res.status(400).json({
        response: "error",
        error: "Password is required",
      });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({
        response: "error",
        error: "Invalid credentials",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        response: "error",
        error: "Invalid credentials",
      });
    }

    // Vendor status check
    if (user.user_type === "vendor") {
      const vendorDetail = await VendorDetail.findOne({
        where: { user_id: user.id },
      });
      if (vendorDetail.status !== "approved") {
        return res.status(400).json({
          response: "error",
          error: "Account status Pending",
        });
      }
    }

    const token = jwt.sign(
      { id: user.id, user_type: user.user_type },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    return res.status(200).json({
      response: "success",
      user_id: user.id,
      type: user.user_type,
      name: user.firstname + " " + user.lastname,
      email: user.email,
      token,
    });
  } catch (error) {
    return res.status(500).json({
      response: "error",
      error: "Internal server error",
    });
  }
};

// register admin
const registerAdmin = async (req, res) => {
  try {
    const { firstname, lastname, email, password, mobile } = req.body;

    // Validation
    if (!firstname) {
      return res.status(400).json({
        response: "error",
        error: "Firstname is required",
      });
    }
    if (!lastname) {
      return res.status(400).json({
        response: "error",
        error: "Last name is required",
      });
    }
    if (!email) {
      return res.status(400).json({
        response: "error",
        error: "Email is required",
      });
    }
    if (!password) {
      return res.status(400).json({
        response: "error",
        error: "Password is required",
      });
    }
    if (!mobile) {
      return res.status(400).json({
        response: "error",
        error: "Mobile is required",
      });
    }

    // checks
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        response: "error",
        error: "User already exist.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      firstname,
      lastname,
      email,
      password: hashedPassword,
      mobile,
      user_type: "admin",
    });

    return res.status(201).json({
      response: "success",
    });
  } catch (error) {
    return res.status(500).json({
      response: "error",
      error: "Internal server error",
    });
  }
};

// register vendor
const registerVendor = async (req, res) => {
  try {
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

    // Basic validations
    if (!firstname) {
      return res
        .status(400)
        .json({ response: "error", error: "Firstname is required" });
    }
    if (!lastname) {
      return res
        .status(400)
        .json({ response: "error", error: "Last name is required" });
    }
    if (!email) {
      return res
        .status(400)
        .json({ response: "error", error: "Email is required" });
    }
    if (!password) {
      return res
        .status(400)
        .json({ response: "error", error: "Password is required" });
    }
    if (!mobile) {
      return res
        .status(400)
        .json({ response: "error", error: "Mobile is required" });
    }
    if (!revenue) {
      return res
        .status(400)
        .json({ response: "error", error: "Revenue is required" });
    }
    if (!no_of_employees) {
      return res
        .status(400)
        .json({ response: "error", error: "No. of employee is required" });
    }
    if (!pancard_no) {
      return res
        .status(400)
        .json({ response: "error", error: "Pan card is required" });
    }
    if (!gst_no) {
      return res
        .status(400)
        .json({ response: "error", error: "GST number is required" });
    }
    if (!categories || !Array.isArray(categories) || categories.length === 0) {
      return res
        .status(400)
        .json({ response: "error", error: "Category is required" });
    }

    // Format validations
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res
        .status(400)
        .json({ response: "error", error: "Enter valid email." });
    }

    const mobileRegex = /^[0-9]{10}$/;
    if (!mobileRegex.test(mobile)) {
      return res
        .status(400)
        .json({ response: "error", error: "Enter a valid mobile no." });
    }

    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(pancard_no)) {
      return res
        .status(400)
        .json({ response: "error", error: "Enter a valid PAN card no." });
    }

    const gstRegex =
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!gstRegex.test(gst_no)) {
      return res
        .status(400)
        .json({ response: "error", error: "Enter a valid GST number." });
    }

    const revenueArray = revenue.split(",");
    if (revenueArray.length !== 3) {
      return res
        .status(400)
        .json({ response: "error", error: "Enter last three years revenue." });
    }

    const revenueData = revenueArray.map((r) => parseInt(r.trim()));
    if (revenueData.some((r) => isNaN(r))) {
      return res
        .status(400)
        .json({ response: "error", error: "Enter valid revenue values." });
    }

    // email check in db
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res
        .status(400)
        .json({ response: "error", error: "User already exist." });
    }

    // now we check if all categories that came are valid or not
    const validCategories = await Category.findAll({
      where: { id: categories },
    });
    if (validCategories.length !== categories.length) {
      return res
        .status(400)
        .json({ response: "error", error: "Select valid categories." });
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
      user_id: user.id, // comes from the user we just created
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

    return res.status(201).json({ response: "success" });
  } catch (error) {
    return res
      .status(500)
      .json({ response: "error", error: "Internal server error" });
  }
};

// logout
const logout = (req, res) => {
  return res.status(200).json({
    response: "success",
    message: "Logged out successfully",
  });
};

module.exports = { login, registerAdmin, registerVendor, logout };
