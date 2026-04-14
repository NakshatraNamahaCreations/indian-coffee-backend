const express = require("express");
const router = express.Router();
const subcategoryController = require("../Controller/Subcategory");
const { createUploader } = require("../utils/cloudinaryConfig");

// Uploads to Cloudinary folder "subcategories"
const upload = createUploader("subcategories", "image");

router.post(
    "/createsubcategory",
    upload.single("subcategoryImage"),
    subcategoryController.createSubcategory
);

router.get(
    "/getallsubcategory",
    subcategoryController.getAllSubcategories
);

router.put(
    "/updatesubcategory/:id",
    upload.single("subcategoryImage"),
    subcategoryController.updateSubcategory
);

router.delete(
    "/deletesubcategory/:id",
    subcategoryController.deleteSubcategory
);

router.get("/category/:categoryId", subcategoryController.getSubcategoriesByCategory);

module.exports = router;
