const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Trader",
            required: true
        },
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },
        amount: {
            type: Number,
            required: true
        },
        paymentId: {
            type: String,
            required: true
        },
        orderId: {
            type: String
        },
        status: {
            type: String,
            enum: ["success", "failed"],
            default: "success"
        },
        purpose: {
            type: String,
            default: "LOCK_BID"
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);
