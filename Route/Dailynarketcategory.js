const express = require("express");
const router = express.Router();

const {
    createCategory,
    getAllCategories,
    updateCategory,
    deleteCategory,
} = require("../Controller/Dailynarketcategory");

router.post("/create", createCategory);
router.get("/getall", getAllCategories);
router.put("/update/:id", updateCategory);
router.delete("/delete/:id", deleteCategory);

module.exports = router;
