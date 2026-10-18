require('dotenv').config();
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const Doctor = require('../models/Doctor');
const Hospital = require('../models/Hospital');
const Clinic = require('../models/Clinic');
const Lab = require('../models/Lab');
const Pharmacy = require('../models/Pharmacy');
const Appointment = require('../models/Appointment');
const Patient = require('../models/PatientDetails');
const User = require('../models/User');
const Prescription = require('../models/Prescription');
const LabOrder = require('../models/LabOrder');
const Consultation = require('../models/Consultation');
const asyncHandler = require('../middleware/asyncHandler');

// 1. DOCTOR DESK INFO
const getDoctorDeskInfo = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const queryEmail = (email || 'samantha.w@mediqueue.lk').trim().toLowerCase();
  const adminUser = await Admin.findOne({
    email: { $regex: new RegExp(`^${queryEmail}$`, 'i') },
  });

  if (!adminUser) {
    return res.status(404).json({ success: false, message: 'Doctor admin account not found' });
  }

  const doctorProfile = await Doctor.findOne({ adminId: adminUser._id });

  let hospitalData = null;
  let clinicData = null;

  if (doctorProfile) {
    hospitalData = await Hospital.findById(doctorProfile.hospitalId);
    clinicData = await Clinic.findById(doctorProfile.clinicId);
  }

  // Fallback defaults if not linked yet
  if (!hospitalData) {
    hospitalData = await Hospital.findOne({ name: { $regex: /Kalutara/i } }) || await Hospital.findOne();
  }

  const deskInfo = {
    doctorId: doctorProfile?._id || adminUser._id,
    adminId: adminUser._id,
    name: adminUser.name || 'Dr. Samantha Wickramasinghe',
    staffId: adminUser.StaffID,
    email: adminUser.email,
    specialty: doctorProfile?.specialty || 'Consultant Physician',
    hospitalId: hospitalData?._id,
    hospitalName: hospitalData?.name || 'District General Hospital - Kalutara',
    clinicId: clinicData?._id,
    clinicName: clinicData?.name || 'General OPD Clinic',
    roomNumber: clinicData?.roomNumber || 'Room 03',
    qrCodeString: JSON.stringify({
      desk: clinicData?.roomNumber || 'Room 03',
      clinic: clinicData?.name || 'General OPD',
      doctor: adminUser.name || 'Dr. Samantha Wickramasinghe',
      hospital: hospitalData?.name || 'District General Hospital - Kalutara',
      timestamp: new Date().toISOString(),
    }),
  };

  res.status(200).json({ success: true, data: deskInfo });
});

// 2. DOCTOR WAITING QUEUE & STATS
const getDoctorQueue = asyncHandler(async (req, res) => {
  const { hospitalId } = req.body;

  let queryHospitalId = hospitalId;
  if (!queryHospitalId || !mongoose.Types.ObjectId.isValid(queryHospitalId)) {
    const kalutara = await Hospital.findOne({ name: { $regex: /Kalutara/i } }) || await Hospital.findOne();
    queryHospitalId = kalutara?._id;
  }

  // Find scheduled appointments
  const appointments = await Appointment.find({
    hospitalId: queryHospitalId,
    status: 'scheduled',
  }).sort({ appointmentDate: 1, tokenNumber: 1 });

  const waitingQueue = [];

  for (const appt of appointments) {
    let patientDetails = await Patient.findById(appt.patientId);
    if (!patientDetails) {
      patientDetails = await Patient.findOne({ userId: appt.patientId });
    }

    waitingQueue.push({
      appointmentId: appt._id,
      patientDbId: patientDetails?._id || null,
      token: appt.tokenNumber || `A${String(waitingQueue.length + 1).padStart(3, '0')}`,
      name: patientDetails?.fullName || 'Patient ' + appt.tokenNumber,
      age: patientDetails?.age || 35,
      gender: patientDetails?.gender === 'Female' ? 'F' : 'M',
      reason: 'General Consultation & Follow-up',
      bloodGroup: patientDetails?.bloodGroup || 'O+',
      allergies: patientDetails?.knownAllergies || [],
      chronicConditions: patientDetails?.medicalHistory || [],
    });
  }

  // Count consultations today
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const consultationsTodayCount = await Consultation.countDocuments({
    createdAt: { $gte: startOfDay },
  });

  res.status(200).json({
    success: true,
    waitingQueue,
    stats: {
      consultationsToday: consultationsTodayCount,
      queueCount: waitingQueue.length,
    },
  });
});

