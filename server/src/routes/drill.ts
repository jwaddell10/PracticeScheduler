const express = require('express');
const router = express.Router();
const drillController = require("../controllers/drillController.ts")
const authenticateUser = require("../middleware/authMiddleware.ts");
// console.log(authenticateUser, 'auth user')
router.get("/", drillController.fetchDrills);
router.post("/create", authenticateUser, drillController.createDrill);

module.exports = router;
