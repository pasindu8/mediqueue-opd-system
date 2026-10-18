const express = require('express');
const router = express.Router();

const { registerAdmin, registerAdmin2, allAdmins, verification, loginAdmin, optcodegeni, loginPhone, resetPassword } = require('../controllers/adminController');

const { protect, requireRole } = require('../middleware/authMiddleware');

router.post('/register', registerAdmin);
router.post('/registerAssigned', registerAdmin2)
router.post('/verify', verification);
router.post('/loginadmin', loginAdmin);
router.post('/loginphone', loginPhone);
router.post('/optcodegeni', optcodegeni);
router.post('/all', protect, requireRole('super_admin', 'admin', 'it_support'), allAdmins);
router.post('/resetpassword', protect, requireRole('super_admin', 'admin', 'it_support'), resetPassword);
module.exports = router;