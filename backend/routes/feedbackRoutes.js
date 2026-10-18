const express = require('express');
const router = express.Router();

const {
  createFeedback,
  getPatientFeedback,
  updateFeedback,
  deleteFeedback,
} = require('../controllers/feedbackController');

router.post('/create', createFeedback);
router.post('/patient', getPatientFeedback);
router.post('/update', updateFeedback);
router.post('/delete', deleteFeedback);

module.exports = router;
