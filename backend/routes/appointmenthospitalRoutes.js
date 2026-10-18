const express = require('express');
const router = express.Router();

const {
  appointmentCreate,
  getAppointmentDetails,
  updateAppointmentDetails,
  deleteAppointment,
  getuserAppointmentDetails,
  getAppointmentsByHospital,
} = require('../controllers/appointmentController');

router.post('/create', appointmentCreate);
router.post('/details', getAppointmentDetails);
router.post('/update', updateAppointmentDetails);
router.post('/delete', deleteAppointment);
router.post('/user/details', getuserAppointmentDetails);
router.post('/getByHospital', getAppointmentsByHospital);

module.exports = router;