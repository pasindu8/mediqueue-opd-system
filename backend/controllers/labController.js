require('dotenv').config();
const doctor = require('../models/Doctor');
const hospital = require('../models/Hospital');
const clinic = require('../models/Clinic');
const admin = require('../models/Admin');
const lab = require('../models/Lab');

const asyncHandler = require('../middleware/asyncHandler');




const labCreate = asyncHandler(async (req, res) => {

    const { unit, staff, hospitalId, status, sampleTypes } = req.body;
    
    if (!unit || !staff || !hospitalId || !status || !sampleTypes) {
        res.status(400);
        throw new Error('All fields are required');
    }

    const adminExists = await admin.findOne({ StaffID: staff });

    if (!adminExists) {
        res.status(400);
        throw new Error('Admin with this ID does not exist');
    }
    
    const hospitalExists = await hospital.findOne({ _id: hospitalId });
    if (!hospitalExists) {
        res.status(400);
        throw new Error('Hospital with this ID does not exist');
    }

    const la = await lab.create({
        adminId: adminExists._id,
        unit,
        hospitalId,
        status,
        sampleTypes
    });

    res.status(201).json({
        message: 'Lab profile created successfully',
        labId: la._id,
    });
});




const updateLab = asyncHandler(async (req, res) => {
    const { labId, id, unit, staff, sampleTypes, status } = req.body;
    const targetId = labId || id;

    if (!targetId) {
        res.status(400);
        throw new Error('Lab ID is required');
    }

    const la = await lab.findById(targetId);
    if (!la) {
        res.status(404);
        throw new Error('Lab unit not found');
    }

    if (staff) {
        const adminExists = await admin.findOne({ StaffID: staff });
        if (!adminExists) {
            res.status(400);
            throw new Error('Admin with this Staff ID does not exist');
        }
        la.adminId = adminExists._id;
    }

    if (unit !== undefined) la.unit = unit;
    if (status !== undefined) la.status = status;
    if (sampleTypes !== undefined) {
        la.sampleTypes = Array.isArray(sampleTypes)
            ? sampleTypes
            : (typeof sampleTypes === 'string' ? sampleTypes.split(',').map((s) => s.trim()).filter(Boolean) : la.sampleTypes);
    }

    const updatedLab = await la.save();
    const populated = await lab.findById(updatedLab._id).populate('adminId');

    res.status(200).json({
        success: true,
        message: 'Lab unit updated successfully',
        data: populated,
    });
});

const deleteLab = asyncHandler(async (req, res) => {
    const { labId, id } = req.body;
    const targetId = labId || id;

    if (!targetId) {
        res.status(400);
        throw new Error('Lab ID is required');
    }

    const la = await lab.findById(targetId);
    if (!la) {
        res.status(404);
        throw new Error('Lab unit not found');
    }

    await lab.findByIdAndDelete(targetId);

    res.status(200).json({
        success: true,
        message: 'Lab unit deleted successfully',
    });
});

const getAllhospitalLabs = asyncHandler(async (req, res) => {
    const { hospitalId } = req.body;

    const labs = await lab.find({ hospitalId: hospitalId }).populate('adminId');

    res.status(200).json({
        success: true,
        labs: labs,
    });
});

module.exports = {
    labCreate,
    getAllhospitalLabs,
    updateLab,
    deleteLab,
};