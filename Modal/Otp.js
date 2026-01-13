const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
    {
        mobileNumber: {
            type: String,
            required: true,
            index: true,
        },

        otpHash: {
            type: String,
            required: true,
        },

        expiresAt: {
            type: Date,
            required: true,
            default: () => new Date(Date.now() + 30 * 1000), // ⏱ 30 seconds
            index: true,
        },
    },
    { timestamps: true }
);

// ⏱ Auto-delete OTP after expiry
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Otp", otpSchema);
