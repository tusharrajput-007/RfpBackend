const bcrypt = require("bcryptjs");
const { User, Otp } = require("../models/index");
const {
  validateRequiredFields,
  validateEmail,
} = require("../utils/validators");
const asyncWrapper = require("../utils/asyncWrapper");
const AppError = require("../utils/AppError");
const { sendEmail } = require("../utils/email");

// reset password
const resetPassword = asyncWrapper(async (req, res) => {
  const { email, old_password, new_password } = req.body;

  // Required field validations
  const requiredError = validateRequiredFields({
    Email: email,
    "Old password": old_password,
    "New password": new_password,
  });
  if (requiredError) throw new AppError(requiredError, 400);

  // email format validation
  const emailError = validateEmail(email);
  if (emailError) throw new AppError(emailError, 400);

  // check if email exists
  const user = await User.findOne({ where: { email } });
  if (!user) throw new AppError("Invalid credentials", 401);

  // compare old password
  const isMatch = await bcrypt.compare(old_password, user.password);
  if (!isMatch) throw new AppError("Invalid credentials", 401);

  // hash new password
  const hashedPassword = await bcrypt.hash(new_password, 10);

  // update password
  await User.update({ password: hashedPassword }, { where: { email } });

  return res.status(200).json({
    response: "success",
    message: "Password reset successfully",
    id: user.id,
  });
});

// forgot password
const forgotPassword = asyncWrapper(async (req, res) => {
  const { email } = req.body;

  // Required field validations
  const requiredError = validateRequiredFields({ Email: email });
  if (requiredError) throw new AppError(requiredError, 400);

  // email format validation
  const emailError = validateEmail(email);
  if (emailError) throw new AppError(emailError, 400);

  // check if email exists
  const user = await User.findOne({ where: { email } });
  if (!user) throw new AppError("Invalid credentials", 401);

  // generate 4 digit OTP
  const otp = Math.floor(1000 + Math.random() * 9000).toString();

  // save OTP in otps table
  await Otp.create({ email, otp });

  // send OTP email
  try {
    await sendEmail(
      email,
      "RFP System - Password Reset OTP",
      `<p>Hi ${user.firstname},</p>
            <p>Your OTP for password reset is: <strong>${otp}</strong></p>
            <p>This OTP is valid for 10 minutes.</p>
            <p>Thanks,<br/>Velocity RFP System</p>`,
    );
  } catch (emailError) {
    console.error("Email failed:", emailError);
  }

  return res.status(200).json({
    response: "success",
    message: "OTP sent to your email address",
    id: user.id,
  });
});

// confirm otp
const confirmOtp = asyncWrapper(async (req, res) => {
  const { email, otp } = req.body;

  // Required field validations
  const requiredError = validateRequiredFields({ Email: email, OTP: otp });
  if (requiredError) throw new AppError(requiredError, 400);

  // email format validation
  const emailError = validateEmail(email);
  if (emailError) throw new AppError(emailError, 400);

  // check if email exists
  const user = await User.findOne({ where: { email } });
  if (!user) throw new AppError("Invalid credentials", 401);

  // fetch OTP from db
  const otpRecord = await Otp.findOne({ where: { email, otp } });
  if (!otpRecord) throw new AppError("Invalid OTP", 400);

  // check if OTP is expired (10 minutes)
  const otpCreatedAt = new Date(otpRecord.createdAt);
  const now = new Date();
  const diffInMinutes = (now - otpCreatedAt) / 1000 / 60;
  if (diffInMinutes > 10) {
    await Otp.destroy({ where: { email } });
    throw new AppError("OTP has expired. Please request a new one.", 400);
  }

  // delete OTP after successful verification
  await Otp.destroy({ where: { email } });

  return res.status(200).json({
    response: "success",
    message: "OTP verified successfully",
    id: user.id,
  });
});

module.exports = { resetPassword, forgotPassword, confirmOtp };
