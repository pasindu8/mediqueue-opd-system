
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },    
    NIC: {
        type: String,
        unique: true,
        required: true
    },
    password:{
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    status: {
        type: String,
        required: true
    },
    verificationCode: {
        type: String
    },
    otpExpiresAt: {
        type: Date
    },
    otpAttempts: {
        type: Number,
        default: 0
    },
    phoneNumber: {
        type: String,
        unique: true,
        required: true
    }
});

module.exports = mongoose.model('User', userSchema);