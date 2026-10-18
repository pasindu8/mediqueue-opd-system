const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema(
  {
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      required: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
    },
    doctorName: {
      type: String,
      required: true,
      default: 'Dr. Samantha Wickramasinghe',
    },
    clinicName: {
      type: String,
      default: 'General OPD',
    },
    roomNumber: {
      type: String,
      default: 'Room 03',
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
    },
    patientName: {
      type: String,
      required: true,
    },
    patientAge: {
      type: Number,
      default: 40,
    },
    patientGender: {
      type: String,
      default: 'Male',
    },
    tokenNumber: {
      type: String,
      required: true,
    },
    allergies: {
      type: [String],
      default: [],
    },
    medicines: [
      {
        id: { type: String },
        name: { type: String, required: true },
        dosage: { type: String, required: true },
        duration: { type: String, required: true },
        qty: { type: String, default: '10 Tabs' },
        instructions: { type: String, default: 'After meals' },
        isPacked: { type: Boolean, default: false },
      },
    ],
    notes: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'dispensed', 'skipped', 'cancelled'],
      default: 'pending',
    },
    dispensedBy: {
      type: String,
      default: '',
    },
    dispensedAt: {
      type: Date,
    },
    counter: {
      type: String,
      default: 'Counter 01 - Main OPD Dispensary',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Prescription', prescriptionSchema);
