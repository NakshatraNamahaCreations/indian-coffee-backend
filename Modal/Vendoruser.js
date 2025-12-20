const mongoose = require("mongoose");

const vendorSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },

    companyName: { type: String },
    companyAddress: { type: String },
    gstNumber: { type: String },
    panNumber: { type: String },
    businessType: { type: String },
    website: { type: String },
    description: { type: String },
    companyLogo: { type: String },

}, { timestamps: true });

module.exports = mongoose.model("Vendor", vendorSchema);
