require('dotenv').config();
const doctor = require('../models/Doctor');
const hospital = require('../models/Hospital');
const clinic = require('../models/Clinic');
const admin = require('../models/Admin');
const pharmacy = require('../models/Pharmacy');
const Prescription = require('../models/Prescription');
const Patient = require('../models/PatientDetails');
const asyncHandler = require('../middleware/asyncHandler');



const pharmacyCreate = asyncHandler(async (req, res) => {

    const { counter, staff, hospitalId, status } = req.body;
    
    if (!counter || !staff || !hospitalId || !status) {
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

    const pha = await pharmacy.create({
        adminId: adminExists._id,
        counter,
        hospitalId,
        status
    });

    res.status(201).json({
        message: 'Pharmacy profile created successfully',
        pharmacyId: pha._id,
    });
});



const updatePharmacy = asyncHandler(async (req, res) => {
    const { pharmacyId, id, counter, staff, status } = req.body;
    const targetId = pharmacyId || id;

    if (!targetId) {
        res.status(400);
        throw new Error('Pharmacy ID is required');
    }

    const pha = await pharmacy.findById(targetId);
    if (!pha) {
        res.status(404);
        throw new Error('Pharmacy counter not found');
    }

    if (staff) {
        const adminExists = await admin.findOne({ StaffID: staff });
        if (!adminExists) {
            res.status(400);
            throw new Error('Admin with this Staff ID does not exist');
        }
        pha.adminId = adminExists._id;
    }

    if (counter !== undefined) pha.counter = counter;
    if (status !== undefined) pha.status = status;

    const updatedPha = await pha.save();
    const populated = await pharmacy.findById(updatedPha._id).populate('adminId');

    res.status(200).json({
        success: true,
        message: 'Pharmacy counter updated successfully',
        data: populated,
    });
});

const deletePharmacy = asyncHandler(async (req, res) => {
    const { pharmacyId, id } = req.body;
    const targetId = pharmacyId || id;

    if (!targetId) {
        res.status(400);
        throw new Error('Pharmacy ID is required');
    }

    const pha = await pharmacy.findById(targetId);
    if (!pha) {
        res.status(404);
        throw new Error('Pharmacy counter not found');
    }

    await pharmacy.findByIdAndDelete(targetId);

    res.status(200).json({
        success: true,
        message: 'Pharmacy counter deleted successfully',
    });
});

const getAllhospitalpharmacies = asyncHandler(async (req, res) => {
    const { hospitalId } = req.body;

    const pharmacies = await pharmacy.find({ hospitalId: hospitalId }).populate('adminId');

    res.status(200).json({
        success: true,
        pharmacies: pharmacies,
    });
});

const createRefillRequest = asyncHandler(async (req, res) => {
    const { userId, patientId, medicineName, dosage, instructions, notes, hospitalId } = req.body;

    if (!medicineName) {
        res.status(400);
        throw new Error('Medicine name is required for refill request');
    }

    let pat = null;
    if (patientId) {
        pat = await Patient.findOne({ _id: patientId });
    }
    if (!pat && userId) {
        pat = await Patient.findOne({ userId });
    }

    let hosp = null;
    if (hospitalId) {
        hosp = await hospital.findById(hospitalId);
    }
    if (!hosp) {
        hosp = await hospital.findOne();
    }

    const count = await Prescription.countDocuments();
    const tokenNumber = `RX-${String(count + 1).padStart(3, '0')}`;

    const newPrescription = await Prescription.create({
        hospitalId: hosp ? hosp._id : null,
        doctorName: 'Dr. S. Wickramasinghe (OPD Refill)',
        clinicName: 'Outpatient Pharmacy Dispensary',
        patientId: pat ? pat._id : null,
        patientName: pat ? pat.fullName : 'Outpatient Patient',
        patientAge: pat ? pat.age : 35,
        patientGender: pat ? pat.gender : 'Male',
        tokenNumber,
        medicines: [
            {
                name: medicineName,
                dosage: dosage || '1 Tab Daily',
                duration: '14 Days',
                qty: '14 Tabs',
                instructions: instructions || 'Take after meals',
                isPacked: false,
            },
        ],
        notes: notes || 'Prescription refill requested via mobile app',
        status: 'pending',
        counter: 'Counter 01 - Main OPD Dispensary',
    });

    res.status(201).json({
        success: true,
        message: 'Prescription refill requested successfully',
        prescription: newPrescription,
    });
});

const updateRefillRequest = asyncHandler(async (req, res) => {
    const { prescriptionId, instructions, notes } = req.body;

    if (!prescriptionId) {
        res.status(400);
        throw new Error('Prescription ID is required');
    }

    const presc = await Prescription.findById(prescriptionId);
    if (!presc) {
        res.status(404);
        throw new Error('Prescription request not found');
    }

    if (notes !== undefined) presc.notes = notes;
    if (instructions && presc.medicines && presc.medicines.length > 0) {
        presc.medicines[0].instructions = instructions;
    }

    const updated = await presc.save();

    res.status(200).json({
        success: true,
        message: 'Refill request details updated successfully',
        prescription: updated,
    });
});

const cancelRefillRequest = asyncHandler(async (req, res) => {
    const { prescriptionId } = req.body;

    if (!prescriptionId) {
        res.status(400);
        throw new Error('Prescription ID is required');
    }

    const presc = await Prescription.findById(prescriptionId);
    if (!presc) {
        res.status(404);
        throw new Error('Prescription request not found');
    }

    await Prescription.findByIdAndDelete(prescriptionId);

    res.status(200).json({
        success: true,
        message: 'Prescription refill request cancelled successfully',
    });
});

module.exports = {
    pharmacyCreate,
    getAllhospitalpharmacies,
    updatePharmacy,
    deletePharmacy,
    createRefillRequest,
    updateRefillRequest,
    cancelRefillRequest,
};
