// app.js
require("dotenv").config();
const express = require("express");
const app = express();

app.use(express.json());

const userRoutes = require("./routes/users.routes");
app.use("/users", userRoutes);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

module.exports = app;
