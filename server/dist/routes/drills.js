"use strict";
const express = require('express');
const router = express();
const drillController = require("../controllers/drillController.ts");
router.post("/", drillController.fetchPractices);
module.exports = router;
