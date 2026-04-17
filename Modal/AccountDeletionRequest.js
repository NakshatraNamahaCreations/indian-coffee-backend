const mongoose = require("mongoose");

const accountDeletionRequestSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true,
    },
    userType: {
        type: String,
        enum: ["trader", "farmer"],
        required: true,
    },
    userEmail: String,
    userName: String,
    reason: String,
    status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending",
    },
    requestedAt: { type: Date, default: Date.now },
    approvedAt: Date,
    approvedBy: String, // Admin email or ID
    rejectionReason: String,
    deletedAt: Date, // When the account was actually deleted
}, { timestamps: true });

module.exports = mongoose.model("AccountDeletionRequest", accountDeletionRequestSchema);
