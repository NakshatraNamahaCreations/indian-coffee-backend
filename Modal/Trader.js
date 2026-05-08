const mongoose = require("mongoose");

// Trader user type constants (7 types)
const TRADER_USER_TYPES = [
    'individual',
    'fpo_company',
    'trader_company',
    'curer_company',
    'roaster_company',
    'exporter_company',
    'cafe_retailer_company',
];

const traderSchema = new mongoose.Schema({
    userType: {
        type: String,
        enum: TRADER_USER_TYPES,
        default: 'trader_company',
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
