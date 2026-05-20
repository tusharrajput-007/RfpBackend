const isAdmin = (req, res, next) => {
  if (req.user.user_type !== "admin") {
    return res.status(403).json({
      response: "error",
      message: "Action not allowed",
    });
  }
  next();
};

module.exports = { isAdmin };
