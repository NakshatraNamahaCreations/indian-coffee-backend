const express = require("express");
const router = express.Router();
const farmerController = require("../Controller/Farmer");
const multer = require("multer");
const path = require("path");


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/");
    },
    filename: function (req, file, cb) {
        const uniqueName =
            Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueName + path.extname(file.originalname));
    },
});

const upload = multer({ storage });

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

module.exports = router;
