const express = require("express");
const router = express.Router();
const categoryController = require("../Controller/Category");
const { createCloudinaryUploader } = require("../utils/cloudinaryConfig");

// ✅ Cloudinary-backed multer uploader
const upload = createCloudinaryUploader(
    "category",  // folder
    "image"      // resource_type
);

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
