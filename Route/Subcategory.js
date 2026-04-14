const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const subcategoryController = require("../Controller/Subcategory");

const uploadDir = path.join(process.cwd(), "uploads/subcategory");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `subcategory-${Date.now()}${ext}`);
    },
});

const upload = multer({ storage });

router.post("/createsubcategory", upload.single("subcategoryImage"), subcategoryController.createSubcategory);
router.get("/getallsubcategory", subcategoryController.getAllSubcategories);
router.put("/updatesubcategory/:id", upload.single("subcategoryImage"), subcategoryController.updateSubcategory);
router.delete("/deletesubcategory/:id", subcategoryController.deleteSubcategory);
router.get("/category/:categoryId", subcategoryController.getSubcategoriesByCategory);

module.exports = router;
