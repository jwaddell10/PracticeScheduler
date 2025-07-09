const express = require('express');
const router = express.Router();
const drillController = require("../controllers/drillController.ts")

router.get("/", drillController.fetchDrills);

module.exports = router;
