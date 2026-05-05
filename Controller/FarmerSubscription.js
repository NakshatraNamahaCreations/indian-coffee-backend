const Razorpay = require("razorpay");
const crypto = require("crypto");
const FarmerSubscription = require("../Modal/FarmerSubscription");
const Plan = require("../Modal/Plan");
const Farmer = require("../Modal/Farmer");

// Initialize Razorpay client with env credentials
const getRazorpayClient = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error(
      "Razorpay credentials not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env"
    );
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

exports.createOrder = async (req, res) => {
  try {
    const { farmerId, planId } = req.body;

    if (!farmerId || !planId) {
      return res.status(400).json({
        success: false,
        message: "farmerId and planId are required",
      });
    }

    // Verify Razorpay credentials are configured
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error("❌ Razorpay credentials not configured in .env");
      return res.status(500).json({
        success: false,
        message: "Payment service not configured. Contact admin.",
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

    // Validate plan is for farmers
    if (plan.planFor !== "farmer") {
      return res.status(400).json({
        success: false,
        message: "This plan is not available for farmers",
      });
    }

    // Verify farmer exists
    const farmer = await Farmer.findById(farmerId);
    if (!farmer) {
      return res.status(404).json({
        success: false,
        message: "Farmer not found",
      });
    }

    // Validate Basic plan is only for individuals
    if (plan.planName.toLowerCase().includes("basic") && farmer.userType !== "individual") {
      return res.status(403).json({
        success: false,
        message: "Basic plan is available for Individuals only",
      });
    }

    // Create Razorpay order
    const razorpay = getRazorpayClient();
    const shortReceipt = `sub_${Date.now().toString().slice(-8)}`;
    const order = await razorpay.orders.create({
      amount: plan.price * 100, // Convert to paise
      currency: "INR",
      receipt: shortReceipt,
    });

    if (!order || !order.id) {
      console.error("❌ Razorpay order creation failed:", order);
      return res.status(500).json({
        success: false,
        message: "Failed to create payment order. Please try again.",
      });
    }

    console.log("✅ Razorpay order created:", order.id);

    // Create FarmerSubscription record with pending status
    const subscription = await FarmerSubscription.create({
      farmerId,
      planId,
      planName: plan.planName,
      amount: plan.price,
      bidLimitCount: plan.count,
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
    console.error("❌ Error in createOrder:", err.message || err);
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to create payment order",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const {
      farmerId,
      subscriptionId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    } = req.body;

    // Validate inputs
    if (
      !farmerId ||
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
    const subscription = await FarmerSubscription.findById(subscriptionId);
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription record not found",
      });
    }

    // Fetch plan details
    const plan = await Plan.findById(subscription.planId);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found",
      });
    }

    // Update subscription with payment details
    subscription.razorpayPaymentId = razorpayPaymentId;
    subscription.razorpaySignature = razorpaySignature;
    subscription.status = "completed";

    // Set expiry date
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + (plan.durationDays || 365));
    subscription.expiresAt = expiryDate;

    await subscription.save();

    console.log("✅ Subscription record updated:", subscriptionId);

    // Fetch farmer and update bid limit
    const farmer = await Farmer.findById(farmerId);
    if (!farmer) {
      return res.status(404).json({
        success: false,
        message: "Farmer not found",
      });
    }

    // ✅ Add bid credits to farmer's bid limit (CUMULATIVE)
    const previousBidLimit = farmer.bidLimit || 0;
    const newBidLimit = previousBidLimit + plan.count;
    farmer.bidLimit = newBidLimit;

    await farmer.save();

    console.log(
      `✅ Farmer bid limit updated: ${previousBidLimit} + ${plan.count} = ${newBidLimit}`
    );

    return res.json({
      success: true,
      message: "Payment verified successfully",
      newBidLimit: newBidLimit,
      currentPlanName: plan.planName,
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

exports.getSubscriptionHistory = async (req, res) => {
  try {
    const { farmerId } = req.params;

    if (!farmerId) {
      return res.status(400).json({
        success: false,
        message: "farmerId is required",
      });
    }

    const subscriptions = await FarmerSubscription.find({ farmerId })
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

exports.getCurrentSubscription = async (req, res) => {
  try {
    const { farmerId } = req.params;

    if (!farmerId) {
      return res.status(400).json({
        success: false,
        message: "farmerId is required",
      });
    }

    const farmer = await Farmer.findById(farmerId).select(
      "currentPlanName bidLimit subscriptionStartDate subscriptionEndDate userType"
    );
    if (!farmer) {
      return res.status(404).json({
        success: false,
        message: "Farmer not found",
      });
    }

    const activeSub = await FarmerSubscription.findOne({ farmerId, status: "active" })
      .populate("planId")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      currentPlanName: farmer.currentPlanName,
      bidLimit: farmer.bidLimit || 0,
      subscriptionStartDate: farmer.subscriptionStartDate,
      subscriptionEndDate: farmer.subscriptionEndDate,
      userType: farmer.userType,
      subscription: activeSub || null,
    });
  } catch (err) {
    console.error("Error in getCurrentSubscription:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
