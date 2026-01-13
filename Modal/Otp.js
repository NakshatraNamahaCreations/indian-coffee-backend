const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
    {
        mobileNumber: {
            type: String,
            required: true,
            index: true,
        },

        otp: {
            type: String,
            required: true,
        },

        expiresAt: {
            type: Date,
            required: true,
            default: () => new Date(Date.now() + 30 * 1000),
            index: true,
        },
    },
    { timestamps: true }
);

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Otp", otpSchema);
