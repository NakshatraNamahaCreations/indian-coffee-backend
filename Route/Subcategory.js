const express = require("express");
const router = express.Router();
const multer = require("multer");
const subcategoryController = require("../Controller/Subcategory");

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/subcategory");
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

const upload = multer({ storage });

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
