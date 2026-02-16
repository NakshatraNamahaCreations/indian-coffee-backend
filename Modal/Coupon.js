const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
    {
        couponName: { type: String, required: true, trim: true },
        couponCode: { type: String, required: true, trim: true, uppercase: true, unique: true },
        discount: { type: Number, default: 0 },
        description: { type: String, default: "", trim: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Coupon", couponSchema);
