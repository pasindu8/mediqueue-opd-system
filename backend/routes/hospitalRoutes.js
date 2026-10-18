const express = require('express');
const router = express.Router();

const { hospitalCreate, getHospitalDetails, updateHospitalDetails, deleteHospital, getAllHospitals, addClinicToHospital} = require('../controllers/hospitalController');



router.post('/create', hospitalCreate);
router.post('/details', getHospitalDetails);
router.post('/update', updateHospitalDetails);
router.post('/delete', deleteHospital);
router.post('/all', getAllHospitals);
router.post('/add-clinic', addClinicToHospital);
module.exports = router;