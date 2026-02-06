const mongoose = require("mongoose");

const bidSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    userName: { type: String, required: true },

    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    productSnapshot: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },

    bidPricePerBag: { type: Number, required: true },
    quantityBags: { type: Number, required: true },
    advanceAmount: { type: Number, required: true },

    totalAmount: { type: Number, required: true },
    dueAmount: { type: Number, required: true },

    bidType: {
      type: String,
      enum: ["NORMAL", "LOCK"],
      default: "NORMAL",
    },

    status: {
      type: String,
      enum: [
        "pending",
        "vendor_accepted",
        "admin_approved",
        "rejected",
        "inactive",
        "vendor_rejected"
      ],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Bid", bidSchema);
