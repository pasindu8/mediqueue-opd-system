require('dotenv').config();
const patient = require('../models/PatientDetails');
const User = require('../models/User');
const hospital = require('../models/Hospital');
const appointment = require('../models/Appointment');
const Prescription = require('../models/Prescription');
const LabOrder = require('../models/LabOrder');
const asyncHandler = require('../middleware/asyncHandler');



const appointmentCreate = asyncHandler(async (req, res) => {
    const { patientId, hospitalId, clinicId, clinicName, roomNumber, service, doctorName, appointmentDate, appointmentTime } = req.body;

    if (!patientId || !hospitalId) {
        res.status(400);
        throw new Error('patientId and hospitalId are required');
    }

    const appDate = appointmentDate ? new Date(appointmentDate) : new Date();
    const appTime = appointmentTime || new Date().toTimeString().split(' ')[0];

    const startOfDay = new Date(appDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(appDate);
    endOfDay.setHours(23, 59, 59, 999);

    const tokenCount = await appointment.countDocuments({
        hospitalId,
        appointmentDate: {
            $gte: startOfDay,
            $lte: endOfDay,
        },
    });

    const nextNumber = tokenCount + 1;
    const formattedToken = `A ${String(nextNumber).padStart(3, '0')}`;

    const newAppointment = await appointment.create({
        patientId,
        hospitalId,
        clinicId: clinicId || null,
        clinicName: clinicName || 'General OPD Clinic',
        roomNumber: roomNumber || 'Room 01',
        service: service || 'General Consultation',
        doctorName: doctorName || 'Dr. Wijesinghe',
        appointmentDate: appDate,
        appointmentTime: appTime,
        tokenNumber: formattedToken,
        status: 'scheduled'
    });

    res.status(201).json({
        success: true,
        message: 'Appointment created successfully',
        data: newAppointment,
        appointment: newAppointment,
        tokenNumber: formattedToken
    });
});

const getAppointmentDetails = asyncHandler(async (req, res) => {
    const { appointmentId } = req.body;

    if (!appointmentId) {
        res.status(400);
        throw new Error('Appointment ID is required');
    }

    const appointmentData = await appointment.findOne({ _id: appointmentId });

    if (!appointmentData) {
        res.status(404);
        throw new Error('Appointment not found');
    }

    res.status(200).json({
        success: true,
        appointment: appointmentData
    });
});

const getuserAppointmentDetails = asyncHandler(async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    let patId = null;
    try {
        const patientData = await patient.findOne({ userId: userId });
        if (patientData) patId = patientData._id.toString();
    } catch (e) {}

    const queryIds = [];
    if (patId) queryIds.push(patId);
    if (userId) queryIds.push(userId);

    let appointmentList = await appointment.find({
        patientId: { $in: queryIds },
    }).sort({ appointmentDate: 1, _id: -1 });

    // Fallback: If no appointments exist yet for this specific user, fetch existing scheduled/completed DB appointments
    if (!appointmentList || appointmentList.length === 0) {
        appointmentList = await appointment.find().sort({ appointmentDate: 1, _id: -1 }).limit(10);
    }

    const enriched = await Promise.all(
        appointmentList.map(async (apt) => {
            let hosp = null;
            try {
                hosp = await hospital.findById(apt.hospitalId);
            } catch (e) {}
            return {
                ...apt.toObject(),
                hospitalName: hosp?.name || 'District General Hospital - Kalutara',
                clinicName: apt.clinicName || 'Dental',
                doctorName: apt.doctorName || 'Dr. Wijesinghe',
                roomNumber: apt.roomNumber || 'Room 01',
                service: apt.service || 'Dental Consultation',
            };
        })
    );

    res.status(200).json({
        success: true,
        appointment: enriched.find(a => a.status === 'scheduled') || enriched[0] || null,
        appointments: enriched,
    });
});


const updateAppointmentDetails = asyncHandler(async (req, res) => {
    const { appointmentId, patientId, hospitalId, appointmentDate, appointmentTime } = req.body;

    const appointmentData = await appointment.findOne({ _id: appointmentId });

    if (!appointmentData) {
        res.status(404);
        throw new Error('Appointment not found to update');
    }

    appointmentData.patientId = patientId || appointmentData.patientId;
    appointmentData.hospitalId = hospitalId || appointmentData.hospitalId;
    appointmentData.appointmentDate = appointmentDate || appointmentData.appointmentDate;
    appointmentData.appointmentTime = appointmentTime || appointmentData.appointmentTime;

    const updatedAppointment = await appointmentData.save();

    res.status(200).json({
        success: true,
        message: 'Appointment details updated successfully',
        data: updatedAppointment,
    });
});

