const express = require('express');
const router = express.Router();

const { allClinic, ClinicCreate, allashospitalClinic, getClinicDetails, updateClinic, deleteClinic } = require('../controllers/clinicController');

const protect = require('../middleware/authMiddleware');

router.post('/all', allClinic);
router.post('/create', ClinicCreate);
router.post('/allhc', allashospitalClinic);
router.post('/getDetails', getClinicDetails);
router.post('/update', updateClinic);
router.post('/delete', deleteClinic);
module.exports = router;