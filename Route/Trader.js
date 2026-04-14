
const express = require("express");
const router = express.Router();
const ctrl = require("../Controller/Trader");
const { createCloudinaryUploader } = require("../utils/cloudinaryConfig");

// ✅ Cloudinary-backed multer uploader
const upload = createCloudinaryUploader(
    "kyc/trader",  // folder
    "image"        // resource_type
);

const cpUpload = upload.fields([
    { name: "aadhaarFront", maxCount: 1 },
    { name: "aadhaarBack", maxCount: 1 },
    { name: "panImage", maxCount: 1 },
    { name: "gstImage", maxCount: 1 },
    { name: "registrationDocs", maxCount: 10 },
]);

router.post("/traderregister", cpUpload, ctrl.register);
router.post("/traderregister1", ctrl.register1);
router.put("/:id", cpUpload, ctrl.edit);
router.post("/traderlogin", ctrl.login);
router.get("/getalltrader", ctrl.getAll);
router.get("/trader/byid/:id", ctrl.getById);
router.delete("/:id", ctrl.delete);
router.put("/trader/status/:id", ctrl.updateStatus);
router.post("/change-password", ctrl.changePassword);
router.post("/trader/login/send-otp", ctrl.sendLoginOtp);
router.post("/trader/login/verify-otp", ctrl.verifyOtpAndLogin);
router.post("/trader/save-fcm-token", ctrl.saveFcmToken);
router.post("/trader/delete-account", ctrl.deleteAccount);

module.exports = router;

