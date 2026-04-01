const mongoose = require("mongoose");

const farmerSchema = new mongoose.Schema({
    userType: { type: String, enum: ["individual", "company","FPO"] },

    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    mobileNumber: { type: String, required: true },

    country: { type: String, default: "India" },
    state: { type: String, required: true },
    district: { type: String, required: true },
    townVillage: { type: String, required: true },
    pincode: { type: String, required: true },
    address: { type: String, required: true },

    termsAccepted: { type: Boolean, required: true },

    // Individual
    firstName: String,
    lastName: String,
    aadhaarFront: String,
    aadhaarBack: String,

    // Company
    businessName: String,
    panNumber: String,
    gstNumber: String,
    panImage: String,
    gstImage: String,
    registrationDocs: [String],

    bidLimit: { type: Number, default: 5 },

    // Subscription tracking
    currentPlanId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Plan",
        default: null,
    },
    currentPlanName: {
        type: String,
        default: null,
    },
    countBalance: {
        type: Number,
        default: 0,
    },
    monthlyCountUsed: {
        type: Number,
        default: 0,
    },
    countResetType: {
        type: String,
        enum: ["one-time", "monthly"],
        default: "one-time",
    },

    status: { type: String, default: "Inactive" },
    fcmToken: {
        type: String,
        default: null
    }
}, { timestamps: true });

module.exports = mongoose.model("Farmer", farmerSchema);
