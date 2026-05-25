require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const { connectDB, sequelize } = require("./config/db");
require("./models/index");
const cors = require("cors");
const logger = require("./utils/logger");

const app = express();

app.use(express.json());
app.use(cors({
    origin: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['http://localhost:5173'],
    credentials: true
}))

// Morgan HTTP request logging — streams to Winston
app.use(morgan('combined', {
    stream: {
        write: (message) => logger.info(message.trim())
    }
}))

app.use("/api", require("./routes/auth.routes"));
app.use("/api/rfp", require("./routes/rfp.routes"));
app.use("/api", require("./routes/category.routes"));
app.use("/api", require("./routes/vendor.routes"));
app.use("/api", require("./routes/password.routes"));

// global error handler
app.use((err, req, res, next) => {
    // log the error
    logger.error(`${err.message} - ${req.method} ${req.originalUrl}`)

    // handle invalid JSON body
    if (err.type === "entity.parse.failed") {
        return res.status(400).json({
            response: "error",
            message: "Invalid JSON in request body",
        });
    }

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