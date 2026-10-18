const express = require('express');
const router = express.Router();

const { patientCreate, getPatientDetails, updatePatientProfile, deletePatientProfile, } = require('../controllers/patientController');

const { protect, requireRole } = require('../middleware/authMiddleware');

router.post('/create', protect, requireRole('user'), patientCreate);
router.post('/details', protect, requireRole('user'), getPatientDetails);
router.post('/update', protect, requireRole('user'), updatePatientProfile);
router.post('/delete', protect, requireRole('user'), deletePatientProfile);

module.exports = router;