const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    userName: {
        type: String,
        required: true
    },
    userMobileNumber: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    type: {
        type: String
    },
    reason: {
        type: String
    }
}, { timestamps: true });

const User = mongoose.model('DeleteUser', userSchema);

module.exports = User;