const router = require("express").Router();
const {
  createOrder,
  verifyPayment,
  getSubscriptionHistory,
  getCurrentSubscription,
} = require("../Controller/FarmerSubscription");

router.post("/create-order", createOrder);
router.post("/verify-payment", verifyPayment);
router.get("/history/:farmerId", getSubscriptionHistory);
router.get("/current/:farmerId", getCurrentSubscription);

module.exports = router;
