const express = require("express");
const router = express.Router();
const controller = require("../Controller/Product");
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/products/");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

const upload = multer({ storage });

router.post("/createproduct", upload.single("productImage"), controller.createProduct);

router.get("/getallproducts", controller.getAllProducts);

router.put("/updateproduct/:id", upload.single("productImage"), controller.updateProduct);

router.delete("/deleteproduct/:id", controller.deleteProduct);
router.get("/getbyid/:id", controller.getProductById);
router.put("/updateproductstatus/:id", controller.updateProductStatus);
router.get("/getactiveproducts", controller.getActiveProducts);
router.get("/getinactiveproducts", controller.getInactiveProducts);
router.get(
    "/product/subcategory/:subcategoryId",
    controller.getProductsBySubcategory
);

router.get(
    "/product/subsubcategory/:subsubcategoryId",
    controller.getProductsBySubSubcategory
);

module.exports = router;
