const express = require("express");
const router = express.Router();
const controller = require("../Controller/Subsubcategory");
const { createCloudinaryUploader } = require("../utils/cloudinaryConfig");

// ✅ Cloudinary-backed multer uploader
const upload = createCloudinaryUploader(
    "subsubcategory",               // folder
    "image",                        // resource_type
    ["jpg", "jpeg", "png", "webp"]  // allowed formats
);



router.post(
    "/createsubsubcategory",
    upload.single("subsubcategoryImage"),
    controller.createSubSubcategory
);

router.get("/getallsubsubcategory", controller.getAllSubSubcategories);

router.put(
    "/updatesubsubcategory/:id",
    upload.single("subsubcategoryImage"),
    controller.updateSubSubcategory
);

router.delete("/deletesubsubcategory/:id", controller.deleteSubSubcategory);
router.get(
    "/subcategory/:subcategoryId",
    controller.getSubSubcategoriesBySubcategory
);

module.exports = router;