// 3. PATIENT MEDICAL PASSPORT (HISTORY)
const getPatientPassport = asyncHandler(async (req, res) => {
  const { token, name, patientId } = req.body;

  let patientData = null;
  if (patientId && mongoose.Types.ObjectId.isValid(patientId)) {
    patientData = await Patient.findById(patientId);
  }

  if (!patientData && name) {
    patientData = await Patient.findOne({ fullName: { $regex: new RegExp(name.trim(), 'i') } });
  }

  if (!patientData) {
    patientData = await Patient.findOne();
  }

  // Find past prescriptions
  const pastPrescriptions = await Prescription.find({
    $or: [
      { patientName: { $regex: new RegExp(name || patientData?.fullName || '', 'i') } },
      { patientId: patientData?._id },
      { status: 'dispensed' },
    ],
  }).sort({ createdAt: -1 }).limit(3);

  // Find past lab reports
  const pastLabReports = await LabOrder.find({
    $or: [
      { patientName: { $regex: new RegExp(name || patientData?.fullName || '', 'i') } },
      { patientId: patientData?._id },
      { status: 'verified' },
    ],
  }).sort({ createdAt: -1 }).limit(6);

  // Format past lab reports
  const formattedLabReports = pastLabReports.map((lab) => {
    const topParam = lab.results?.[0];
    const summary = topParam
      ? `${topParam.param}: ${topParam.value} ${topParam.unit || ''}`.trim()
      : (lab.results?.length ? `${lab.results.length} parameters` : 'Results verified');
    return {
      _id: lab._id,
      token: lab.tokenNumber,
      test: lab.testName,
      result: summary,
      results: lab.results || [],
      date: lab.verifiedAt ? new Date(lab.verifiedAt).toLocaleDateString('en-GB') : new Date(lab.createdAt).toLocaleDateString('en-GB'),
      flag: lab.isCriticalFlagged ? 'High' : 'Normal',
      status: lab.status,
      reportFile: lab.reportFile || '',
      reportFileName: lab.reportFileName || '',
      reportFileSize: lab.reportFileSize || '',
      reportUploadedAt: lab.reportUploadedAt,
      verifiedBy: lab.verifiedBy || '',
    };
  });

  // Find past doctor consultations
  const pastConsultations = await Consultation.find({
    $or: [
      { patientName: { $regex: new RegExp(name || patientData?.fullName || '', 'i') } },
      { patientId: patientData?._id },
    ],
  }).sort({ createdAt: -1 }).limit(1);

  // Format past medications
  const formattedMedications = [];
  pastPrescriptions.forEach((presc) => {
    presc.medicines.forEach((med) => {
      formattedMedications.push({
        drug: med.name,
        dosage: med.dosage,
        duration: med.duration || 'Monthly refill',
      });
    });
  });

  const medicalPassport = {
    token: token || 'A001',
    phn: patientData?.patientId ? `PHN-${patientData.patientId}` : '',
    name: patientData?.fullName || name || 'Patient',
    age: patientData?.age || 0,
    gender: patientData?.gender || 'Not specified',
    bloodGroup: patientData?.bloodGroup || 'Not specified',
    lastVisitDate: pastConsultations[0]?.createdAt ? new Date(pastConsultations[0].createdAt).toLocaleDateString('en-GB') : 'First Visit',
    allergies: patientData?.knownAllergies?.length
      ? patientData.knownAllergies
      : ['No known drug allergies reported'],
    chronicConditions: patientData?.medicalHistory?.length
      ? patientData.medicalHistory
      : ['None documented'],
    pastMedications: formattedMedications,
    pastLabReports: formattedLabReports,
    pastNotes: pastConsultations[0]?.doctorNotes || 'No previous consultation records.',
  };

  res.status(200).json({ success: true, data: medicalPassport });
});

