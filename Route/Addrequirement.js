// Route/Addrequirement.js
const express = require("express");
const router = express.Router();
const RequirementController = require("../Controller/Addrequirement");
const { createUploader } = require("../utils/cloudinaryConfig");

// Uploads to Cloudinary folder "requirements", images only, max 5 MB
const uploadProductImage = createUploader(
    "requirements",
    "image",
    ["jpg", "jpeg", "png", "webp"],
    5 * 1024 * 1024
);

router.post("/createrequirement", uploadProductImage.single("productImage"), RequirementController.createProduct);

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
