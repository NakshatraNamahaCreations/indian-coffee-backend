const Razorpay = require("razorpay");
const crypto = require("crypto");
const TraderSubscription = require("../Modal/TraderSubscription");
const Plan = require("../Modal/Plan");
const Trader = require("../Modal/Trader");

// Initialize Razorpay with env credentials
const getRazorpayInstance = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error(
      "Razorpay credentials not configured in .env file (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET)"
    );
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

/**
 * Create a Razorpay order for subscription purchase
 * POST /api/trader-subscription/create-order
 */
exports.createOrder = async (req, res) => {
  try {
    const { traderId, planId } = req.body;

    // Validate inputs
    if (!traderId || !planId) {
      return res.status(400).json({
        success: false,
        message: "traderId and planId are required",
      });
    }

    // Fetch and validate plan
    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found",
      });
    }

    if (!plan.isActive) {
      return res.status(400).json({
        success: false,
        message: "This plan is not active",
      });
    }

    // Verify plan is for traders
    if (plan.planFor !== "trader") {
      return res.status(400).json({
        success: false,
        message: "This plan is not available for traders",
      });
    }

    // Verify trader exists
    const trader = await Trader.findById(traderId);
    if (!trader) {
      return res.status(404).json({
        success: false,
        message: "Trader not found",
      });
    }

    // Create Razorpay order
    const razorpay = getRazorpayInstance();
    const receipt = `trader_sub_${Date.now().toString().slice(-8)}`;

    const order = await razorpay.orders.create({
      amount: plan.price * 100, // Convert to paise
      currency: "INR",
      receipt: receipt,
      notes: {
        traderId: traderId,
        planId: planId,
        planName: plan.planName,
      },
    });

    if (!order || !order.id) {
      console.error("❌ Razorpay order creation failed:", order);
      return res.status(500).json({
        success: false,
        message: "Failed to create payment order. Please try again.",
      });
    }

    console.log("✅ Razorpay order created:", order.id);

    // Create subscription record with pending status
    const subscription = await TraderSubscription.create({
      traderId,
      planId,
      planName: plan.planName,
      amount: plan.price,
      bidCount: plan.count,
      durationDays: plan.durationDays || 30,
      razorpayOrderId: order.id,
      status: "pending",
    });

    return res.status(201).json({
      success: true,
      orderId: order.id,
      amount: plan.price,
      currency: "INR",
      keyId: process.env.RAZORPAY_KEY_ID,
      subscriptionId: subscription._id,
    });
  } catch (err) {
    console.error("❌ Error in createOrder:", err.message);
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to create payment order",
    });
  }
};

/**
 * Verify Razorpay payment and update trader's bid limit
 * POST /api/trader-subscription/verify-payment
 */
exports.verifyPayment = async (req, res) => {
  try {
    const {
      traderId,
      subscriptionId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    } = req.body;

    // Validate inputs
    if (
      !traderId ||
      !subscriptionId ||
      !razorpayOrderId ||
      !razorpayPaymentId ||
      !razorpaySignature
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields for payment verification",
      });
    }

    // Verify signature using HMAC SHA256
    const body = razorpayOrderId + "|" + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpaySignature) {
      console.error("❌ Signature verification failed");
      return res.status(401).json({
        success: false,
        message: "Payment signature verification failed. Payment not authorized.",
      });
    }

    console.log("✅ Signature verified for payment:", razorpayPaymentId);

    // Fetch subscription record
    const subscription = await TraderSubscription.findById(subscriptionId);
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription record not found",
      });
    }

    // Update subscription with payment details
    subscription.razorpayPaymentId = razorpayPaymentId;
    subscription.razorpaySignature = razorpaySignature;
    subscription.status = "completed";

    // Set expiry date
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + subscription.durationDays);
    subscription.expiresAt = expiryDate;

    await subscription.save();

    console.log("✅ Subscription record updated:", subscriptionId);

    // Fetch trader and update bid limit
    const trader = await Trader.findById(traderId);
    if (!trader) {
      return res.status(404).json({
        success: false,
        message: "Trader not found",
      });
    }

    // Add bid credits to trader's bid limit
    const previousBidLimit = trader.bidLimit || 0;
    const newBidLimit = previousBidLimit + subscription.bidCount;
    trader.bidLimit = newBidLimit;

    await trader.save();

    console.log(
      `✅ Trader bid limit updated: ${previousBidLimit} → ${newBidLimit}`
    );

    return res.json({
      success: true,
      message: "Payment verified successfully",
      newBidLimit: newBidLimit,
      subscriptionId: subscriptionId,
    });
  } catch (err) {
    console.error("❌ Error in verifyPayment:", err.message);
    return res.status(500).json({
      success: false,
      message: err.message || "Payment verification failed",
    });
  }
};

/**
 * Get trader's current bid limit
 * GET /api/trader-subscription/bid-limit/:traderId
 */
exports.getBidLimit = async (req, res) => {
  try {
    const { traderId } = req.params;

    const trader = await Trader.findById(traderId);
    if (!trader) {
      return res.status(404).json({
        success: false,
        message: "Trader not found",
      });
    }

    return res.json({
      success: true,
      bidLimit: trader.bidLimit || 0,
      traderId: traderId,
    });
  } catch (err) {
    console.error("❌ Error in getBidLimit:", err.message);
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to fetch bid limit",
    });
  }
};

/**
 * Get trader's subscription history
 * GET /api/trader-subscription/history/:traderId
 */
exports.getSubscriptionHistory = async (req, res) => {
  try {
    const { traderId } = req.params;

    const subscriptions = await TraderSubscription.find({
      traderId: traderId,
      status: "completed",
    })
      .sort({ createdAt: -1 })
      .limit(10);

    return res.json({
      success: true,
      data: subscriptions,
      total: subscriptions.length,
    });
  } catch (err) {
    console.error("❌ Error in getSubscriptionHistory:", err.message);
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to fetch subscription history",
    });
  }
};

/**
 * Decrement bid limit when bid or requirement is created
 * This function is called internally from Bid and Addrequirement controllers
 */
exports.decrementBidLimit = async (traderId, amount = 1) => {
  try {
    const trader = await Trader.findById(traderId);
    if (!trader) {
      throw new Error("Trader not found");
    }

    const currentBidLimit = trader.bidLimit || 0;
    const newBidLimit = Math.max(0, currentBidLimit - amount);

    trader.bidLimit = newBidLimit;
    await trader.save();

    console.log(
      `✅ Bid limit decremented: ${currentBidLimit} → ${newBidLimit}`
    );

    return {
      success: true,
      previousBidLimit: currentBidLimit,
      newBidLimit: newBidLimit,
    };
  } catch (err) {
    console.error("❌ Error in decrementBidLimit:", err.message);
    throw err;
  }
};
