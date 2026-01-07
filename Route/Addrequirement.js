const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Controller
const RequirementController = require("../Controller/Addrequirement");

/* ================= UPLOAD DIR ================= */
const UPLOAD_DIR = path.join(process.cwd(), "uploads", "products");
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/* ================= MULTER STORAGE ================= */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanName = path
      .basename(file.originalname, ext)
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9_-]/g, "");
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${cleanName}-${uniqueSuffix}${ext}`);
  },
});

/* ================= FILE FILTER ================= */
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error("Only JPG, PNG, and WEBP images are allowed!"), false);
  }
  cb(null, true);
};

/* ================= MULTER INSTANCE ================= */
const uploadProductImage = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB max
  },
});

/* ================= ERROR HANDLER FOR MULTER ================= */
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File too large. Max size is 5MB.",
      });
    }
    return res.status(400).json({
      success: false,
      message: "Upload error: " + err.message,
    });
  } else if (err) {
    return res.status(400).json({
      success: false,
      message: err.message || "Invalid file uploaded.",
    });
  }
  next();
};

/* ================= ROUTES ================= */

router.post(
  "/createrequirement",
  (req, res, next) => {
    // Apply multer middleware and handle errors inline
    uploadProductImage.single("productImage")(req, res, (err) => {
      if (err) {
        // Send error response immediately, do not call next()
        if (err instanceof multer.MulterError) {
          return res.status(400).json({
            success: false,
            message: err.message,
          });
        } else {
          return res.status(400).json({
            success: false,
            message: err.message || "File upload failed.",
          });
        }
      }
      // No error → proceed to controller
      next();
    });
  },
  RequirementController.createProduct // ✅ Make sure this function exists and uses req.file
);

// Other routes
router.get("/admin/pending", RequirementController.listPendingAdmin);
router.patch("/admin/approve/:id", RequirementController.adminApproveProduct);
router.get("/farmer/list", RequirementController.listForFarmerApp);
router.patch("/farmer/accept/:id", RequirementController.farmerAcceptProduct);
router.patch("/admin/final-approve/:id", RequirementController.finalAdminApproveProduct);

module.exports = router;