require('dotenv').config();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const asyncHandler = require('../middleware/asyncHandler');
const axios = require('axios');
const crypto = require('crypto');
const { sendSMS } = require('../utils/smsService');
const { validateNIC } = require('../utils/nicValidator');

if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
}

const JWT_SECRET = process.env.JWT_SECRET;

const generateToken = (user) => {
    return jwt.sign(
        { id: user._id, type: user.type || 'user', NIC: user.NIC, phoneNumber: user.phoneNumber },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
};

//  REGISTER USER
const registerUser = asyncHandler(async (req, res) => {
    const { name, NIC, phoneNumber } = req.body;

    if (!name || !NIC || !phoneNumber) {
        res.status(400);
        throw new Error('All fields are required');
    }

    const userExists = await User.findOne({ NIC });
    if (userExists) {
        res.status(400);
        throw new Error('User with this NIC already exists');
    }

    const nicCheck = validateNIC(NIC);
    if (!nicCheck.isValid) {
        return res.status(400).json({
            success: false,
            message: nicCheck.message,
        });
    }

    const generateRandomPassword = (length = 12) => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    };

    let plainPassword = '';
    let isUnique = false;

    const existingUsers = await User.find({}, 'password');

    while (!isUnique) {
        plainPassword = generateRandomPassword(12);
        let matchFound = false;

        for (const user of existingUsers) {
            if (user.password) {
                const isMatch = await bcrypt.compare(plainPassword, user.password);
                if (isMatch) {
                    matchFound = true;
                    break;
                }
            }
        }

        if (!matchFound) {
            isUnique = true;
        }
    }

    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const smsMessage = `Welcome to MediQueue, ${name}!\nRegistration successful.\nTemp Password: ${plainPassword}\nVerification Code: ${verificationCode}\nCode expires in 5 minutes.`;
    
    await sendSMS(phoneNumber, smsMessage);

    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes validity

    const user = await User.create({
        name,
        NIC,
        password: hashedPassword,
        phoneNumber,
        type: 'user',
        status: 'pending',
        verificationCode,
        otpExpiresAt,
        otpAttempts: 0
    });

    res.status(201).json({
        success: true,
        message: 'User created successfully',
        userId: user._id,
    });
});

const verification = asyncHandler(async (req, res) => {
    const { code, userId } = req.body;

    if (!code) {
        res.status(400);
        throw new Error('Verification code is required');
    }

    const users = await User.findById(userId);

    if (!users) {
        res.status(404);
        throw new Error('User not found');
    }

    if (users.otpExpiresAt && new Date() > users.otpExpiresAt) {
        res.status(400);
        throw new Error('Verification code has expired. Please request a new code.');
    }

    if (users.otpAttempts && users.otpAttempts >= 5) {
        res.status(429);
        throw new Error('Too many failed attempts. Please request a new verification code.');
    }

    if (!users.verificationCode || users.verificationCode.toString().trim() !== code.toString().trim()) {
        users.otpAttempts = (users.otpAttempts || 0) + 1;
        await users.save();
        res.status(400);
        throw new Error('Invalid verification code');
    }

    users.status = 'active';
    users.verificationCode = null;
    users.otpExpiresAt = null;
    users.otpAttempts = 0;
    await users.save();

    const token = generateToken(users);

    res.status(200).json({
        success: true,
        message: 'Account verified successfully',
        token,
        userId: users._id,
        name: users.name,
        type: users.type,
    });
});

const loginNIC = asyncHandler(async (req, res) => {
  const { nic, password } = req.body;

  if (!nic || !password) {
    res.status(400);
    throw new Error('NIC number and password are required');
  }

  const user = await User.findOne({ NIC: nic.trim() });

  if (!user) {
    res.status(401);
    throw new Error('Invalid NIC or password');
  }

  const isPasswordMatch = await bcrypt.compare(password, user.password);

  if (!isPasswordMatch) {
    res.status(401);
    throw new Error('Invalid NIC or password');
  }

  if (user.status === 'pending') {
    return res.status(403).json({
      success: false,
      message: 'Please verify your phone number first',
      userId: user._id,
      isPending: true,
    });
  }

  const token = generateToken(user);

  res.status(200).json({
    success: true,
    message: 'Login successful',
    token: token,
    userId: user._id,
    name: user.name,
    NIC: user.NIC,
    phoneNumber: user.phoneNumber,
    type: user.type,
  });
});

const optcodegeni = asyncHandler(async (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    res.status(400);
    throw new Error('Phone number is required');
  }

  const user = await User.findOne({ phoneNumber: phone.trim() });

  if (!user) {
    res.status(401);
    throw new Error('Invalid phone number');
  }

  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
  const smsMessage = `Hello ${user.name}!\nYour MediQueue login verification code is: ${verificationCode}\nCode expires in 5 minutes. Do not share this code.`;

  await sendSMS(user.phoneNumber, smsMessage);

  user.verificationCode = verificationCode;
  user.otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes validity
  user.otpAttempts = 0;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Send OTP successful',
  });
});

const loginPhone = asyncHandler(async (req, res) => {
  const { phone, code } = req.body;

  if (!phone || !code) {
    res.status(400);
    throw new Error('Phone number and verification code are required');
  }

  const cleanPhone = phone.trim().slice(-9);
  const user = await User.findOne({
    phoneNumber: { $regex: cleanPhone + '$' }
  });

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (user.otpExpiresAt && new Date() > user.otpExpiresAt) {
    res.status(400);
    throw new Error('Verification code has expired. Please request a new code.');
  }

  if (user.otpAttempts && user.otpAttempts >= 5) {
    res.status(429);
    throw new Error('Too many failed attempts. Please request a new code.');
  }

  if (!user.verificationCode || String(user.verificationCode).trim() !== String(code).trim()) {
    user.otpAttempts = (user.otpAttempts || 0) + 1;
    await user.save();
    res.status(401);
    throw new Error('Invalid verification code');
  }

  user.verificationCode = null;
  user.otpExpiresAt = null;
  user.otpAttempts = 0;
  await user.save();

  const token = generateToken(user);

  res.status(200).json({
    success: true,
    message: 'Login successful',
    token: token,
    userId: user._id,
    name: user.name,
    NIC: user.NIC,
    phoneNumber: user.phoneNumber,
    type: user.type,
  });
});



module.exports = {
    registerUser,
    verification,
    loginNIC,
    loginPhone,
    optcodegeni
};