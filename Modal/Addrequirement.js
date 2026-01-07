const mongoose = require("mongoose");

const vendorDataSchema = new mongoose.Schema(
    {
        vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor", required: true },
        acceptedAt: { type: Date, default: Date.now },
    },
    { _id: false }
);

const requirementSchema = new mongoose.Schema(
    {
        productTitle: { type: String, required: true },

        categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
        categoryName: { type: String },

        subcategoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Subcategory" },
        subcategoryName: { type: String },

        subsubcategoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Subsubcategory" },
        subsubcategoryName: { type: String },

        weightUnitId: { type: mongoose.Schema.Types.ObjectId, ref: "WeightUnit" },
        weightUnitName: { type: String },

        quantity: { type: Number },
        pricePerUnit: { type: Number },

        productImage: { type: String },
        desc: { type: String },

        userId: { type: mongoose.Schema.Types.ObjectId, ref: "Trader" },

        vendorData: { type: [vendorDataSchema], default: [] },

        approvalStatus: {
            type: String,
            enum: ["pending_admin", "admin_approved", "farmer_accepted", "final_admin_approved", "rejected"],
            default: "pending_admin",
        },

    },
    { timestamps: true }
);

module.exports = mongoose.model("requirement", requirementSchema);
