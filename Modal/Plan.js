const mongoose = require("mongoose");

const planSchema = new mongoose.Schema(
    {
        planImage: { type: String, default: "" },
        planName: { type: String, required: true, trim: true },
        planDescription: { type: String, default: "", trim: true },

        count: { type: Number, default: 0 },
        subscriptionAdded: { type: Boolean, default: false },

        price: { type: Number, default: 0 },
        durationDays: { type: Number, default: 30 },

        planType: { type: String, enum: ["monthly", "six_months", "yearly", "custom"], default: "custom" },

        isActive: { type: Boolean, default: true },

        planFor: { type: String, enum: ["trader", "farmer"], default: "trader" },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Plan", planSchema);
