const express = require("express");
const router = express.Router();
const { createUploader } = require("../utils/cloudinaryConfig");
const controller = require("../Controller/Subsubcategory");

const upload = createUploader("indian_coffee/subsubcategories");

router.post("/createsubsubcategory", upload.single("subsubcategoryImage"), controller.createSubSubcategory);
router.get("/getallsubsubcategory", controller.getAllSubSubcategories);
router.put("/updatesubsubcategory/:id", upload.single("subsubcategoryImage"), controller.updateSubSubcategory);
router.delete("/deletesubsubcategory/:id", controller.deleteSubSubcategory);
router.get("/subcategory/:subcategoryId", controller.getSubSubcategoriesBySubcategory);

module.exports = router;
