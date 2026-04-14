const express = require("express");
const router = express.Router();
const { createUploader } = require("../utils/cloudinaryConfig");
const bannerController = require("../Controller/Banner");

const upload = createUploader("indian_coffee/banners", "image", 10 * 1024 * 1024);

router.post("/createbanner", upload.single("image"), bannerController.createBanner);
router.get("/getallbanner", bannerController.getAllBanners);
router.put("/updatebanner/:id", upload.single("image"), bannerController.updateBanner);
router.delete("/deletebanner/:id", bannerController.deleteBanner);
router.get("/activebanner", bannerController.getActiveBanners);
router.put("/bannerstatus/:id", bannerController.updateStatus);

module.exports = router;
