const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const bannerController = require("../Controller/Banner");

const uploadDir = path.join(process.cwd(), "uploads/banners");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `banner-${Date.now()}${ext}`);
    },
});

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

router.post("/createbanner", upload.single("image"), bannerController.createBanner);
router.get("/getallbanner", bannerController.getAllBanners);
router.put("/updatebanner/:id", upload.single("image"), bannerController.updateBanner);
router.delete("/deletebanner/:id", bannerController.deleteBanner);
router.get("/activebanner", bannerController.getActiveBanners);
router.put("/bannerstatus/:id", bannerController.updateStatus);

module.exports = router;
