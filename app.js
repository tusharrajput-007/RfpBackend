require("dotenv").config();
const express = require("express");
const { connectDB, sequelize } = require("./config/db");
require("./models/index");

const app = express();

app.use(express.json());

app.use("/api", require("./routes/auth.routes"));
app.use("/api/rfp", require("./routes/rfp.routes"));
app.use("/api", require("./routes/category.routes"));
app.use("/api", require("./routes/vendor.routes"));
app.use("/api", require("./routes/password.routes"));

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
