const mongoose = require("mongoose");
const { USER_TYPE_VALUES } = require("../constants/userTypes");

const traderSchema = new mongoose.Schema({
    userType: {
        type: String,
        enum: Object.values(USER_TYPE_VALUES),
        default: USER_TYPE_VALUES.TRADER_COMPANY,
    },
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
    gstVerifiedData: {
        businessName: String,
        legalName: String,
        pan: String,
        address: String,
        entityType: String,
        registrationType: String,
        status: String,
    },

    bidLimit: { type: Number, default: 5 },
    status: { type: String, default: "Inactive" },
    fcmToken: {
        type: String,
        default: null
    },

    // Extended profile data for specific userTypes
    profileData: { type: mongoose.Schema.Types.Mixed, default: {} },

    // Account deletion fields
    deletionRequested: { type: Boolean, default: false },
    deletionRequestedAt: Date,
    deletionStatus: {
        type: String,
        enum: ["active", "pending_deletion", "deleted"],
        default: "active"
    }
}, { timestamps: true });

module.exports = mongoose.model("Trader", traderSchema);
