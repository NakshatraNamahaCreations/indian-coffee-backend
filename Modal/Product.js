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

        availableData: { type: String },

        productImage: { type: String },

        agreeTermsAndCondition: { type: Boolean, default: false },
        lockedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Trader",
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
