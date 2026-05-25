require("dotenv").config();
const express = require("express");
const { connectDB, sequelize } = require("./config/db");
require("./models/index");
const cors = require("cors");

const app = express();

app.use(express.json());
app.use(cors({
    origin: ['http://localhost:5173', 'http://tushar-rfp.veldev.com'],
    credentials: true
}))

app.use("/api", require("./routes/auth.routes"));
app.use("/api/rfp", require("./routes/rfp.routes"));
app.use("/api", require("./routes/category.routes"));
app.use("/api", require("./routes/vendor.routes"));
app.use("/api", require("./routes/password.routes"));

// global error handler
app.use((err, req, res, next) => {
  // handle invalid JSON body
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({
      response: "error",
      message: "Invalid JSON in request body",
    });
  }

  // actual global error handler
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error";
  return res.status(statusCode).json({
    response: "error",
    message,
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  await sequelize.sync({ alter: false });
  console.log("All tables synced");
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();

module.exports = app;
