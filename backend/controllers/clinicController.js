require('dotenv').config();
const Clinic = require('../models/Clinic');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const asyncHandler = require('../middleware/asyncHandler');
const axios = require('axios');
const crypto = require('crypto');



const allClinic = asyncHandler(async (req, res) => {

    const clinics = await Clinic.find({});
    res.status(200).json({
        success: true,
        data: clinics,
    });
});

const ClinicCreate = asyncHandler(async (req, res) => {

    const { hospitalId, name, roomNumber, status, services, timeSlots } = req.body;

    if (!hospitalId || !name || !roomNumber || !status || !services || !timeSlots) {
        res.status(400);
        throw new Error('All fields are required');
    }

    const clin = await Clinic.create({
        hospitalId,
        name,
        roomNumber,
        status,
        services,
        timeSlots
    });

    res.status(201).json({
        success: true,
        message: 'Clinic created successfully',
        clinicId: clin._id,
    });
});

const allashospitalClinic = asyncHandler(async (req, res) => {
    const { hospitalId } = req.body;
    const clinics = await Clinic.find({ hospitalId: hospitalId });
    res.status(200).json({
        success: true,
        data: clinics,
    });
});

const getClinicDetails = asyncHandler(async (req, res) => {
    const { clinicId } = req.body;

    const clinicExists = await Clinic.findOne({ _id: clinicId });
    if (!clinicExists) {
        res.status(400);
        throw new Error('Clinic with this ID does not exist');
    }

    res.status(200).json({
        success: true,
        data: clinicExists,
    });
});

const updateClinic = asyncHandler(async (req, res) => {
    const { clinicId, id, name, roomNumber, status, services, timeSlots } = req.body;
    const targetId = clinicId || id;

    if (!targetId) {
        res.status(400);
        throw new Error('Clinic ID is required');
    }

    const clinicExists = await Clinic.findById(targetId);
    if (!clinicExists) {
        res.status(404);
        throw new Error('Clinic with this ID does not exist');
    }

    if (name !== undefined) clinicExists.name = name;
    if (roomNumber !== undefined) clinicExists.roomNumber = roomNumber;
    if (status !== undefined) clinicExists.status = status;
    if (services !== undefined) {
        clinicExists.services = Array.isArray(services)
            ? services
            : (typeof services === 'string' ? services.split(',').map((s) => s.trim()).filter(Boolean) : clinicExists.services);
    }
    if (timeSlots !== undefined) {
        clinicExists.timeSlots = Array.isArray(timeSlots)
            ? timeSlots
            : (typeof timeSlots === 'string' ? timeSlots.split(',').map((t) => t.trim()).filter(Boolean) : clinicExists.timeSlots);
    }

    const updated = await clinicExists.save();

    res.status(200).json({
        success: true,
        message: 'Clinic updated successfully',
        data: updated,
    });
});

const deleteClinic = asyncHandler(async (req, res) => {
    const { clinicId, id } = req.body;
    const targetId = clinicId || id;

    if (!targetId) {
        res.status(400);
        throw new Error('Clinic ID is required');
    }

    const clinicExists = await Clinic.findById(targetId);
    if (!clinicExists) {
        res.status(404);
        throw new Error('Clinic with this ID does not exist');
    }

    await Clinic.findByIdAndDelete(targetId);

    res.status(200).json({
        success: true,
        message: 'Clinic deleted successfully',
    });
});

module.exports = {
    allClinic,
    ClinicCreate,
    allashospitalClinic,
    getClinicDetails,
    updateClinic,
    deleteClinic,
};
