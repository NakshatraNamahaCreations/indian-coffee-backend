const express = require("express");
const router = express.Router();
const categoryController = require("../Controller/Category");
const { createUploader } = require("../utils/cloudinaryConfig");

// Uploads to Cloudinary folder "categories"
const upload = createUploader("categories", "image");

// ---------------- ROUTES ---------------- //

router.post(
    "/createcategory",
    upload.single("Categoryimage"),
    categoryController.createCategory
);

router.get(
    "/getallcategory",
    categoryController.getAllCategory
);

router.put(
    "/updatecategory/:id",
    upload.single("Categoryimage"),
    categoryController.updateCategory
);

router.delete(
    "/deletecategory/:id",
    categoryController.deleteCategory
);

// Export router only
module.exports = router;
