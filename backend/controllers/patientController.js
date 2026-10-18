require('dotenv').config();
const patient = require('../models/PatientDetails');
const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');
const crypto = require('crypto');



const patientCreate = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { patientId, fullName, dateOfBirth, gender, age, address, emergencyContact, bloodGroup, knownAllergies, medicalHistory } = req.body;

    if (!fullName || !dateOfBirth || !gender || age === undefined || !address || !emergencyContact || !bloodGroup) {
        res.status(400);
        throw new Error('Full name, date of birth, gender, age, address, emergency contact, and blood group are required');
    }

    const useridCheck = await User.findById(userId);
    if (!useridCheck) {
        res.status(404);
        throw new Error('User account not found');
    }

    // Check if patient profile already exists for this user
    const existingProfile = await patient.findOne({ userId });
    if (existingProfile) {
        return res.status(200).json({
            success: true,
            message: 'Patient profile already exists',
            patientId: existingProfile._id,
            data: existingProfile
        });
    }

    // Auto-generate unique patientId if not provided by client
    const resolvedPatientId = patientId && String(patientId).trim() !== ''
        ? String(patientId).trim()
        : `PAT-${crypto.randomUUID()}`;

    const pati = await patient.create({
        userId,
        patientId: resolvedPatientId,
        fullName: String(fullName).trim(),
        dateOfBirth,
        gender,
        age,
        address,
        emergencyContact,
        bloodGroup: String(bloodGroup).trim(),
        knownAllergies: Array.isArray(knownAllergies) ? knownAllergies : (knownAllergies ? [knownAllergies] : []),
        medicalHistory: Array.isArray(medicalHistory) ? medicalHistory : (medicalHistory ? [medicalHistory] : [])
    });

    res.status(201).json({
        success: true,
        message: 'Patient profile created successfully',
        patientId: pati._id,
        data: pati
    });
});

const getPatientDetails = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  let patientData = await patient.findOne({ userId: userId });

  if (!patientData) {
    res.status(404);
    throw new Error('Patient not found');
  }

  res.status(200).json({
    success: true,
    _id: patientData._id,
    patientId: patientData.patientId,
    fullName: patientData.fullName,
    dateOfBirth: patientData.dateOfBirth,
    gender: patientData.gender,
    age: patientData.age,
    address: patientData.address,
    emergencyContact: patientData.emergencyContact,
    bloodGroup: patientData.bloodGroup,
    knownAllergies: patientData.knownAllergies,
    medicalHistory: patientData.medicalHistory,
  });

});


const updatePatientProfile = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { fullName, dateOfBirth, gender, age, address, emergencyContact, bloodGroup, knownAllergies, medicalHistory } = req.body;

    const patientProfile = await patient.findOne({ userId });

    if (!patientProfile) {
        res.status(404);
        throw new Error('Patient profile not found to update');
    }

    
    patientProfile.fullName = fullName || patientProfile.fullName;
    patientProfile.dateOfBirth = dateOfBirth || patientProfile.dateOfBirth;
    patientProfile.gender = gender || patientProfile.gender;
    patientProfile.age = age === undefined ? patientProfile.age : age;
    patientProfile.address = address || patientProfile.address;
    patientProfile.bloodGroup = bloodGroup || patientProfile.bloodGroup;
    patientProfile.emergencyContact = emergencyContact || patientProfile.emergencyContact;
    patientProfile.knownAllergies = Array.isArray(knownAllergies) ? knownAllergies : patientProfile.knownAllergies;
    patientProfile.medicalHistory = Array.isArray(medicalHistory) ? medicalHistory : patientProfile.medicalHistory;

    const updatedPatient = await patientProfile.save();

    res.status(200).json({
        success: true,
        message: 'Patient profile updated successfully',
        data: updatedPatient,
    });
});


const deletePatientProfile = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const patientProfile = await patient.findOne({ userId });

    if (!patientProfile) {
        res.status(404);
        throw new Error('Patient profile not found to delete');
    }

    await patient.deleteOne({ _id: patientProfile._id });

    res.status(200).json({
        success: true,
        message: 'Patient profile removed successfully',
    });
});


module.exports = {
    patientCreate,
    getPatientDetails,
    updatePatientProfile,
    deletePatientProfile,
};