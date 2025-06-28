const express = require('express');
const router = express.Router();
const practiceController = require("../controllers/practiceController.ts")

router.post("/", practiceController.createPractice);

module.exports = router;
