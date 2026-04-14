// const express = require("express");
// const router = express.Router();
// const bannerController = require("../Controller/Farmerbanner");

// router.post("/createbanner", bannerController.createBanner);
// router.get("/getallbanner", bannerController.getAllBanners);
// router.put("/updatebanner/:id", bannerController.updateBanner);
// router.delete("/deletebanner/:id", bannerController.deleteBanner);
// router.get("/activebanner", bannerController.getActiveBanners);
// router.put("/bannerstatus/:id", bannerController.updateStatus);

// module.exports = router;




const express = require("express");
const router = express.Router();
const { createCloudinaryUploader } = require("../utils/cloudinaryConfig");
const bannerController = require("../Controller/Farmerbanner");

// ✅ Cloudinary-backed multer uploader
const upload = createCloudinaryUploader(
    "banners",                      // folder (same as main banners)
    "image",                        // resource_type
    ["jpg", "jpeg", "png", "webp"], // allowed formats
    10 * 1024 * 1024                // 10MB limit
);


router.post("/createbanner", upload.single("image"), bannerController.createBanner);
router.get("/getallbanner", bannerController.getAllBanners);
router.put("/updatebanner/:id", upload.single("image"), bannerController.updateBanner);
router.delete("/deletebanner/:id", bannerController.deleteBanner);
router.get("/activebanner", bannerController.getActiveBanners);
router.put("/bannerstatus/:id", bannerController.updateStatus);

module.exports = router;
