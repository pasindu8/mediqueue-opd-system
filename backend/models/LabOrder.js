const mongoose = require('mongoose');

const labOrderSchema = new mongoose.Schema(
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
    testName: {
      type: String,
      required: true,
    },
    sampleType: {
      type: String,
      default: 'Whole Blood (EDTA Tube)',
    },
    priority: {
      type: String,
      enum: ['Routine', 'High Priority', 'Urgent STAT'],
      default: 'Routine',
    },
    results: [
      {
        id: { type: String },
        param: { type: String, required: true },
        value: { type: String, default: '' },
        unit: { type: String, default: '' },
        refRange: { type: String, default: '' },
        isCritical: { type: Boolean, default: false },
      },
    ],
    isCriticalFlagged: {
      type: Boolean,
      default: false,
    },
    criticalNote: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'verified', 'cancelled'],
      default: 'pending',
    },
    verifiedBy: {
      type: String,
      default: '',
    },
    verifiedAt: {
      type: Date,
    },
    unit: {
      type: String,
      default: 'Central Diagnostic Lab - Phlebotomy',
    },
    reportFile: {
      type: String,
      default: '',
    },
    reportFileName: {
      type: String,
      default: '',
    },
    reportFileSize: {
      type: String,
      default: '',
    },
    reportMimeType: {
      type: String,
      default: '',
    },
    reportUploadedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('LabOrder', labOrderSchema);
