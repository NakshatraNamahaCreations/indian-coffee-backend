const express = require("express");
const router = express.Router();
const controller = require("../Controller/Subsubcategory");
const { createUploader } = require("../utils/cloudinaryConfig");

// Uploads to Cloudinary folder "subsubcategories"
const upload = createUploader(
    "subsubcategories",
    "image",
    ["jpg", "jpeg", "png", "webp"]
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
