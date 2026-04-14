const express = require("express");
const router = express.Router();
const farmerController = require("../Controller/Farmer");
const { createCloudinaryUploader } = require("../utils/cloudinaryConfig");

// ✅ Cloudinary-backed multer uploader
const upload = createCloudinaryUploader(
    "kyc/farmer",  // folder
    "image"        // resource_type
);

const uploadFields = upload.fields([
    { name: "aadhaarFront", maxCount: 1 },
    { name: "aadhaarBack", maxCount: 1 },
    { name: "panImage", maxCount: 1 },
    { name: "gstImage", maxCount: 1 },
    { name: "registrationDocs", maxCount: 5 },
]);



router.post("/registerfarmer", uploadFields, farmerController.register);

router.post("/loginfarmer", farmerController.login);

router.put("/editfarmer/:id", uploadFields, farmerController.edit);

router.get("/getallfarmer", farmerController.getAll);

router.get("/getfarmer/:id", farmerController.getById);

router.delete("/deletefarmer/:id", farmerController.delete);
router.put("/status/:id", farmerController.updateStatus);
router.post("/change-password", farmerController.changePassword);
router.post("/login/send-otp", farmerController.sendLoginOtp);
router.post("/login/verify-otp", farmerController.verifyOtpAndLogin);
router.post("/save-fcm-token", farmerController.saveFcmToken);
router.post("/delete-account", farmerController.deleteAccount);

module.exports = router;
