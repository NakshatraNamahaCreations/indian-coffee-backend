const express = require("express");
const router = express.Router();
const bidCtrl = require("../Controller/Bid"); // Your controller path

// ✅ INTEGRATED ROUTES
router.post("/lock-after-payment", bidCtrl.lockAfterPayment);     // Lock ₹99
router.post("/createbid", bidCtrl.createBid);                    // Place bid
router.get("/lock/:productId", bidCtrl.getLockStatus);           // Check lock
router.get("/user/:userId/product/:productId", bidCtrl.getUserBidsForProduct); // Check existing

// Admin/Vendor routes
router.get("/all", bidCtrl.getAllBids);
router.patch("/vendor-accept/:id", bidCtrl.vendorAcceptBid);
router.patch("/admin-approve/:id", bidCtrl.adminApproveBid);
router.get('/user/:userId', bidCtrl.getBidsByUser);

module.exports = router;
