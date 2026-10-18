const mongoose = require('mongoose');

const pharmacySchema = new mongoose.Schema({
    hospitalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hospital',
        required: true
    },
    counter: {
        type: String,
        required: true
    },    
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: true
    }, 
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    }
});

module.exports = mongoose.model('Pharmacy', pharmacySchema);