// 4. FINISH CONSULTATION (Saves consultation, sends prescription to pharmacy, sends lab order to lab)
const finishConsultation = asyncHandler(async (req, res) => {
  const {
    hospitalId,
    doctorId,
    doctorName,
    clinicName,
    roomNumber,
    tokenNumber,
    patientId,
    patientName,
    patientAge,
    patientGender,
    allergies,
    diagnosis,
    doctorNotes,
    prescriptions,
    selectedLabTests,
  } = req.body;

  let queryHospitalId = hospitalId;
  if (!queryHospitalId || !mongoose.Types.ObjectId.isValid(queryHospitalId)) {
    const kalutara = await Hospital.findOne({ name: { $regex: /Kalutara/i } }) || await Hospital.findOne();
    queryHospitalId = kalutara?._id;
  }

  let createdPrescription = null;
  let createdLabOrders = [];

  // A. Transmit Prescriptions to Pharmacy Counter
  if (Array.isArray(prescriptions) && prescriptions.length > 0) {
    const formattedMedicines = prescriptions.map((p, idx) => ({
      id: String(p.id || idx + 1),
      name: p.drug,
      dosage: p.dose,
      duration: p.days || '3 Days',
      qty: p.days?.includes('30') ? '30 Tabs' : p.days?.includes('14') ? '14 Caps' : '12 Tabs',
      instructions: p.dose?.toLowerCase().includes('before') ? 'Before meals' : 'After meals',
      isPacked: false,
    }));

    createdPrescription = await Prescription.create({
      hospitalId: queryHospitalId,
      doctorId: mongoose.Types.ObjectId.isValid(doctorId) ? doctorId : undefined,
      doctorName: doctorName || 'Dr. Samantha Wickramasinghe',
      clinicName: clinicName || 'General OPD',
      roomNumber: roomNumber || 'Room 03',
      patientId: mongoose.Types.ObjectId.isValid(patientId) ? patientId : undefined,
      patientName: patientName || 'Patient',
      patientAge: patientAge || 40,
      patientGender: patientGender || 'Male',
      tokenNumber: tokenNumber || 'A 001',
      allergies: allergies || [],
      medicines: formattedMedicines,
      notes: doctorNotes || '',
      status: 'pending',
    });
  }

  // B. Route Lab Investigations to Laboratory
  if (Array.isArray(selectedLabTests) && selectedLabTests.length > 0) {
    // Standard parameter definitions for common lab test panels
    const defaultParamsForTest = {
      'Full Blood Count (FBC)': [
        { id: 'wbc', param: 'White Blood Cells (WBC)', value: '7.4', unit: '10^3/uL', refRange: '4.0 - 11.0', isCritical: false },
        { id: 'plt', param: 'Platelet Count', value: '240000', unit: 'cells/mm³', refRange: '150,000 - 450,000', isCritical: false },
        { id: 'hb', param: 'Hemoglobin (Hb)', value: '14.2', unit: 'g/dL', refRange: '13.0 - 17.0', isCritical: false },
        { id: 'pcv', param: 'Hematocrit (PCV)', value: '42', unit: '%', refRange: '40 - 52', isCritical: false },
      ],
      'Dengue NS1 Antigen Rapid': [
        { id: 'ns1', param: 'Dengue NS1 Antigen Rapid', value: 'POSITIVE (+)', unit: 'Result', refRange: 'Negative', isCritical: true },
        { id: 'plt', param: 'Platelet Count', value: '28000', unit: 'cells/mm³', refRange: '150,000 - 450,000', isCritical: true },
      ],
      'Fasting Blood Sugar (FBS)': [
        { id: 'fbs', param: 'Fasting Blood Sugar', value: '118', unit: 'mg/dL', refRange: '70 - 100', isCritical: false },
      ],
      'Serum Creatinine & Electrolytes': [
        { id: 'creat', param: 'Serum Creatinine', value: '1.2', unit: 'mg/dL', refRange: '0.7 - 1.3', isCritical: false },
        { id: 'k', param: 'Potassium (K+)', value: '4.2', unit: 'mmol/L', refRange: '3.5 - 5.0', isCritical: false },
      ],
      'Urine Full Report (UFR)': [
        { id: 'pus', param: 'Pus Cells', value: '2-4', unit: '/HPF', refRange: '0 - 5', isCritical: false },
        { id: 'rbc', param: 'Red Blood Cells', value: 'Nil', unit: '/HPF', refRange: 'Nil', isCritical: false },
      ],
      'Lipid Profile': [
        { id: 'chol', param: 'Total Cholesterol', value: '195', unit: 'mg/dL', refRange: '< 200', isCritical: false },
        { id: 'tg', param: 'Triglycerides', value: '140', unit: 'mg/dL', refRange: '< 150', isCritical: false },
      ],
    };

    for (const testName of selectedLabTests) {
      const params = defaultParamsForTest[testName] || [
        { id: 'res1', param: testName, value: '', unit: 'Result', refRange: 'Normal', isCritical: false },
      ];

      const sampleType =
        testName.includes('Urine') ? 'Clean Catch Urine' :
        testName.includes('Sugar') || testName.includes('FBS') ? 'Fluoride Plasma' :
        testName.includes('Creatinine') || testName.includes('Lipid') ? 'Serum Clot Activator' :
        'Whole Blood (EDTA Tube)';

      const labOrder = await LabOrder.create({
        hospitalId: queryHospitalId,
        doctorId: mongoose.Types.ObjectId.isValid(doctorId) ? doctorId : undefined,
        doctorName: doctorName || 'Dr. Samantha Wickramasinghe',
        clinicName: clinicName || 'General OPD',
        roomNumber: roomNumber || 'Room 03',
        patientId: mongoose.Types.ObjectId.isValid(patientId) ? patientId : undefined,
        patientName: patientName || 'Patient',
        patientAge: patientAge || 40,
        patientGender: patientGender || 'Male',
        tokenNumber: tokenNumber || 'A 001',
        testName,
        sampleType,
        priority: testName.includes('Dengue') ? 'High Priority' : 'Routine',
        results: params,
        status: 'pending',
      });

      createdLabOrders.push(labOrder);
    }
  }

  // C. Save Consultation History
  const consultation = await Consultation.create({
    hospitalId: queryHospitalId,
    doctorId: mongoose.Types.ObjectId.isValid(doctorId) ? doctorId : undefined,
    doctorName: doctorName || 'Dr. Samantha Wickramasinghe',
    patientId: mongoose.Types.ObjectId.isValid(patientId) ? patientId : undefined,
    tokenNumber: tokenNumber || 'A 001',
    patientName: patientName || 'Patient',
    diagnosis: diagnosis || 'General OPD assessment',
    doctorNotes: doctorNotes || '',
    prescriptions: prescriptions || [],
    labTests: selectedLabTests || [],
    prescriptionId: createdPrescription?._id,
    labOrderIds: createdLabOrders.map((l) => l._id),
    status: 'completed',
  });

  // D. Update Appointment status to 'completed'
  if (tokenNumber) {
    await Appointment.updateOne(
      { tokenNumber: tokenNumber, status: 'scheduled' },
      { $set: { status: 'completed' } }
    );
  }

  res.status(201).json({
    success: true,
    message: 'Consultation completed and clinical orders transmitted successfully',
    consultationId: consultation._id,
    prescription: createdPrescription,
    labOrders: createdLabOrders,
  });
});

