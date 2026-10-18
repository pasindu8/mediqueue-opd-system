const express = require('express');
const router = express.Router();

const { registerUser, verification, loginNIC, optcodegeni, loginPhone } = require('../controllers/authController');

const protect = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/verify', verification);
router.post('/loginnic', loginNIC);
router.post('/loginphone', loginPhone);
router.post('/optcodegeni', optcodegeni);
module.exports = router;