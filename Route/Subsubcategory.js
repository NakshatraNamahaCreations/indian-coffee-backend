const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const controller = require("../Controller/Subsubcategory");

const uploadDir = path.join(process.cwd(), "uploads/subsubcategory");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `subsubcategory-${Date.now()}${ext}`);
    },
});

const upload = multer({ storage });

router.post("/createsubsubcategory", upload.single("subsubcategoryImage"), controller.createSubSubcategory);
router.get("/getallsubsubcategory", controller.getAllSubSubcategories);
router.put("/updatesubsubcategory/:id", upload.single("subsubcategoryImage"), controller.updateSubSubcategory);
router.delete("/deletesubsubcategory/:id", controller.deleteSubSubcategory);
router.get("/subcategory/:subcategoryId", controller.getSubSubcategoriesBySubcategory);

module.exports = router;
