const express = require("express");
const router = express.Router();
const { createCloudinaryUploader } = require("../utils/cloudinaryConfig");
const subcategoryController = require("../Controller/Subcategory");

// ✅ Cloudinary-backed multer uploader
const upload = createCloudinaryUploader(
    "subcategory",  // folder
    "image"         // resource_type
);

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
