const express = require('express');
const router = express.Router();

const {
  pharmacyCreate,
  getAllhospitalpharmacies,
  updatePharmacy,
  deletePharmacy,
  createRefillRequest,
  updateRefillRequest,
  cancelRefillRequest,
} = require('../controllers/pharmacyController');

router.post('/create', pharmacyCreate);
router.post('/all', getAllhospitalpharmacies);
router.post('/update', updatePharmacy);
router.post('/delete', deletePharmacy);

// Patient mobile refill routes
router.post('/refill/request', createRefillRequest);
router.post('/refill/update', updateRefillRequest);
router.post('/refill/cancel', cancelRefillRequest);

module.exports = router;


