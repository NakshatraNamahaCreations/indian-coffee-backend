const router = require("express").Router();
const {
  createOrder,
  verifyPayment,
  getBidLimit,
  getSubscriptionHistory,
} = require("../Controller/TraderSubscription");

/**
 * Subscription Management Routes
 */

// Create Razorpay order
router.post("/create-order", createOrder);

// Verify payment and update bid limit
router.post("/verify-payment", verifyPayment);

// Get trader's current bid limit
router.get("/bid-limit/:traderId", getBidLimit);

// Get trader's subscription history
router.get("/history/:traderId", getSubscriptionHistory);

module.exports = router;
