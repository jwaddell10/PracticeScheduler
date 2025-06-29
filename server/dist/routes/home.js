"use strict";
const express = require('express');
const router = express.Router();
const homeController = require("../controllers/homeController.ts");
router.get("/", homeController.fetchPractices);
module.exports = router;