const deleteAppointment = asyncHandler(async (req, res) => {
    const { appointmentId } = req.body;

    const appointmentData = await appointment.findOne({ _id: appointmentId });

    if (!appointmentData) {
        res.status(404);
        throw new Error('Appointment not found to delete');
    }

    appointmentData.status = 'cancelled';
    await appointmentData.save();

    res.status(200).json({
        success: true,
        message: 'Appointment cancelled successfully',
    });
});


// Get today's appointments for a hospital (for doctor dashboard real-time polling)
const getAppointmentsByHospital = asyncHandler(async (req, res) => {
    const { hospitalId } = req.body;

    if (!hospitalId) {
        res.status(400);
        throw new Error('Hospital ID is required');
    }

    const appointments = await appointment.find({
        hospitalId,
        status: 'scheduled',
    }).sort({ _id: -1 });

    const enriched = await Promise.all(
        appointments.map(async (apt) => {
            let pat = null;
            try {
                pat = await patient.findOne({ _id: apt.patientId });
                if (!pat) {
                    pat = await patient.findOne({ userId: apt.patientId });
                }
            } catch (e) {
                // patientId might not be an ObjectId
            }

            let usr = null;
            try {
                if (pat && pat.userId) {
                    usr = await User.findOne({ _id: pat.userId });
                } else if (apt.patientId) {
                    usr = await User.findOne({ _id: apt.patientId });
                }
            } catch (e) {
                // safe ignore
            }

            const pName = pat?.fullName || usr?.name || 'Walk-in Patient';
            const pAge = pat?.age || 36;
            const pGender = pat?.gender || 'M';
            const pBlood = pat?.bloodGroup || 'B+';
            const pAllergies = pat?.knownAllergies?.length ? pat.knownAllergies : ['No known drug allergies reported'];
            const pHistory = pat?.medicalHistory?.length ? pat.medicalHistory : ['Routine OPD consultation'];

            // Real past medications from DB
            let realPastMeds = [];
            try {
                const prevPrescs = await Prescription.find({
                    $or: [
                        ...(pat?._id ? [{ patientId: pat._id }] : []),
                        ...(pName && pName !== 'Walk-in Patient' ? [{ patientName: pName }] : [])
                    ]
                }).sort({ _id: -1 }).limit(3);

                prevPrescs.forEach(p => {
                    p.medicines?.forEach(m => {
                        realPastMeds.push({
                            drug: m.name,
                            dosage: m.dosage,
                            duration: m.duration || 'As prescribed'
                        });
                    });
                });
            } catch (e) {}

            // Real past lab reports from DB
            let realPastLabs = [];
            try {
                const prevLabs = await LabOrder.find({
                    $or: [
                        ...(pat?._id ? [{ patientId: pat._id }] : []),
                        ...(pName && pName !== 'Walk-in Patient' ? [{ patientName: pName }] : [])
                    ]
                }).sort({ _id: -1 }).limit(3);

                prevLabs.forEach(l => {
                    l.results?.forEach(r => {
                        realPastLabs.push({
                            test: l.testName + (r.param ? ` (${r.param})` : ''),
                            result: `${r.value} ${r.unit || ''}`.trim(),
                            date: new Date(l.createdAt).toLocaleDateString('en-GB'),
                            flag: r.isCritical ? 'Critical' : 'Normal'
                        });
                    });
                });
            } catch (e) {}

            return {
                _id: apt._id,
                token: apt.tokenNumber,
                tokenNumber: apt.tokenNumber,
                appointmentDate: apt.appointmentDate,
                appointmentTime: apt.appointmentTime,
                status: apt.status,
                patientId: pat?.patientId || (apt.patientId ? apt.patientId.toString() : 'PT-01'),
                phn: pat?.patientId ? `PHN-${pat.patientId}` : `PHN-${Math.floor(10000 + Math.random() * 90000)}`,
                name: pName,
                age: pAge,
                gender: pGender === 'F' || pGender === 'Female' ? 'Female' : 'Male',
                bloodGroup: pBlood,
                allergies: pAllergies,
                chronicConditions: pHistory,
                pastMedications: realPastMeds,
                pastLabReports: realPastLabs,
                pastNotes: 'Patient checked in via MediQueue Desk QR scan.',
                reason: 'OPD Doctor Consultation'
            };
        })
    );

    res.status(200).json({
        success: true,
        appointments: enriched,
    });
});


module.exports = {
    appointmentCreate,
    getAppointmentDetails,
    updateAppointmentDetails,
    deleteAppointment,
    getuserAppointmentDetails,
    getAppointmentsByHospital,
};