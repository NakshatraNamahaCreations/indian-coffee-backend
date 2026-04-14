const express = require("express");
const router = express.Router();
const { createUploader } = require("../utils/cloudinaryConfig");
const categoryController = require("../Controller/Category");

const upload = createUploader("indian_coffee/categories");

router.post("/createcategory", upload.single("Categoryimage"), categoryController.createCategory);
router.get("/getallcategory", categoryController.getAllCategory);
router.put("/updatecategory/:id", upload.single("Categoryimage"), categoryController.updateCategory);
router.delete("/deletecategory/:id", categoryController.deleteCategory);

module.exports = router;
