const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const controller = require("../Controller/Product");

// Ensure upload directories exist
["uploads/products", "uploads/videos", "uploads/files"].forEach((dir) => {
    const full = path.join(process.cwd(), dir);
    if (!fs.existsSync(full)) fs.mkdirSync(full, { recursive: true });
});

const storage = multer.diskStorage({
    destination: (_req, file, cb) => {
        if (file.fieldname === "productvideofile") {
            cb(null, path.join(process.cwd(), "uploads/videos"));
        } else if (file.fieldname === "productFile") {
            cb(null, path.join(process.cwd(), "uploads/files"));
        } else {
            cb(null, path.join(process.cwd(), "uploads/products"));
        }
    },
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${file.fieldname}-${Date.now()}${ext}`);
    },
});

const upload = multer({ storage, limits: { fileSize: 200 * 1024 * 1024 } });

const uploadImagesAndVideo = upload.fields([
    { name: "productImages",    maxCount: 7 },
    { name: "productvideofile", maxCount: 1 },
]);

const uploadSingleProductFile = upload.single("productFile");

router.post("/createproduct", uploadImagesAndVideo, controller.createProduct);
router.get("/getallproducts", controller.getAllProducts);
router.put("/updateproduct/:id", uploadImagesAndVideo, controller.updateProduct);
router.delete("/deleteproduct/:id", controller.deleteProduct);
router.get("/getbyid/:id", controller.getProductById);
router.put("/updateproductstatus/:id", controller.updateProductStatus);
router.get("/getactiveproducts", controller.getActiveProducts);
router.get("/getinactiveproducts", controller.getInactiveProducts);
router.get("/product/subcategory/:subcategoryId", controller.getProductsBySubcategory);
router.get("/product/subsubcategory/:subsubcategoryId", controller.getProductsBySubSubcategory);
router.post("/lock-after-payment", controller.lockProductAfterPayment);
router.get("/lock/:productId", controller.getProductLockStatus);
router.get("/products/vendor/:vendorId", controller.getProductsByVendor);
router.get("/products/vendoractive/:vendorId", controller.getProductsByVendordata);
router.get("/products/search", controller.searchProducts);
router.get("/featured", controller.getFeaturedProducts);
router.put("/:id/featured-toggle", controller.toggleFeatureProduct);
router.post("/:id/feature", controller.featureProduct);
router.put("/:id/upload-product-file", uploadSingleProductFile, controller.uploadProductFile);
router.put("/bid/active", controller.updateProductBidActive);
router.put("/selling/update", controller.updateSellingDetails);

module.exports = router;
