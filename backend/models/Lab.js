const mongoose = require('mongoose');

const labSchema = new mongoose.Schema({
    hospitalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hospital',
        required: true
    },
    unit: {
        type: String,
        required: true
    },    
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: true
    }, 
    sampleTypes: {
        type: [String],
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    }
});

module.exports = mongoose.model('Lab', labSchema);