
const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
    patientId: {   
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    hospitalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hospital',
        required: true
    },
    clinicId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Clinic',
    },
    clinicName: {
        type: String,
    },
    roomNumber: {
        type: String,
    },
    service: {
        type: String,
    },
    doctorName: {
        type: String,
        default: 'Dr. Wijesinghe'
    },
    appointmentDate: {
        type: Date,
        required: true
    },
    appointmentTime: {
        type: String,
        required: true
    },
    tokenNumber: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['scheduled', 'completed', 'cancelled'],
        default: 'scheduled'
    }
});

module.exports = mongoose.model('Appointment', appointmentSchema);