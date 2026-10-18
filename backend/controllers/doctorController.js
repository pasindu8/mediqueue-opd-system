require('dotenv').config();
const doctor = require('../models/Doctor');
const hospital = require('../models/Hospital');
const clinic = require('../models/Clinic');
const admin = require('../models/Admin');
const asyncHandler = require('../middleware/asyncHandler');


const doctorCreate = asyncHandler(async (req, res) => {

    const { StaffID, specialty, hospitalId, clinicId, status } = req.body;

    if (!StaffID || !specialty || !hospitalId || !clinicId || !status) {
        res.status(400);
        throw new Error('All fields are required');
    }

    const adminExists = await admin.findOne({ StaffID: StaffID });

    if (!adminExists) {
        res.status(400);
        throw new Error('Admin with this ID does not exist');
    }

    const clinicExists = await clinic.findOne({ _id: clinicId });
    if (!clinicExists) {
        res.status(400);
        throw new Error('Clinic with this ID does not exist');
    }
    
    const hospitalExists = await hospital.findOne({ _id: hospitalId });
    if (!hospitalExists) {
        res.status(400);
        throw new Error('Hospital with this ID does not exist');
    }

    const Docto = await doctor.create({
        adminId: adminExists._id,
        specialty,
        hospitalId,
        clinicId,
        status
    });

    res.status(201).json({
        message: 'Doctor profile created successfully',
        doctorId: Docto._id,
    });
});

const getDoctorDetails = asyncHandler(async (req, res) => {
    const { doctorId } = req.body;

    const doctorExists = await doctor.findOne({ doctorId });
    if (!doctorExists) {
        res.status(400);
        throw new Error('Doctor ID is required');
    }

    res.status(200).json({
        success: true,
        doctorId: doctorExists.doctorId,
        name: doctorExists.name,
        specialty: doctorExists.specialty,
        slmcNumber: doctorExists.slmcNumber,
        hospitalId: doctorExists.hospitalId,
        phoneNumber: doctorExists.phoneNumber,
        availableSlots: doctorExists.availableSlots,
        status: doctorExists.status,
        clinicName: doctorExists.clinicName,
        roomNumber: doctorExists.roomNumber,
    });

});


const updateDoctorProfile = asyncHandler(async (req, res) => {
    const { doctorId, id, StaffID, slmc, specialty, clinicId, status, name, slmcNumber, phoneNumber, availableSlots, clinicName, roomNumber } = req.body;
    const targetId = doctorId || id;

    if (!targetId) {
        res.status(400);
        throw new Error('Doctor ID is required');
    }

    let doctorProfile = null;
    if (typeof targetId === 'string' && targetId.match(/^[0-9a-fA-F]{24}$/)) {
        doctorProfile = await doctor.findById(targetId);
    }
    if (!doctorProfile) {
        doctorProfile = await doctor.findOne({ doctorId: targetId });
    }

    if (!doctorProfile) {
        res.status(404);
        throw new Error('Doctor profile not found to update');
    }

    const staffIdentifier = StaffID || slmc;
    if (staffIdentifier) {
        const adminExists = await admin.findOne({ StaffID: staffIdentifier });
        if (!adminExists) {
            res.status(400);
            throw new Error('Admin/Staff with this SLMC/StaffID does not exist');
        }
        doctorProfile.adminId = adminExists._id;
    }

    if (specialty !== undefined) doctorProfile.specialty = specialty;
    if (clinicId !== undefined) {
        const clinicExists = await clinic.findById(clinicId);
        if (!clinicExists) {
            res.status(400);
            throw new Error('Clinic with this ID does not exist');
        }
        doctorProfile.clinicId = clinicId;
    }
    if (status !== undefined) doctorProfile.status = status;

    const updatedDoctor = await doctorProfile.save();
    const populated = await doctor.findById(updatedDoctor._id).populate('adminId').populate('clinicId');

    res.status(200).json({
        success: true,
        message: 'Doctor profile updated successfully',
        data: populated,
    });
});

const deleteDoctorProfile = asyncHandler(async (req, res) => {
    const { doctorId, id } = req.body;
    const targetId = doctorId || id;

    if (!targetId) {
        res.status(400);
        throw new Error('Doctor ID is required');
    }

    let doctorProfile = null;
    if (typeof targetId === 'string' && targetId.match(/^[0-9a-fA-F]{24}$/)) {
        doctorProfile = await doctor.findById(targetId);
    }
    if (!doctorProfile) {
        doctorProfile = await doctor.findOne({ doctorId: targetId });
    }

    if (!doctorProfile) {
        res.status(404);
        throw new Error('Doctor profile not found to delete');
    }

    await doctor.deleteOne({ _id: doctorProfile._id });

    res.status(200).json({
        success: true,
        message: 'Doctor profile removed successfully',
    });
});

const getAllDoctors = asyncHandler(async (req, res) => {
    const doctors = await doctor.find().populate('adminId').populate('clinicId');

    res.status(200).json({
        success: true,
        doctors: doctors,
    });
});

const getAllhospitalDoctors = asyncHandler(async (req, res) => {
    const { hospitalId } = req.body;

    const doctors = await doctor.find({ hospitalId: hospitalId }).populate('adminId').populate('clinicId');

    res.status(200).json({
        success: true,
        doctors: doctors,
    });
});

const getadminconnectedDoctor = asyncHandler(async (req, res) => {
    const { adminId } = req.body;

    const doctorProfile = await doctor.findOne({ adminId });
    
    if (!doctorProfile) {
        res.status(404);
        throw new Error('No doctor profile connected to this admin');
    }

    res.status(200).json({
        success: true,
        doctor:doctorProfile,
    });
});


module.exports = {
    doctorCreate,
    getDoctorDetails,
    updateDoctorProfile,
    deleteDoctorProfile,
    getAllDoctors,
    getAllhospitalDoctors,
    getadminconnectedDoctor,
};