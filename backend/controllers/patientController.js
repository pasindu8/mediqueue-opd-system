require('dotenv').config();
const patient = require('../models/PatientDetails');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const asyncHandler = require('../middleware/asyncHandler');
const axios = require('axios');
const crypto = require('crypto');



const patientCreate = asyncHandler(async (req, res) => {

    const { userId, patientId, fullName, dateOfBirth, gender, age, address, emergencyContact, bloodGroup, knownAllergies, medicalHistory } = req.body;

    if (!fullName || !dateOfBirth || !gender || !age || !address || !emergencyContact || !bloodGroup || !knownAllergies || !medicalHistory) {
        res.status(400);
        throw new Error('All fields are required');
    }

    const patientExists = await patient.findOne({ patientId });
    if (patientExists) {
        res.status(400);
        throw new Error('Patient with this ID already exists');
    }

    const useridCheck = await User.findOne({ _id: userId });

    if (!useridCheck) {
        res.status(400);
        throw new Error('User with this ID does not exist');
    }
    console.log('User ID:', userId);
    const pati = await patient.create({
        userId,
        patientId,
        fullName,
        dateOfBirth,
        gender,
        age,
        address,
        emergencyContact,
        bloodGroup,
        knownAllergies,
        medicalHistory
    });

    res.status(201).json({
        message: 'Patient profile created successfully',
        patientId: patient._id,
    });
});

const getPatientDetails = asyncHandler(async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    res.status(400);
    throw new Error('login required');
  }

  let patientData = await patient.findOne({ userId: userId });

  if (!patientData) {
    // Check if user exists in User collection
    let userData = null;
    try {
      userData = await User.findOne({ _id: userId });
    } catch (e) {
      // safe
    }

    if (!userData) {
      res.status(404);
      throw new Error('Patient not found');
    }

    return res.status(200).json({
      success: true,
      _id: userData._id,
      patientId: `MQ-${userData.phoneNumber || '001'}`,
      fullName: userData.name || 'Patient',
      age: 32,
      gender: 'Male',
      bloodGroup: 'B+',
      knownAllergies: [],
      medicalHistory: []
    });
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
    const { userId, fullName, dateOfBirth, gender, age, address, emergencyContact, bloodGroup, knownAllergies, medicalHistory } = req.body;

    const patientProfile = await patient.findOne({ userId });

    if (!patientProfile) {
        res.status(404);
        throw new Error('Patient profile not found to update');
    }

    
    patientProfile.fullName = fullName || patientProfile.fullName;
    patientProfile.dateOfBirth = dateOfBirth || patientProfile.dateOfBirth;
    patientProfile.gender = gender || patientProfile.gender;
    patientProfile.age = age || patientProfile.age;
    patientProfile.address = address || patientProfile.address;
    patientProfile.bloodGroup = bloodGroup || patientProfile.bloodGroup;
    patientProfile.emergencyContact = emergencyContact || patientProfile.emergencyContact;
    patientProfile.knownAllergies = knownAllergies || patientProfile.knownAllergies;
    patientProfile.medicalHistory = medicalHistory || patientProfile.medicalHistory;

    const updatedPatient = await patientProfile.save();

    res.status(200).json({
        success: true,
        message: 'Patient profile updated successfully',
        data: updatedPatient,
    });
});


const deletePatientProfile = asyncHandler(async (req, res) => {
    const { userId } = req.body;

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