const express = require('express');
const router = express.Router();
const homeController = require("../controllers/homeController.ts")

router.post("/", homeController.fetchPractices);

module.exports = router;
