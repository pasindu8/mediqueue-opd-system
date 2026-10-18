const express = require('express');
const router = express.Router();

const { patientCreate, getPatientDetails, updatePatientProfile, deletePatientProfile, } = require('../controllers/patientController');

const protect = require('../middleware/authMiddleware');


router.post('/create', patientCreate);
router.post('/details', getPatientDetails);
router.post('/update', updatePatientProfile);
router.post('/delete', deletePatientProfile);

module.exports = router;