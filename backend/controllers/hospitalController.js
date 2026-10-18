require('dotenv').config();
const hospital = require('../models/Hospital');
const Clinic = require('../models/Clinic');
const asyncHandler = require('../middleware/asyncHandler');

const hospitalCreate = asyncHandler(async (req, res) => {

    const { name, district, category, assignedITLead } = req.body;

    if (!name || !district || !category || !assignedITLead) {
        res.status(400);
        throw new Error('All fields are required');
    }

    const hospitalExists = await hospital.findOne({ name });
    if (hospitalExists) {
        res.status(400);
        throw new Error('Hospital with this name already exists');
    }

    const newHospital = await hospital.create({
        name,
        district,
        category,
        assignedITLead
    });

    res.status(201).json({
        message: 'Hospital created successfully',
        hospital: newHospital
    });
});

const getHospitalDetails = asyncHandler(async (req, res) => {
    const { hospitalId } = req.body;

    if (!hospitalId) {
        res.status(400);
        throw new Error('Hospital ID is required');
    }

    const hospitalData = await hospital.findOne({ _id: hospitalId });

    if (!hospitalData) {
        res.status(404);
        throw new Error('Hospital not found');
    }

    res.status(200).json({
        success: true,
        hospital: hospitalData
    });
});


const updateHospitalDetails = asyncHandler(async (req, res) => {
    const { hospitalId, name, district, clinics } = req.body;

    const hospitalData = await hospital.findOne({ _id: hospitalId });

    if (!hospitalData) {
        res.status(404);
        throw new Error('Hospital not found to update');
    }

    hospitalData.name = name || hospitalData.name;
    hospitalData.district = district || hospitalData.district;
    hospitalData.clinics = clinics || hospitalData.clinics;

    const updatedHospital = await hospitalData.save();

    res.status(200).json({
        success: true,
        message: 'Hospital details updated successfully',
        data: updatedHospital,
    });
});

const deleteHospital = asyncHandler(async (req, res) => {
    const { hospitalId } = req.body;

    const hospitalData = await hospital.findOne({ _id: hospitalId });

    if (!hospitalData) {
        res.status(404);
        throw new Error('Hospital not found to delete');
    }

    await hospital.deleteOne({ _id: hospitalData._id });

    res.status(200).json({
        success: true,
        message: 'Hospital removed successfully',
    });
});

const getAllHospitals = asyncHandler(async (req, res) => {
    const hospitals = await hospital.find().lean();

    // Fetch active clinics for each hospital
    const allClinics = await Clinic.find({ status: { $ne: 'inactive' } }).lean();

    const clinicsMap = {};
    allClinics.forEach((c) => {
        const hId = c.hospitalId ? c.hospitalId.toString() : '';
        if (hId) {
            if (!clinicsMap[hId]) {
                clinicsMap[hId] = [];
            }
            clinicsMap[hId].push({
                ...c,
                clinicName: c.name, // backward compatibility
            });
        }
    });

    const enrichedHospitals = hospitals.map((h) => {
        const hIdStr = h._id.toString();
        const hospitalClinics = clinicsMap[hIdStr] || [];
        return {
            ...h,
            clinics: hospitalClinics,
            activeClinics: hospitalClinics.length
        };
    });

    res.status(200).json({
        success: true,
        data: enrichedHospitals
    });
});

const addClinicToHospital = async (hospitalId, newClinicData) => {
    try {
        const updatedHospital = await Hospital.findByIdAndUpdate(
            hospitalId,
            {
                $push: { clinics: newClinicData }
            },
            { new: true }
        );
        return updatedHospital;
    } catch (error) {
        console.error('Error adding clinic:', error);
    }
};


module.exports = {
    hospitalCreate,
    getHospitalDetails,
    updateHospitalDetails,
    deleteHospital,
    getAllHospitals,
    addClinicToHospital,
};