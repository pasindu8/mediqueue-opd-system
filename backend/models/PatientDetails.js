
const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    patientId: {
        type: String,
        unique: true,
        required: true
    },
    fullName: {
        type: String,
        required: true
    },
    dateOfBirth: {
        type: Date,
        required: true
    },
    gender: {
        type: String,
        required: true
    },
    age: {
        type: Number,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    emergencyContact: {
        name: {
            type: String,
            required: true
        },
        relationship: {
            type: String,
            required: true
        },
        phoneNumber: {
            type: String,
            required: true
        }
    },
    bloodGroup: {
        type: String,
        required: true
    },
    knownAllergies: {
        type: [String],
        default: []
    },
    medicalHistory: {
        type: [String],
        default: []
    }
    
});

module.exports = mongoose.model('Patient', patientSchema);