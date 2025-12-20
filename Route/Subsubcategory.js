const express = require("express");
const router = express.Router();
const controller = require("../Controller/Subsubcategory");
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/subsubcategory/");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

const fileFilter = (req, file, cb) => {
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Only image files allowed"), false);
    }
};

const upload = multer({
    storage,
    fileFilter
});



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
