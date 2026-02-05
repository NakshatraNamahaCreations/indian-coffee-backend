// const express = require("express");
// const router = express.Router();
// const controller = require("../Controller/Product");
// const multer = require("multer");
// const path = require("path");



// const storage = multer.diskStorage({
//     destination: (req, file, cb) => cb(null, "uploads/products/"),
//     filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
// });

// const upload = multer({ storage });

// router.post("/createproduct", upload.array("productImages", 7), controller.createProduct);

// router.get("/getallproducts", controller.getAllProducts);

// router.put("/updateproduct/:id", upload.array("productImages", 7), controller.updateProduct);

// router.delete("/deleteproduct/:id", controller.deleteProduct);
// router.get("/getbyid/:id", controller.getProductById);
// router.put("/updateproductstatus/:id", controller.updateProductStatus);
// router.get("/getactiveproducts", controller.getActiveProducts);
// router.get("/getinactiveproducts", controller.getInactiveProducts);
// router.get(
//     "/product/subcategory/:subcategoryId",
//     controller.getProductsBySubcategory
// );

// router.get(
//     "/product/subsubcategory/:subsubcategoryId",
//     controller.getProductsBySubSubcategory
// );
// // Payment 99
// router.post("/lock-after-payment", controller.lockProductAfterPayment);
// router.get("/lock/:productId", controller.getProductLockStatus);
// router.get("/products/vendor/:vendorId", controller.getProductsByVendor);
// router.get("/products/vendoractive/:vendorId", controller.getProductsByVendordata);
// router.get("/products/search", controller.searchProducts);

// // Product Updated
// router.get("/featured", controller.getFeaturedProducts);
// router.put("/:id/featured-toggle", controller.toggleFeatureProduct);
// router.put("/:id/upload-product-file", uploadProductFile, controller.uploadProductFile);

// module.exports = router;

const express = require("express");
const router = express.Router();
const controller = require("../Controller/Product");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

/* =========================
   1) Multer for Product Images
========================= */

const imageStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/products/"),
    filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});

const uploadImages = multer({ storage: imageStorage });

/* =========================
   2) Multer for Product File (single)
========================= */

const fileDir = "uploads/productFiles";
if (!fs.existsSync(fileDir)) fs.mkdirSync(fileDir, { recursive: true });

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, fileDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const safe = file.originalname.replace(/\s+/g, "-");
        cb(null, `productfile-${Date.now()}-${safe}${ext}`);
    },
});

const uploadProductFile = multer({
    storage: fileStorage,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
}).single("productFile"); // ✅ frontend key must be "productFile"

/* =========================
   Routes
========================= */

router.post("/createproduct", uploadImages.array("productImages", 7), controller.createProduct);

router.get("/getallproducts", controller.getAllProducts);

router.put("/updateproduct/:id", uploadImages.array("productImages", 7), controller.updateProduct);

router.delete("/deleteproduct/:id", controller.deleteProduct);
router.get("/getbyid/:id", controller.getProductById);
router.put("/updateproductstatus/:id", controller.updateProductStatus);
router.get("/getactiveproducts", controller.getActiveProducts);
router.get("/getinactiveproducts", controller.getInactiveProducts);

router.get("/product/subcategory/:subcategoryId", controller.getProductsBySubcategory);
router.get("/product/subsubcategory/:subsubcategoryId", controller.getProductsBySubSubcategory);

// Payment 99
router.post("/lock-after-payment", controller.lockProductAfterPayment);
router.get("/lock/:productId", controller.getProductLockStatus);

router.get("/products/vendor/:vendorId", controller.getProductsByVendor);
router.get("/products/vendoractive/:vendorId", controller.getProductsByVendordata);
router.get("/products/search", controller.searchProducts);

// Product Updated
router.get("/featured", controller.getFeaturedProducts);
router.put("/:id/featured-toggle", controller.toggleFeatureProduct);

// ✅ Upload Single Product File by product ID
router.put("/:id/upload-product-file", uploadProductFile, controller.uploadProductFile);

module.exports = router;
