const mongoose = require("mongoose");

const vendorDataSchema = new mongoose.Schema(
  {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Farmer", // or Vendor model name (use your actual farmer model)
      required: true,
    },
    refre: { type: String, default: "farmer" },

    // ✅ bid/offer fields from farmer
    offeredQuantity: { type: Number, default: 0 },
    offeredPricePerUnit: { type: Number, default: 0 },
    note: { type: String, default: "" },

    vendorStatus: {
      type: String,
      enum: ["pending", "accepted", "rejected", "completed", "withdrawn"],
      default: "pending",
    },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    acceptedAt: { type: Date, default: null },
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
    availableQuantity: { type: Number, default: 0 },
    inventory: { type: Number, default: 0 },
    pricePerUnit: { type: Number },

    productImage: { type: String },
    desc: { type: String },

    userId: { type: mongoose.Schema.Types.ObjectId, ref: "Trader" },

    // ✅ multiple farmers can bid
    vendorData: { type: [vendorDataSchema], default: [] },

    approvalStatus: {
      type: String,
      enum: ["pending_admin", "admin_approved", "farmer_accepted", "final_admin_approved", "rejected"],
      default: "pending_admin",
    },

    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("requirement", requirementSchema);
