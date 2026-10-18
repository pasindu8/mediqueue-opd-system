const express = require('express');
const router = express.Router();

const {
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
} = require('../controllers/clinicalController');

const { uploadReport } = require('../middleware/uploadMiddleware');

// Doctor clinical routes
router.post('/doctor/desk-info', getDoctorDeskInfo);
router.post('/doctor/queue', getDoctorQueue);
router.post('/doctor/patient-passport', getPatientPassport);
router.post('/doctor/finish-consultation', finishConsultation);
router.post('/doctor/patient-labs', getPatientLabsForDoctor);

// Pharmacy operational routes
router.post('/pharmacy/queue', getPharmacyQueue);
router.post('/pharmacy/dispense', dispensePrescription);
router.post('/pharmacy/skip', skipPrescription);

// Lab operational routes
router.post('/lab/queue', getLabQueue);
router.post('/lab/verify-publish', uploadReport.single('reportFile'), verifyAndPublishLabReport);
router.post('/lab/upload-report', uploadReport.single('reportFile'), uploadLabReport);
router.get('/lab/download-report/:id', downloadLabReport);
router.post('/lab/sample-order', createSampleLabOrder);

// Patient mobile app routes
router.post('/patient/prescriptions-and-labs', getPatientPrescriptionsAndLabs);
router.post('/patient/queue/join', joinLiveQueue);
router.post('/patient/queue/update-symptoms', updateQueueSymptoms);
router.post('/patient/queue/cancel', cancelQueueToken);
router.post('/patient/queue/snooze', snoozeQueueToken);

module.exports = router;