// 5. PHARMACY INCOMING QUEUE & DISPENSED STATS
const getPharmacyQueue = asyncHandler(async (req, res) => {
  const { hospitalId } = req.body;

  let queryHospitalId = hospitalId;
  if (!queryHospitalId || !mongoose.Types.ObjectId.isValid(queryHospitalId)) {
    const kalutara = await Hospital.findOne({ name: { $regex: /Kalutara/i } }) || await Hospital.findOne();
    queryHospitalId = kalutara?._id;
  }

  // Find all pending prescriptions
  const pendingPrescriptions = await Prescription.find({
    hospitalId: queryHospitalId,
    status: 'pending',
  }).sort({ createdAt: 1 });

  // Count dispensed today
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const dispensedTodayCount = await Prescription.countDocuments({
    hospitalId: queryHospitalId,
    status: 'dispensed',
    updatedAt: { $gte: startOfDay },
  });

  // Format prescriptions for Pharmacy Dashboard
  const formattedQueue = pendingPrescriptions.map((p) => ({
    _id: p._id,
    token: p.tokenNumber,
    patientName: p.patientName,
    age: p.patientAge || 40,
    gender: p.patientGender || 'Adult',
    doctor: p.doctorName,
    clinic: p.clinicName || 'General OPD',
    timeReceived: 'Just now',
    allergies: p.allergies || ['None reported'],
    itemsCount: p.medicines?.length || 0,
    medicines: p.medicines || [],
  }));

  const activePrescription = formattedQueue[0] || null;
  const incomingQueue = formattedQueue.slice(1);

  res.status(200).json({
    success: true,
    activePrescription,
    incomingQueue,
    dispensedCount: dispensedTodayCount,
  });
});

// 6. PHARMACY DISPENSE PRESCRIPTION
const dispensePrescription = asyncHandler(async (req, res) => {
  const { prescriptionId, token, pharmacistName, counter } = req.body;

  const query = {};
  if (prescriptionId && mongoose.Types.ObjectId.isValid(prescriptionId)) {
    query._id = prescriptionId;
  } else if (token) {
    query.tokenNumber = token;
    query.status = 'pending';
  } else {
    res.status(400);
    throw new Error('Prescription ID or Token is required');
  }

  const updated = await Prescription.findOneAndUpdate(
    query,
    {
      $set: {
        status: 'dispensed',
        dispensedBy: pharmacistName || 'Ruwan Jayawardena (RPh)',
        dispensedAt: new Date(),
        counter: counter || 'Dispensary Counter 01',
      },
    },
    { new: true }
  );

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const totalDispensed = await Prescription.countDocuments({
    status: 'dispensed',
    updatedAt: { $gte: startOfDay },
  });

  res.status(200).json({
    success: true,
    message: 'Prescription marked as dispensed',
    data: updated,
    dispensedCount: totalDispensed,
  });
});

// 7. PHARMACY SKIP PRESCRIPTION
const skipPrescription = asyncHandler(async (req, res) => {
  const { prescriptionId, token } = req.body;

  const query = {};
  if (prescriptionId && mongoose.Types.ObjectId.isValid(prescriptionId)) {
    query._id = prescriptionId;
  } else if (token) {
    query.tokenNumber = token;
  }

  await Prescription.findOneAndUpdate(query, {
    $set: { status: 'skipped' },
  });

  res.status(200).json({ success: true, message: 'Prescription marked as skipped' });
});

