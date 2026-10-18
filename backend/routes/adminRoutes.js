const express = require('express');
const router = express.Router();

const { registerAdmin, registerAdmin2, allAdmins, verification, loginAdmin, optcodegeni, loginPhone, resetPassword } = require('../controllers/adminController');

const protect = require('../middleware/authMiddleware');

router.post('/register', registerAdmin);
router.post('/registerAssigned', registerAdmin2)
router.post('/verify', verification);
router.post('/loginadmin', loginAdmin);
router.post('/loginphone', loginPhone);
router.post('/optcodegeni', optcodegeni);
router.post('/all', allAdmins);
router.post('/resetpassword', resetPassword);
module.exports = router;