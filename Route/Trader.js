
const express = require("express");
const router = express.Router();
const ctrl = require("../Controller/Trader");
const multer = require("multer");
const path = require("path");
const fs = require("fs");


if (!fs.existsSync("uploads")) {
    fs.mkdirSync("uploads");
}


const storage = multer.diskStorage({
    destination: "uploads/",
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});


const upload = multer({ dest: 'uploads/' });

/* FILE FIELDS */
const cpUpload = upload.fields([
    { name: "aadhaarFront", maxCount: 1 },
    { name: "aadhaarBack", maxCount: 1 },
    { name: "panImage", maxCount: 1 },
    { name: "gstImage", maxCount: 1 },
    { name: "registrationDocs", maxCount: 10 },
]);

/* ROUTES */
router.post("/traderregister", cpUpload, ctrl.register);
router.post("/traderregister1", ctrl.register1);
router.put("/:id", cpUpload, ctrl.edit);
router.post("/traderlogin", ctrl.login);
router.get("/getalltrader", ctrl.getAll);
router.get("/trader/byid/:id", ctrl.getById);
router.delete("/:id", ctrl.delete);
router.put("/trader/status/:id", ctrl.updateStatus);
router.post("/change-password", ctrl.changePassword);

module.exports = router;