// 8. LAB INCOMING QUEUE & COMPLETED STATS
const getLabQueue = asyncHandler(async (req, res) => {
  const { hospitalId } = req.body;

  let queryHospitalId = hospitalId;
  if (!queryHospitalId || !mongoose.Types.ObjectId.isValid(queryHospitalId)) {
    const kalutara = await Hospital.findOne({ name: { $regex: /Kalutara/i } }) || await Hospital.findOne();
    queryHospitalId = kalutara?._id;
  }

  // Find all pending lab orders for this hospital
  let pendingOrders = [];
  if (queryHospitalId) {
    pendingOrders = await LabOrder.find({
      hospitalId: queryHospitalId,
      status: 'pending',
    }).sort({ createdAt: 1 });
  }

  // Fallback: If no pending orders found for specific hospitalId, fetch any pending orders so they are never lost
  if (!pendingOrders || pendingOrders.length === 0) {
    pendingOrders = await LabOrder.find({ status: 'pending' }).sort({ createdAt: 1 });
  }

  // Count verified today
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  let verifiedTodayCount = 0;
  if (queryHospitalId) {
    verifiedTodayCount = await LabOrder.countDocuments({
      hospitalId: queryHospitalId,
      status: 'verified',
      updatedAt: { $gte: startOfDay },
    });
  }

  if (verifiedTodayCount === 0) {
    verifiedTodayCount = await LabOrder.countDocuments({
      status: 'verified',
      updatedAt: { $gte: startOfDay },
    });
  }

  // Find recent verified lab orders for reference
  let recentCompletedOrders = [];
  try {
    const recentQuery = { status: 'verified' };
    if (queryHospitalId) {
      recentQuery.hospitalId = queryHospitalId;
    }
    recentCompletedOrders = await LabOrder.find(recentQuery)
      .sort({ verifiedAt: -1, updatedAt: -1 })
      .limit(10);
  } catch (e) {
    console.error('Error fetching recent completed orders:', e);
  }

  // Format orders for Lab Dashboard
  const formattedQueue = pendingOrders.map((o) => ({
    _id: o._id,
    token: o.tokenNumber,
    patientName: o.patientName,
    age: o.patientAge || 40,
    gender: o.patientGender || 'Adult',
    doctor: o.doctorName,
    clinic: o.clinicName || 'General OPD',
    sampleType: o.sampleType || 'Whole Blood (EDTA Tube)',
    timeCollected: 'Recent',
    testName: o.testName,
    priority: o.priority || 'Routine',
    results: o.results || [],
    isCriticalFlagged: o.isCriticalFlagged || false,
    criticalNote: o.criticalNote || '',
    reportFile: o.reportFile || '',
    reportFileName: o.reportFileName || '',
    reportFileSize: o.reportFileSize || '',
    reportUploadedAt: o.reportUploadedAt || null,
  }));

  const activeTest = formattedQueue[0] || null;
  const incomingQueue = formattedQueue.slice(1);

  res.status(200).json({
    success: true,
    activeTest,
    incomingQueue,
    completedCount: verifiedTodayCount,
    recentCompletedOrders: recentCompletedOrders.map((o) => ({
      _id: o._id,
      token: o.tokenNumber,
      patientName: o.patientName,
      doctor: o.doctorName,
      testName: o.testName,
      status: o.status,
      results: o.results || [],
      verifiedAt: o.verifiedAt,
      verifiedBy: o.verifiedBy,
      reportFile: o.reportFile || '',
      reportFileName: o.reportFileName || '',
      reportFileSize: o.reportFileSize || '',
      reportUploadedAt: o.reportUploadedAt || null,
    })),
  });
});

