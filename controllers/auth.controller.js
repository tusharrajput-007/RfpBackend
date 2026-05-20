const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User, VendorDetail } = require("../models/index");

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

module.exports = { login, registerAdmin };
