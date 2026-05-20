const isVendor = (req, res, next) => {
  if (req.user.user_type !== "vendor") {
    return res.status(403).json({
      response: "error",
      message: "Action not allowed",
    });
  }
  next();
};

module.exports = { isVendor };
