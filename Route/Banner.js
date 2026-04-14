const express = require("express");
const router = express.Router();
const bannerController = require("../Controller/Banner");
const { createUploader } = require("../utils/cloudinaryConfig");

// Uploads to Cloudinary folder "banners", images only, max 10 MB
const upload = createUploader(
    "banners",
    "image",
    ["jpg", "jpeg", "png", "webp"],
    10 * 1024 * 1024
);

router.post("/createbanner", upload.single("image"), bannerController.createBanner);
router.get("/getallbanner", bannerController.getAllBanners);
router.put("/updatebanner/:id", upload.single("image"), bannerController.updateBanner);

router.delete("/deletebanner/:id", bannerController.deleteBanner);
router.get("/activebanner", bannerController.getActiveBanners);
router.put("/bannerstatus/:id", bannerController.updateStatus);

module.exports = router;
