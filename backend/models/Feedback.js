const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    patientId: {
      type: String,
      required: false,
    },
    patientName: {
      type: String,
      required: true,
    },
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      required: false,
    },
    hospitalName: {
      type: String,
      default: 'Kalutara General Hospital',
    },
    category: {
      type: String,
      enum: [
        'Doctor Consultation',
        'Queue Waiting Time',
        'Pharmacy Dispensary',
        'Laboratory Services',
        'Hospital Facilities',
      ],
      default: 'Doctor Consultation',
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    comment: {
      type: String,
      required: true,
    },
    response: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['submitted', 'reviewed', 'resolved'],
      default: 'submitted',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Feedback', feedbackSchema);
