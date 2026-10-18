
const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({  
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: true
    }, 
    specialty: {
        type: String,
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
        required: true
    },
    status: {
      type: String,
      enum: ['Available', 'Busy', 'On-Leave', 'Offline'],
      default: 'Available',
    },
    
});

module.exports = mongoose.model('Doctor', doctorSchema);