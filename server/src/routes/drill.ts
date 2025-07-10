const express = require('express');
const router = express.Router();
const drillController = require("../controllers/drillController.ts")

router.get("/", drillController.fetchDrills);
router.post("/create", drillController.createDrill);

module.exports = router;
