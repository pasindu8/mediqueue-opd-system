const express = require('express');
const router = express.Router();

const { doctorCreate, getDoctorDetails, updateDoctorProfile, deleteDoctorProfile, getAllDoctors, getAllhospitalDoctors, getadminconnectedDoctor, } = require('../controllers/doctorController');



router.post('/create', doctorCreate);
router.post('/getDetails', getDoctorDetails);
router.post('/update', updateDoctorProfile);
router.post('/delete', deleteDoctorProfile);
router.post('/getAllDoctors', getAllDoctors);
router.post('/all', getAllhospitalDoctors);
router.post('/gacd', getadminconnectedDoctor);
module.exports = router;
