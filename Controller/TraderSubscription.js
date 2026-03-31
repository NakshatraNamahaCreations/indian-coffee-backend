const Razorpay = require("razorpay");
const crypto = require("crypto");
const TraderSubscription = require("../Modal/TraderSubscription");
const Plan = require("../Modal/Plan");
const Trader = require("../Modal/Trader");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.createOrder = async (req, res) => {
  try {
    const { traderId, planId } = req.body;

    if (!traderId || !planId) {
      return res.status(400).json({
        success: false,
        message: "traderId and planId are required",
      });
    }

    // Fetch plan and validate
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

    // Verify trader exists
    const trader = await Trader.findById(traderId);
    if (!trader) {
      return res.status(404).json({
        success: false,
        message: "Trader not found",
      });
    }

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: plan.price * 100, // Convert to paise
      currency: "INR",
      receipt: `sub_${traderId}_${planId}_${Date.now()}`,
    });

    if (!order || !order.id) {
      return res.status(500).json({
        success: false,
        message: "Failed to create Razorpay order",
      });
    }

    // Create TraderSubscription record with pending status
    const subscription = await TraderSubscription.create({
      traderId,
      planId,
      planName: plan.planName,
      amount: plan.price,
      bidCount: plan.count,
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
    console.error("Error in createOrder:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const {
      traderId,
      subscriptionId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    } = req.body;

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

    // Verify HMAC signature
    const body = razorpayOrderId + "|" + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpaySignature) {
      return res.status(401).json({
        success: false,
        message: "Payment signature verification failed",
      });
    }

    // Update subscription to active
    const subscription = await TraderSubscription.findById(subscriptionId);
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found",
      });
    }

    // Calculate end date
    const plan = await Plan.findById(subscription.planId);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + (plan.durationDays || 30));

    subscription.razorpayPaymentId = razorpayPaymentId;
    subscription.razorpaySignature = razorpaySignature;
    subscription.status = "active";
    subscription.endDate = endDate;
    await subscription.save();

    // Increment trader's bidLimit
    const trader = await Trader.findByIdAndUpdate(
      traderId,
      { $inc: { bidLimit: plan.count } },
      { new: true }
    );

    return res.json({
      success: true,
      message: "Payment verified and subscription activated",
      newBidLimit: trader.bidLimit,
      subscriptionId: subscription._id,
    });
  } catch (err) {
    console.error("Error in verifyPayment:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getSubscriptionHistory = async (req, res) => {
  try {
    const { traderId } = req.params;

    if (!traderId) {
      return res.status(400).json({
        success: false,
        message: "traderId is required",
      });
    }

    const subscriptions = await TraderSubscription.find({ traderId })
      .populate("planId")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: subscriptions,
    });
  } catch (err) {
    console.error("Error in getSubscriptionHistory:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getBidLimit = async (req, res) => {
  try {
    const { traderId } = req.params;

    if (!traderId) {
      return res.status(400).json({
        success: false,
        message: "traderId is required",
      });
    }

    const trader = await Trader.findById(traderId);
    if (!trader) {
      return res.status(404).json({
        success: false,
        message: "Trader not found",
      });
    }

    return res.json({
      success: true,
      bidLimit: trader.bidLimit,
    });
  } catch (err) {
    console.error("Error in getBidLimit:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
