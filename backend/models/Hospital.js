
const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    district: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    assignedITLead: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('Hospital', hospitalSchema);