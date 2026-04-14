const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const categoryController = require("../Controller/Category");

const uploadDir = path.join(process.cwd(), "uploads/category");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `category-${Date.now()}${ext}`);
    },
});

const upload = multer({ storage });

router.post("/createcategory", upload.single("Categoryimage"), categoryController.createCategory);
router.get("/getallcategory", categoryController.getAllCategory);
router.put("/updatecategory/:id", upload.single("Categoryimage"), categoryController.updateCategory);
router.delete("/deletecategory/:id", categoryController.deleteCategory);

module.exports = router;
