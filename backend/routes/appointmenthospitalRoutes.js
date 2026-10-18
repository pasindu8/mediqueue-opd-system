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

const { optionalAuth } = require('../middleware/authMiddleware');

router.post('/create', optionalAuth, appointmentCreate);
router.post('/details', optionalAuth, getAppointmentDetails);
router.post('/update', optionalAuth, updateAppointmentDetails);
router.post('/delete', optionalAuth, deleteAppointment);
router.post('/user/details', optionalAuth, getuserAppointmentDetails);
router.post('/getByHospital', getAppointmentsByHospital);

module.exports = router;