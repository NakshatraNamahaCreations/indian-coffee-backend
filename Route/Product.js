const express = require("express");
const router = express.Router();
const { createProductUploader } = require("../utils/cloudinaryConfig");
const controller = require("../Controller/Product");

const upload = createProductUploader("indian_coffee/products");

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