// 9. LAB VERIFY & PUBLISH REPORT
const verifyAndPublishLabReport = asyncHandler(async (req, res) => {
  const {
    labOrderId,
    token,
    results,
    isCriticalFlagged,
    criticalNote,
    technologistName,
    unit,
    status,
    reportFile,
    reportFileName,
    reportFileSize,
    reportMimeType,
  } = req.body;

  const query = {};
  if (labOrderId && mongoose.Types.ObjectId.isValid(labOrderId)) {
    query._id = labOrderId;
  } else if (token) {
    query.tokenNumber = token;
    query.status = 'pending';
  } else {
    res.status(400);
    throw new Error('Lab Order ID or Token is required');
  }

  const orderStatus = (status === 'cancelled' || status === 'rejected') ? 'cancelled' : 'verified';

  const updateFields = {
    results: results || [],
    isCriticalFlagged: Boolean(isCriticalFlagged),
    criticalNote: criticalNote || '',
    status: orderStatus,
    verifiedBy: technologistName || 'Kasun Rathnayake (MLT)',
    verifiedAt: new Date(),
    unit: unit || 'Central Diagnostic Lab - Unit 01',
  };

  // If a file was attached via multipart in the same request
  if (req.file) {
    const bytes = req.file.size || 0;
    let formattedSize = `${bytes} B`;
    if (bytes >= 1024 * 1024) {
      formattedSize = `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    } else if (bytes >= 1024) {
      formattedSize = `${(bytes / 1024).toFixed(0)} KB`;
    }
    updateFields.reportFile = `/uploads/reports/${req.file.filename}`;
    updateFields.reportFileName = req.file.originalname;
    updateFields.reportFileSize = formattedSize;
    updateFields.reportMimeType = req.file.mimetype;
    updateFields.reportUploadedAt = new Date();
  } else if (reportFile) {
    updateFields.reportFile = reportFile;
    if (reportFileName) updateFields.reportFileName = reportFileName;
    if (reportFileSize) updateFields.reportFileSize = reportFileSize;
    if (reportMimeType) updateFields.reportMimeType = reportMimeType;
    updateFields.reportUploadedAt = new Date();
  }

  const updated = await LabOrder.findOneAndUpdate(
    query,
    { $set: updateFields },
    { new: true }
  );

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const totalVerified = await LabOrder.countDocuments({
    status: 'verified',
    updatedAt: { $gte: startOfDay },
  });

  res.status(200).json({
    success: true,
    message: orderStatus === 'cancelled' ? 'Specimen marked as rejected' : 'Lab report verified & published successfully',
    data: updated,
    completedCount: totalVerified,
  });
});

// 9.1 CREATE SAMPLE LAB ORDER (For Lab Testing & Simulation)
const createSampleLabOrder = asyncHandler(async (req, res) => {
  const { hospitalId, testName } = req.body;

  let queryHospitalId = hospitalId;
  if (!queryHospitalId || !mongoose.Types.ObjectId.isValid(queryHospitalId)) {
    const kalutara = await Hospital.findOne({ name: { $regex: /Kalutara/i } }) || await Hospital.findOne();
    queryHospitalId = kalutara?._id;
  }

  const sampleTypes = {
    'Full Blood Count (FBC)': 'Whole Blood (EDTA Tube)',
    'Dengue NS1 Antigen Rapid': 'Whole Blood (EDTA Tube)',
    'Fasting Blood Sugar (FBS)': 'Fluoride Plasma',
    'Serum Creatinine & Electrolytes': 'Serum Clot Activator',
    'Lipid Profile': 'Serum Clot Activator',
    'Urine Full Report (UFR)': 'Clean Catch Urine',
  };

  const defaultParams = {
    'Full Blood Count (FBC)': [
      { id: 'wbc', param: 'White Blood Cells (WBC)', value: '7.4', unit: '10^3/uL', refRange: '4.0 - 11.0', isCritical: false },
      { id: 'plt', param: 'Platelet Count', value: '240000', unit: 'cells/mm³', refRange: '150,000 - 450,000', isCritical: false },
      { id: 'hb', param: 'Hemoglobin (Hb)', value: '14.2', unit: 'g/dL', refRange: '13.0 - 17.0', isCritical: false },
      { id: 'pcv', param: 'Hematocrit (PCV)', value: '42', unit: '%', refRange: '40 - 52', isCritical: false },
    ],
    'Dengue NS1 Antigen Rapid': [
      { id: 'ns1', param: 'Dengue NS1 Antigen Rapid', value: 'POSITIVE (+)', unit: 'Result', refRange: 'Negative', isCritical: true },
      { id: 'plt', param: 'Platelet Count', value: '28000', unit: 'cells/mm³', refRange: '150,000 - 450,000', isCritical: true },
    ],
    'Fasting Blood Sugar (FBS)': [
      { id: 'fbs', param: 'Fasting Blood Sugar', value: '118', unit: 'mg/dL', refRange: '70 - 100', isCritical: false },
    ],
    'Serum Creatinine & Electrolytes': [
      { id: 'creat', param: 'Serum Creatinine', value: '1.2', unit: 'mg/dL', refRange: '0.7 - 1.3', isCritical: false },
      { id: 'k', param: 'Potassium (K+)', value: '4.2', unit: 'mmol/L', refRange: '3.5 - 5.0', isCritical: false },
    ],
  };

  const chosenTest = testName || 'Full Blood Count (FBC)';
  const tokenNum = `L ${Math.floor(100 + Math.random() * 900)}`;

  const order = await LabOrder.create({
    hospitalId: queryHospitalId,
    doctorName: 'Dr. Samantha Wickramasinghe',
    clinicName: 'General OPD',
    roomNumber: 'Room 03',
    patientName: 'Kavindu Perera',
    patientAge: 32,
    patientGender: 'Male',
    tokenNumber: tokenNum,
    testName: chosenTest,
    sampleType: sampleTypes[chosenTest] || 'Whole Blood (EDTA Tube)',
    priority: chosenTest.includes('Dengue') ? 'High Priority' : 'Routine',
    results: defaultParams[chosenTest] || [
      { id: 'res1', param: chosenTest, value: '', unit: 'Result', refRange: 'Normal', isCritical: false },
    ],
    status: 'pending',
  });

  res.status(201).json({
    success: true,
    message: 'Sample lab order created successfully',
    data: order,
  });
});

// 10. GET PATIENT PRESCRIPTIONS & LAB ORDERS (For MediQueue Mobile App)
const getPatientPrescriptionsAndLabs = asyncHandler(async (req, res) => {
  const { userId, patientId } = req.body;

  let queryPatientId = patientId;
  let pat = null;

  if (userId) {
    try {
      pat = await Patient.findOne({ userId });
      if (pat && !queryPatientId) queryPatientId = pat._id;
    } catch (e) {}
  } else if (patientId) {
    try {
      pat = await Patient.findOne({ _id: patientId }) || await Patient.findOne({ patientId });
    } catch (e) {}
  }

  const orConditions = [];
  if (queryPatientId && mongoose.Types.ObjectId.isValid(queryPatientId)) {
    orConditions.push({ patientId: queryPatientId });
  }
  if (userId && mongoose.Types.ObjectId.isValid(userId)) {
    orConditions.push({ patientId: userId });
  }
  if (pat?._id && mongoose.Types.ObjectId.isValid(pat._id)) {
    orConditions.push({ patientId: pat._id });
  }
  if (pat?.fullName) {
    orConditions.push({ patientName: pat.fullName });
  }

  const filter = orConditions.length > 0 ? { $or: orConditions } : {};

  let prescriptions = await Prescription.find(filter).sort({ _id: -1 });
  let labOrders = await LabOrder.find(filter).sort({ _id: -1 });

  // Fallback: If no records found for this specific user yet, fetch latest DB records
  if (!prescriptions || prescriptions.length === 0) {
    prescriptions = await Prescription.find().sort({ _id: -1 }).limit(10);
  }
  if (!labOrders || labOrders.length === 0) {
    labOrders = await LabOrder.find().sort({ _id: -1 }).limit(10);
  }

  res.status(200).json({
    success: true,
    prescriptions: prescriptions || [],
    labOrders: labOrders || [],
  });
});

// 11. UPLOAD LAB REPORT FILE
const uploadLabReport = asyncHandler(async (req, res) => {
  const { labOrderId, token } = req.body;

  if (!req.file) {
    res.status(400);
    throw new Error('No report file uploaded. Please select a valid document or image.');
  }

  const query = {};
  if (labOrderId && mongoose.Types.ObjectId.isValid(labOrderId)) {
    query._id = labOrderId;
  } else if (token) {
    query.tokenNumber = token;
  } else {
    res.status(400);
    throw new Error('Lab Order ID or Token is required to attach the report file.');
  }

  const bytes = req.file.size || 0;
  let formattedSize = `${bytes} B`;
  if (bytes >= 1024 * 1024) {
    formattedSize = `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  } else if (bytes >= 1024) {
    formattedSize = `${(bytes / 1024).toFixed(0)} KB`;
  }

  const reportUrl = `/uploads/reports/${req.file.filename}`;

  const updated = await LabOrder.findOneAndUpdate(
    query,
    {
      $set: {
        reportFile: reportUrl,
        reportFileName: req.file.originalname,
        reportFileSize: formattedSize,
        reportMimeType: req.file.mimetype,
        reportUploadedAt: new Date(),
      },
    },
    { new: true }
  );

  if (!updated) {
    res.status(404);
    throw new Error('Lab order not found for the given ID or Token.');
  }

  res.status(200).json({
    success: true,
    message: `Report file "${req.file.originalname}" uploaded and attached successfully!`,
    data: updated,
    file: {
      url: reportUrl,
      fileName: req.file.originalname,
      fileSize: formattedSize,
      mimeType: req.file.mimetype,
    },
  });
});

// 12. DOWNLOAD / STREAM LAB REPORT FILE
const downloadLabReport = asyncHandler(async (req, res) => {
  const { id } = req.params;

  let order = null;
  if (mongoose.Types.ObjectId.isValid(id)) {
    order = await LabOrder.findById(id);
  }
  if (!order) {
    order = await LabOrder.findOne({ tokenNumber: id });
  }

  if (!order) {
    return res.status(404).send('Lab order record not found.');
  }

  if (order.reportFile) {
    const relativePath = order.reportFile.replace(/^\//, '');
    const absolutePath = path.join(__dirname, '..', relativePath);

    if (fs.existsSync(absolutePath)) {
      const downloadName = order.reportFileName || `${order.testName.replace(/[^a-zA-Z0-9_-]/g, '_')}_${order.tokenNumber}.pdf`;
      return res.download(absolutePath, downloadName);
    }
  }

  // Fallback: If no file attached on disk, return 404 with JSON details
  res.status(404).json({
    success: false,
    message: 'Official report document has not been uploaded for this lab order yet.',
    order: {
      token: order.tokenNumber,
      test: order.testName,
      status: order.status,
      results: order.results,
    },
  });
});

// 13. GET LAB ORDERS FOR DOCTOR (Patient specific)
const getPatientLabsForDoctor = asyncHandler(async (req, res) => {
  const { patientId, patientName, token } = req.body;

  const orConditions = [];
  if (patientId && mongoose.Types.ObjectId.isValid(patientId)) {
    orConditions.push({ patientId });
  }
  if (patientName) {
    orConditions.push({ patientName: { $regex: new RegExp(patientName.trim(), 'i') } });
  }
  if (token) {
    orConditions.push({ tokenNumber: token });
  }

  let filter = orConditions.length > 0 ? { $or: orConditions } : {};
  const orders = await LabOrder.find(filter).sort({ createdAt: -1 }).limit(15);

  res.status(200).json({
    success: true,
    labOrders: orders || [],
  });
});

// 14. PATIENT LIVE QUEUE: JOIN QUEUE (Create)
const joinLiveQueue = asyncHandler(async (req, res) => {
  const { userId, patientId, hospitalId, clinicName, symptoms } = req.body;

  let pat = null;
  if (patientId) {
    pat = await Patient.findOne({ _id: patientId });
  }
  if (!pat && userId) {
    pat = await Patient.findOne({ userId });
  }

  let hosp = null;
  if (hospitalId) {
    hosp = await Hospital.findById(hospitalId);
  }
  if (!hosp) {
    hosp = await Hospital.findOne();
  }

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const count = await Appointment.countDocuments({
    hospitalId: hosp._id,
    appointmentDate: { $gte: startOfDay, $lte: endOfDay },
  });

  const nextNum = count + 1;
  const formattedToken = `Q ${String(nextNum).padStart(3, '0')}`;

  const newAppt = await Appointment.create({
    patientId: pat ? pat._id : userId,
    hospitalId: hosp._id,
    clinicName: clinicName || 'General OPD Clinic',
    roomNumber: 'Room 03',
    service: symptoms ? `Consultation: ${symptoms}` : 'Live OPD Consultation',
    appointmentDate: new Date(),
    appointmentTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    tokenNumber: formattedToken,
    status: 'scheduled',
  });

  res.status(201).json({
    success: true,
    message: 'Successfully checked in to live queue',
    appointment: newAppt,
    tokenNumber: formattedToken,
  });
});

// 15. PATIENT LIVE QUEUE: UPDATE SYMPTOMS (Update)
const updateQueueSymptoms = asyncHandler(async (req, res) => {
  const { appointmentId, tokenNumber, symptoms } = req.body;

  let appt = null;
  if (appointmentId) {
    appt = await Appointment.findById(appointmentId);
  }
  if (!appt && tokenNumber) {
    appt = await Appointment.findOne({ tokenNumber, status: 'scheduled' });
  }

  if (!appt) {
    res.status(404);
    throw new Error('Active queue ticket not found to update');
  }

  appt.service = symptoms ? `Consultation: ${symptoms}` : appt.service;
  await appt.save();

  res.status(200).json({
    success: true,
    message: 'Consultation symptoms updated successfully',
    appointment: appt,
  });
});

// 16. PATIENT LIVE QUEUE: LEAVE QUEUE (Delete)
const cancelQueueToken = asyncHandler(async (req, res) => {
  const { appointmentId, tokenNumber } = req.body;

  let appt = null;
  if (appointmentId) {
    appt = await Appointment.findById(appointmentId);
  }
  if (!appt && tokenNumber) {
    appt = await Appointment.findOne({ tokenNumber });
  }

  if (!appt) {
    res.status(404);
    throw new Error('Active queue ticket not found to cancel');
  }

  appt.status = 'cancelled';
  await appt.save();

  res.status(200).json({
    success: true,
    message: 'Successfully left the queue and cancelled token',
  });
});

// 17. PATIENT LIVE QUEUE: DELAY / SNOOZE TURN (User Control & Freedom)
const snoozeQueueToken = asyncHandler(async (req, res) => {
  const { appointmentId, tokenNumber, snoozePositions = 2 } = req.body;

  let appt = null;
  if (appointmentId) {
    appt = await Appointment.findById(appointmentId);
  }
  if (!appt && tokenNumber) {
    appt = await Appointment.findOne({ tokenNumber, status: 'scheduled' });
  }

  if (!appt) {
    res.status(404);
    throw new Error('Active queue ticket not found to delay');
  }

  // Track snooze counter and delayed status in appointment
  appt.snoozeCount = (appt.snoozeCount || 0) + 1;
  const positions = Number(snoozePositions) || 2;
  const addedMinutes = positions * 7;
  appt.delayMinutes = (appt.delayMinutes || 0) + addedMinutes;

  if (!appt.service.includes('[Delayed]')) {
    appt.service = `${appt.service} [Delayed by ${positions} turns]`;
  }

  await appt.save();

  res.status(200).json({
    success: true,
    message: `Your turn moved back by ${positions} positions. Estimated delay: +${addedMinutes} mins.`,
    appointment: appt,
    snoozeCount: appt.snoozeCount,
    delayMinutes: appt.delayMinutes,
    positionsDelayed: positions,
  });
});

module.exports = {
  getDoctorDeskInfo,
  getDoctorQueue,
  getPatientPassport,
  finishConsultation,
  getPharmacyQueue,
  dispensePrescription,
  skipPrescription,
  getLabQueue,
  verifyAndPublishLabReport,
  createSampleLabOrder,
  getPatientPrescriptionsAndLabs,
  uploadLabReport,
  downloadLabReport,
  getPatientLabsForDoctor,
  joinLiveQueue,
  updateQueueSymptoms,
  cancelQueueToken,
  snoozeQueueToken,
};



