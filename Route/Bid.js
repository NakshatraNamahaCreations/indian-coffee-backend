const express = require("express");
const router = express.Router();
const bidCtrl = require("../Controller/Bid"); 

router.post("/lock-after-payment", bidCtrl.lockAfterPayment);
router.post("/createbid", bidCtrl.createBid);             
router.get("/lock/:productId", bidCtrl.getLockStatus);       
router.get("/user/:userId/product/:productId", bidCtrl.getUserBidsForProduct);
router.get("/all", bidCtrl.getAllBids);
router.patch("/vendor-accept/:id", bidCtrl.vendorAcceptBid);
router.patch("/admin-approve/:id", bidCtrl.adminApproveBid);
router.patch("/reject/:id", bidCtrl.adminrejectBid);
router.get('/user/:userId', bidCtrl.getBidsByUser);
router.get("/vendordata/:vendorId", bidCtrl.getBidsByVendor);


module.exports = router;
