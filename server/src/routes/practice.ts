const express = require('express');
const router = express.Router();
const practiceController = require("../controllers/practiceController")

router.post("/", practiceController.createPractice);

module.exports = router;
