const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
    },
    userName: {
        type: String,
        required: true,
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
    },
    productSnapshot: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
    },

    bidPricePerBag: { type: Number, required: true },
    quantityBags: { type: Number, required: true },
    advanceAmount: { type: Number, min: 0, required: true },
    messageToSeller: { type: String, default: '' },
    totalAmount: { type: Number, required: true },
    dueAmount: { type: Number, required: true },

    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'active', 'inactive'],
        default: 'pending',
    },

}, {
    timestamps: true,
});

module.exports = mongoose.model('Bid', bidSchema);