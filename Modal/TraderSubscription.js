const mongoose = require("mongoose");

const traderSubscriptionSchema = new mongoose.Schema(
  {
    traderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trader",
      required: true,
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plan",
      required: true,
    },
    planName: {
      type: String,
      default: "",
    },
    amount: {
      type: Number,
      default: 0,
    },
    bidCount: {
      type: Number,
      required: true,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
    },
    razorpayOrderId: {
      type: String,
      required: true,
      unique: true,
    },
    razorpayPaymentId: {
      type: String,
      default: null,
    },
    razorpaySignature: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "active", "expired", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("TraderSubscription", traderSubscriptionSchema);
