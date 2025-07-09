const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const https = require("https");
const fs = require("node:fs");

const practiceRouter = require("./routes/practice.ts");
const homeRouter = require("./routes/home.ts");
const drillRouter = require("./routes/drill.ts")
require('dotenv').config();

const app = express();
// const PORT = parseInt(process.env.PORT || "3000", 10);

// Middleware
app.use(cors("*"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Routes
app.get("/", (req, res) => {
	res.json({ message: "Server is running" });
});
app.use("/home", homeRouter);
app.use("/practice", practiceRouter);
app.use("/drill", drillRouter)

// SSL Options

const PORT = process.env.PORT;
const HOST = process.env.LOCAL_IP;

app.listen(PORT, HOST, () => {
  console.log(`Server is running on http://${HOST}:${PORT}`);
});

// Start HTTPS Server
// const options = {
//   key: fs.readFileSync('./localhost+1-key.pem'),
//   cert: fs.readFileSync('./localhost+1.pem')
// };

// https.createServer(options, app).listen(PORT, `${process.env.LOCAL_IP}`, () => {
//   console.log(`HTTPS server running at https://192.168.0.17:${PORT}`);
// });

module.exports = app;
