// Modal/Addrequirement.js
const mongoose = require("mongoose");

// Extra schema for vendor data
const vendorDataSchema = new mongoose.Schema(
  {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
    },
    refre: {
      // who accepted (farmer, etc.)
      type: String,
      default: "farmer",
    },
    vendorStatus: {
      type: String,
      enum: ["pending", "accepted", "rejected", "completed"],
      default: "pending", 
    },
    acceptedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const requirementSchema = new mongoose.Schema(
  {
    productTitle: { type: String, required: true },

    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    categoryName: { type: String },

    subcategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subcategory",
    },
    subcategoryName: { type: String },

    subsubcategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subsubcategory",
    },
    subsubcategoryName: { type: String },

    weightUnitId: { type: mongoose.Schema.Types.ObjectId, ref: "WeightUnit" },
    weightUnitName: { type: String },

    // main required quantity for requirement
    quantity: { type: Number },

    // ✅ Available quantity (remaining/stock)
    availableQuantity: { type: Number, default: 0 },

    // ✅ Inventory (total inventory or separate stock field)
    inventory: { type: Number, default: 0 },

    // price
    pricePerUnit: { type: Number },

    // image relative path: "/uploads/products/xxx.jpg"
    productImage: { type: String },
    desc: { type: String },

    userId: { type: mongoose.Schema.Types.ObjectId, ref: "Trader" },

    vendorData: { type: [vendorDataSchema], default: [] },

    approvalStatus: {
      type: String,
      enum: [
        "pending_admin",
        "admin_approved",
        "farmer_accepted",
        "final_admin_approved",
        "rejected",
      ],
      default: "pending_admin",
    },

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Inactive",
    },
  },
  { timestamps: true }
);

// model name can be "requirement" or "Requirement"
module.exports = mongoose.model("requirement", requirementSchema);
