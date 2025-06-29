"use strict";
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const https = require("https");
const fs = require("node:fs");
const practiceRouter = require("./routes/practice.ts");
const homeRouter = require("./routes/home.ts");
dotenv.config();
const app = express();
const PORT = parseInt(process.env.PORT || "3000", 10);
// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
// Routes
app.get("/", (req, res) => {
    res.json({ message: "Server is running" });
});
app.use("/home", homeRouter);
app.use("/practice", practiceRouter);
// SSL Options
const options = {
    key: fs.readFileSync("./keyFile.key"),
    cert: fs.readFileSync("./certFile.crt"),
};
// Start HTTPS Server
https.createServer(options, app).listen(PORT, () => {
    console.log(`✅ HTTPS server running at https://localhost:${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
});
// Do not call app.listen()
module.exports = app;
