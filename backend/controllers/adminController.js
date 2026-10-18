require('dotenv').config();
const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const asyncHandler = require('../middleware/asyncHandler');
const { sendSMS } = require('../utils/smsService');

// 1. REGISTER ADMIN
const registerAdmin = asyncHandler(async (req, res) => {
  const { name, StaffID, email, phoneNumber, password, role } = req.body;

  
  if (!name || !StaffID || !email || !phoneNumber || !role) {
    res.status(400);
    throw new Error('Name, StaffID, Email, and Phone Number are required');
  }

  const adminExists = await Admin.findOne({
    $or: [{ StaffID }, { email }, { phoneNumber }],
  });

  if (adminExists) {
    res.status(400);
    throw new Error('Admin with this StaffID, Email, or Phone Number already exists');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  // 6-digit Verification Code
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

  // Dispatch SMS verification notification
  const smsMessage = `Welcome to MediQueue Admin Portal, ${name}!\nStaff ID: ${StaffID}\n Password: ${password}\nVerification Code: ${verificationCode}`;
  //await sendSMS(phoneNumber, smsMessage);

  // Save new document according to adminSchema
  const newAdmin = await Admin.create({
    name,
    StaffID,
    email,
    password: hashedPassword,
    phoneNumber,
    status: 'pending',
    verificationCode,
    role,
  });

  res.status(201).json({
    success: true,
    message: 'Admin registered successfully. Verification code sent.',
    adminId: newAdmin._id,
  });
});

const registerAdmin2 = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    res.status(400);
    throw new Error('Email and Password are required');
  }

  const StaffID = 'Staff' + Math.floor(1000 + Math.random() * 9000).toString();
  const name = 'Admin' + Math.floor(1000 + Math.random() * 9000).toString();

  const adminExists = await Admin.findOne({
    $or: [{ StaffID }, { email }],
  });

  if (adminExists) {
    res.status(400);
    throw new Error('Admin with this StaffID or Email already exists');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newAdmin = await Admin.create({
    name,
    StaffID,
    email,
    password: hashedPassword,
    phoneNumber: '',
    status: 'Assigned',
    verificationCode: '',
    role: 'it_support',
  });

  res.status(201).json({
    success: true,
    message: 'Admin registered successfully.',
    adminId: newAdmin._id,
  });
});

// 1. GET ALL ADMINS
const allAdmins = asyncHandler(async (req, res) => {

  const admins = await Admin.find( { role: { $in: ['it_support'] } },);
  res.status(200).json({
    success: true,
    data: admins,
  });
});

// 2. VERIFY ADMIN ACCOUNT
const verification = asyncHandler(async (req, res) => {
  const { code, adminId } = req.body;

  if (!code || !adminId) {
    res.status(400);
    throw new Error('Verification code and Admin ID are required');
  }

  const admin = await Admin.findById(adminId);

  if (!admin) {
    res.status(404);
    throw new Error('Admin not found');
  }

  if (!admin.verificationCode || admin.verificationCode.toString().trim() !== code.toString().trim()) {
    res.status(400);
    throw new Error('Invalid verification code');
  }

  admin.status = 'active';
  admin.verificationCode = null;
  await admin.save();

  res.status(200).json({
    success: true,
    message: 'Admin account verified successfully',
  });
});

// 3. ADMIN LOGIN (Using Email or StaffID)
const loginAdmin = asyncHandler(async (req, res) => {
  const { email, StaffID, password } = req.body;
  const loginId = (email || StaffID ).trim();

  if (!loginId || !password) {
    res.status(400);
    throw new Error('Staff ID/Email and password are required');
  }

  // Find Admin by StaffID or Email
  const admin = await Admin.findOne({
    $or: [{ email: loginId }, { StaffID: loginId }],
  });

  if (!admin) {
    res.status(401);
    throw new Error('Invalid Staff ID/Email or password');
  }

  const isPasswordMatch = await bcrypt.compare(password, admin.password);
  
  if (!isPasswordMatch) {
    res.status(401);
    throw new Error('Invalid Staff ID/Email or password2');
  }

  if (admin.status === 'pending') {
    return res.status(403).json({
      success: false,
      message: 'Please verify your phone number first',
      adminId: admin._id,
      isPending: true,
    });
  }

  res.status(200).json({
    success: true,
    message: 'Admin login successful',
    adminId: admin._id,
    name: admin.name,
    StaffID: admin.StaffID,
    email: admin.email,
    phoneNumber: admin.phoneNumber,
    status: admin.status,
    role: admin.role,
  });
});

// 4. SEND OTP TO PHONE
const optcodegeni = asyncHandler(async (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    res.status(400);
    throw new Error('Phone number is required');
  }

  const cleanPhone = phone.trim().slice(-9);
  const admin = await Admin.findOne({
    phoneNumber: { $regex: cleanPhone + '$' },
  });

  if (!admin) {
    res.status(404);
    throw new Error('Admin with this phone number not found');
  }

  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
  const smsMessage = `Hello ${admin.name}!\nYour MediQueue Admin login verification code is: ${verificationCode}`;

  await sendSMS(admin.phoneNumber, smsMessage);

  admin.verificationCode = verificationCode;
  await admin.save();

  res.status(200).json({
    success: true,
    message: 'OTP sent successfully',
  });
});

// 5. LOGIN VIA PHONE OTP
const loginPhone = asyncHandler(async (req, res) => {
  const { phone, code } = req.body;

  if (!phone || !code) {
    res.status(400);
    throw new Error('Phone number and verification code are required');
  }

  const cleanPhone = phone.trim().slice(-9);
  const admin = await Admin.findOne({
    phoneNumber: { $regex: cleanPhone + '$' },
  });

  if (!admin) {
    res.status(404);
    throw new Error('Admin not found');
  }

  if (!admin.verificationCode || String(admin.verificationCode).trim() !== String(code).trim()) {
    res.status(401);
    throw new Error('Invalid verification code');
  }

  admin.verificationCode = null;
  await admin.save();

  res.status(200).json({
    success: true,
    message: 'Login successful',
    adminId: admin._id,
    name: admin.name,
    StaffID: admin.StaffID,
    email: admin.email,
    phoneNumber: admin.phoneNumber,
    status: admin.status,
  });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { adminId, newPassword } = req.body;

  if (!adminId || !newPassword) {
    res.status(400);
    throw new Error('Admin ID and new password are required');
  }

  const admin = await Admin.findById(adminId);
  if (!admin) {
    res.status(404);
    throw new Error('Admin not found');
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  admin.password = hashedPassword;
  await admin.save();

  res.status(200).json({
    success: true,
    message: 'Password reset successfully',
  });
});

module.exports = {
  registerAdmin,
  registerAdmin2,
  allAdmins,
  verification,
  loginAdmin,
  loginPhone,
  optcodegeni,
  resetPassword,
};