const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
    {
        productTitle: { type: String, required: true },

        categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
        categoryName: { type: String },

        subcategoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Subcategory" },
        subcategoryName: { type: String },

        subsubcategoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Subsubcategory" },
        subsubcategoryName: { type: String },

        vendorName: { type: String },
        vendorId: { type: String },

        weightUnitId: { type: mongoose.Schema.Types.ObjectId, ref: "WeightUnit" },
        weightUnitName: { type: String },

        quantity: { type: Number },
        availableQuantity: { type: Number, default: 0, min: 0 },
        pricePerUnit: { type: Number },
        advancePayment: { type: Number },

        postHarvestProcess: { type: String },
        beanSize: { type: String },
        beanShape: { type: String },
        cropYear: { type: Number },
        scaScore: { type: Number },
        moisture: { type: String },
        maxDefects: { type: Number },
        minDefects: { type: Number },
        packagingForShipment: { type: String },
        minimumQuantity: { type: Number },

        country: { type: String },
        state: { type: String },
        cityDistrict: { type: String },
        pincode: { type: String },
        talukVillage: { type: String },
        address: { type: String },

        availableDate: {
            type: Date,
            // required: true,
        },

        productImages: { type: [String], default: [] },

        agreeTermsAndCondition: { type: Boolean, default: false },

        isLocked: {
            type: Boolean,
            default: false
        },
        lockedBy: {
            type: String,
            default: null
        },
        lockExpiresAt: {
            type: Date,
            default: null
        },
        status: { type: String, enum: ["Active", "Inactive"], default: "Inactive" },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
