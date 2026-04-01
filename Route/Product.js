const express = require("express");
const router = express.Router();
const controller = require("../Controller/Product");
const multer = require("multer");
const path = require("path");
const fs = require("fs");


const IMAGE_DIR = "uploads/products";
const FILE_DIR = "uploads/productFiles";
const VIDEO_DIR = "uploads/productVideos";

[IMAGE_DIR, FILE_DIR, VIDEO_DIR].forEach((dir) => {
    try {
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    } catch (e) {
        console.log("mkdir error:", e.message);
    }
});


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        try {
            if (file.fieldname === "productImages") return cb(null, IMAGE_DIR);
            if (file.fieldname === "productFile") return cb(null, FILE_DIR);
            if (file.fieldname === "productvideofile") return cb(null, VIDEO_DIR);
            return cb(null, "uploads");
        } catch (e) {
            return cb(e);
        }
    },
    filename: (req, file, cb) => {
        try {
            const ext = path.extname(file.originalname || "").toLowerCase();
            const base = path.basename(file.originalname || "file", ext);
            const safeBase = base.replace(/[^\w\-]+/g, "-");
            cb(null, `${file.fieldname}-${Date.now()}-${safeBase}${ext || ""}`);
        } catch (e) {
            cb(e);
        }
    },
});


const fileFilter = (req, file, cb) => {
    try {
        // images
        if (file.fieldname === "productImages") {
            const ok = file.mimetype?.startsWith("image/");
            return cb(ok ? null : new Error("Only image files allowed"), ok);
        }

        // video
        if (file.fieldname === "productvideofile") {
            const ok = file.mimetype?.startsWith("video/");
            return cb(ok ? null : new Error("Only video files allowed"), ok);
        }

        // generic productFile (pdf/doc/docx/etc)
        if (file.fieldname === "productFile") {
            const allowed = new Set([
                "application/pdf",
                "application/msword",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "application/vnd.ms-excel",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "text/plain",
            ]);
            const ok = allowed.has(file.mimetype);
            return cb(ok ? null : new Error("Unsupported productFile type"), ok);
        }

        return cb(new Error("Invalid upload fieldname"), false);
    } catch (e) {
        return cb(e, false);
    }
};


const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 200 * 1024 * 1024,
    },
});


const uploadImagesAndVideo = upload.fields([
    { name: "productImages", maxCount: 7 },
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