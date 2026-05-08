const express = require("express");
const router = express.Router();
const { createUploader } = require("../utils/cloudinaryConfig");
const ctrl = require("../Controller/Trader");

// KYC docs can be images or PDFs — use "auto" to handle both
const upload = createUploader("indian_coffee/kyc", "auto");

const cpUpload = upload.fields([
    { name: "aadhaarFront",     maxCount: 1 },
    { name: "aadhaarBack",      maxCount: 1 },
    { name: "panImage",         maxCount: 1 },
    { name: "gstImage",         maxCount: 1 },
    { name: "registrationDocs", maxCount: 10 },
]);

router.post("/traderregister", cpUpload, ctrl.register);
router.post("/traderregister1", ctrl.register1);
router.put("/updateprofile/:id", ctrl.updateProfile);
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
