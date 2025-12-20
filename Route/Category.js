const express = require("express");
const router = express.Router();
const categoryController = require("../Controller/Category");

const multer = require("multer");

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/category");
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

let upload = multer({ storage });

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
