
const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    StaffID: {
        type: String,
        unique: true,
        required: true
    },
    email: {
        type: String,
        unique: true,
        required: true
    },
    password: {
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
    phoneNumber: {
        type: String,
        unique: true,
    },
    role: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('Admin', adminSchema);