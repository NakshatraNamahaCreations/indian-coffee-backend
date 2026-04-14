const express = require("express");
const router = express.Router();
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const { cloudinary } = require("../utils/cloudinaryConfig");
const controller = require("../Controller/Product");

/**
 * Products need three different Cloudinary resource types:
 *   productImages    → image  (stored in products/images)
 *   productvideofile → video  (stored in products/videos)
 *   productFile      → raw    (stored in products/files  — PDFs, docs, etc.)
 *
 * We use a single storage with an async params function that returns the
 * correct config based on which field is being uploaded.
 */
const productStorage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
        if (file.fieldname === "productImages") {
            return {
                folder:          "products/images",
                resource_type:   "image",
                allowed_formats: ["jpg", "jpeg", "png", "webp"],
            };
        }
        if (file.fieldname === "productvideofile") {
            return {
                folder:        "products/videos",
                resource_type: "video",
            };
        }
        if (file.fieldname === "productFile") {
            return {
                folder:        "products/files",
                resource_type: "raw",   // PDFs, docs, spreadsheets
            };
        }
        return { folder: "products/misc", resource_type: "auto" };
    },
});

const upload = multer({
    storage: productStorage,
    limits:  { fileSize: 200 * 1024 * 1024 }, // 200 MB (covers large videos)
});

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