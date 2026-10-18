const mongoose = require('mongoose');

const consultationSchema = new mongoose.Schema(
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
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
    },
    tokenNumber: {
      type: String,
      required: true,
    },
    patientName: {
      type: String,
      required: true,
    },
    diagnosis: {
      type: String,
      default: '',
    },
    doctorNotes: {
      type: String,
      default: '',
    },
    prescriptions: [
      {
        drug: String,
        dose: String,
        days: String,
      },
    ],
    labTests: [String],
    prescriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Prescription',
    },
    labOrderIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LabOrder',
      },
    ],
    status: {
      type: String,
      enum: ['in-progress', 'completed'],
      default: 'completed',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Consultation', consultationSchema);
