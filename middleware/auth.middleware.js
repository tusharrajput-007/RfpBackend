const jwt = require("jsonwebtoken");
const { User } = require("../models/index");

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      response: "error",
      message: "Authorization failed",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // check if user still exists in DB
    const user = await User.findOne({ where: { id: decoded.id } });
    if (!user) {
      return res.status(401).json({
        response: "error",
        message: "Authorization failed",
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      response: "error",
      message: "Authorization failed",
    });
  }
};

module.exports = { verifyToken };
