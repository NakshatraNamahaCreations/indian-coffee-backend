// Route/Addrequirement.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const RequirementController = require("../Controller/Addrequirement");

const UPLOAD_DIR = path.join(process.cwd(), "uploads", "products");
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = path
      .basename(file.originalname, ext)
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9_-]/g, "");
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
  if (!allowed.includes(file.mimetype)) {
    return cb(new Error("Only JPG, PNG, and WEBP images are allowed!"), false);
  }
  cb(null, true);
};

const uploadProductImage = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
});

router.post(
  "/createrequirement",
  (req, res, next) => {
    uploadProductImage.single("productImage")(req, res, (err) => {
      if (err) {
        console.error("❌ Multer upload error:", err);
        if (err instanceof multer.MulterError) {
          return res.status(400).json({
            success: false,
            message: err.message,
          });
        }
        return res.status(400).json({
          success: false,
          message: err.message || "File upload failed.",
        });
      }
      next();
    });
  },
  RequirementController.createProduct
);

router.get("/admin/pending", RequirementController.listPendingAdmin);
router.patch("/admin/approve/:id", RequirementController.adminApproveProduct);
router.get("/farmer/list", RequirementController.listForFarmerApp);
router.get("/allrequirement", RequirementController.getallrequirement);
router.patch("/farmer/accept/:id", RequirementController.farmerAcceptProduct);
router.patch(
  "/admin/final-approve/:id",
  RequirementController.finalAdminApproveProduct
);
router.get("/listby/:userId", RequirementController.listByUser);
router.put("/:id/approval", RequirementController.updateApproval);
router.post("/requirement/:requirementId/offer", RequirementController.placeOrUpdateOffer);
router.put("/requirement/:id/reject", RequirementController.rejectRequirement);

router.post("/requirements/:requirementId/offer", RequirementController.placeOrUpdateOffer);

router.delete(
  "/requirements/:requirementId/offers/:farmerId/withdraw",
  RequirementController.withdrawOfferByFarmer
);

router.put(
  "/requirements/:requirementId/offers/:vendorId/admin-action",
  RequirementController.adminAcceptRejectOffer
);


module.exports = router;
