const express = require("express");
const router = express.Router();
const homeController = require("../controllers/homeController.ts");

router.get("/", homeController.fetchPractices);
router.delete("/:id/delete", homeController.deletePractice);

module.exports = router;
