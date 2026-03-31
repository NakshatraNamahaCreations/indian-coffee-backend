const router = require("express").Router();
const {
  createOrder,
  verifyPayment,
  getSubscriptionHistory,
  getBidLimit,
} = require("../Controller/TraderSubscription");

router.post("/create-order", createOrder);
router.post("/verify-payment", verifyPayment);
router.get("/history/:traderId", getSubscriptionHistory);
router.get("/bid-limit/:traderId", getBidLimit);

module.exports = router;
