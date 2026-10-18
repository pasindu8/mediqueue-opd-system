require('dotenv').config();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const asyncHandler = require('../middleware/asyncHandler');
const axios = require('axios');
const crypto = require('crypto');
const { sendSMS } = require('../utils/smsService');
const { validateNIC } = require('../utils/nicValidator');

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
    const smsMessage = `Welcome to MediQueue, ${name}!\nRegistration successful.\nTemp Password: ${plainPassword}\nVerification Code: ${verificationCode}`;
    
    await sendSMS(phoneNumber, smsMessage);

    const user = await User.create({
        name,
        NIC,
        password: hashedPassword,
        phoneNumber,
        type: 'user',
        status: 'pending',
        verificationCode
    });

    res.status(201).json({
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

    if (users.verificationCode.toString() !== code.toString().trim()) {
        res.status(400);
        throw new Error('Invalid verification code');
    }

    users.status = 'active';
    users.verificationCode = 0;
    await users.save();

    res.status(201).json({
        message: 'Account verified successfully',
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

  res.status(200).json({
    success: true,
    message: 'Login successful',
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
  const smsMessage = `Hello ${user.name}!\nYour MediQueue login verification code is: ${verificationCode}\nDo not share this code with anyone.`;

  await sendSMS(user.phoneNumber, smsMessage);

  user.verificationCode = verificationCode;
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

  if (!user.verificationCode || String(user.verificationCode).trim() !== String(code).trim()) {
    res.status(401);
    throw new Error('Invalid verification code');
  }

 
  user.verificationCode = null;
  await user.save();

  
  res.status(200).json({
    success: true,
    message: 'Login successful',
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