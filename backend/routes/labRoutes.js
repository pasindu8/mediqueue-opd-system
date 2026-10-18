const express = require('express');
const router = express.Router();

const { labCreate, getAllhospitalLabs, updateLab, deleteLab } = require('../controllers/labController');

router.post('/create', labCreate);
router.post('/all', getAllhospitalLabs);
router.post('/update', updateLab);
router.post('/delete', deleteLab);

module.exports = router;

