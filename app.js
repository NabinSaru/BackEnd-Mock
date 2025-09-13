// app.js
require("dotenv").config();
const express = require("express");
const app = express();
const errorHandler = require('./middleware/error.middleware');

// Middleware
app.use(express.json());

// Routes
app.get("/", (req, res) => {
  res.send("Server is listening...");
});

const authRoutes = require("./routes/auth.routes");
app.use("/auth", authRoutes);

// Protected routes
const profileRoutes = require("./routes/profile.routes");
app.use("/profile", profileRoutes);

// rbac routes
const dashboardRoutes = require("./routes/dashboard.routes");
app.use("/dashboard", dashboardRoutes);

// Global error handler
app.use(errorHandler);
module.exports = app;
