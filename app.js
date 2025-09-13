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

// Global error handler
app.use(errorHandler);
module.exports = app;
