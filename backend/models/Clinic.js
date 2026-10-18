
const mongoose = require('mongoose');

const clinicSchema = new mongoose.Schema({
    hospitalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hospital',
        required: true
    },
    name: {
        type: String,
        required: true
    },    
    roomNumber: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    services: {
        type: [String],
        default: []
    },
    timeSlots: {
        type: [String],
        default: []
    }
});

module.exports = mongoose.model('Clinic', clinicSchema);