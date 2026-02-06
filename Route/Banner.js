
// const express = require("express");
// const router = express.Router();
// const path = require("path");
// const multer = require("multer");
// const bannerController = require("../Controller/Banner");

// const storage = multer.diskStorage({
//     destination: (req, file, cb) => cb(null, "uploads/banners"),
//     filename: (req, file, cb) => {
//         const ext = path.extname(file.originalname);
//         cb(null, `banner-${Date.now()}${ext}`);
//     },
// });


// const fileFilter = (req, file, cb) => {
//     const allowed = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
//     if (allowed.includes(file.mimetype)) cb(null, true);
//     else cb(new Error("Only image files are allowed (jpg, jpeg, png, webp)"), false);
// };

// const upload = multer({
//     storage,
//     fileFilter,
//     limits: { fileSize: 10 * 1024 * 1024 },
// });


// router.post("/createbanner", upload.single("image"), bannerController.createBanner);
// router.get("/getallbanner", bannerController.getAllBanners);
// router.put("/updatebanner/:id", upload.single("image"), bannerController.updateBanner);

// router.delete("/deletebanner/:id", bannerController.deleteBanner);
// router.get("/activebanner", bannerController.getActiveBanners);
// router.put("/bannerstatus/:id", bannerController.updateStatus);

// module.exports = router;


const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const bannerController = require("../Controller/Banner");

// ✅ IMPORTANT: ensure folder exists (prevents ENOENT 500 on Render)
const uploadDir = path.join(process.cwd(), "uploads", "banners");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `banner-${Date.now()}${ext}`);
    },
});

const fileFilter = (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only image files are allowed (jpg, jpeg, png, webp)"), false);
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// ✅ Multer error handler (otherwise it becomes 500 without clear message)
const multerErrorHandler = (err, req, res, next) => {
    if (err) {
        return res.status(400).json({ success: false, message: err.message });
    }
    next();
};

// ✅ IMPORTANT: field name must be "image"
router.post(
    "/createbanner",
    upload.single("image"),
    multerErrorHandler,
    bannerController.createBanner
);

router.get("/getallbanner", bannerController.getAllBanners);

router.put(
    "/updatebanner/:id",
    upload.single("image"),
    multerErrorHandler,
    bannerController.updateBanner
);

router.delete("/deletebanner/:id", bannerController.deleteBanner);
router.get("/activebanner", bannerController.getActiveBanners);
router.put("/bannerstatus/:id", bannerController.updateStatus);

module.exports = router;
