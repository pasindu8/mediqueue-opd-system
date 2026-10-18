require('dotenv').config();
const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const asyncHandler = require('../middleware/asyncHandler');
const { sendSMS } = require('../utils/smsService');

// 1. REGISTER ADMIN
const registerAdmin = asyncHandler(async (req, res) => {
  const { name, StaffID, email, phoneNumber, password, role } = req.body;

  if (!name || !StaffID || !email || !phoneNumber || !password || !role) {
    res.status(400);
    throw new Error('Name, StaffID, Email, Phone Number, Password, and Role are required');
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

  const smsMessage = `Welcome to MediQueue Admin Portal, ${name}!\nStaff ID: ${StaffID}\n Password: ${password}\nVerification Code: ${verificationCode}`;
  await sendSMS(phoneNumber, smsMessage);

  // Save new document according to adminSchema
  const newAdmin = await Admin.create({
    name,
    StaffID,
    email,
    password: hashedPassword,
    phoneNumber,
    status: 'pending',
    verificationCode,
    otpExpiresAt: new Date(Date.now() + 5 * 60 * 1000),
    otpAttempts: 0,
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

  if (admin.otpExpiresAt && new Date() > admin.otpExpiresAt) {
    res.status(400);
    throw new Error('Verification code has expired. Please request a new code.');
  }

  if (admin.otpAttempts >= 5) {
    res.status(429);
    throw new Error('Too many failed attempts. Please request a new verification code.');
  }

  if (!admin.verificationCode || admin.verificationCode.toString().trim() !== code.toString().trim()) {
    admin.otpAttempts += 1;
    await admin.save();
    res.status(400);
    throw new Error('Invalid verification code');
  }

  admin.status = 'active';
  admin.verificationCode = null;
  admin.otpExpiresAt = null;
  admin.otpAttempts = 0;
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

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not configured');
}

const JWT_SECRET = process.env.JWT_SECRET;

const generateAdminToken = (admin) => {
  return jwt.sign(
    { id: admin._id, type: 'admin', StaffID: admin.StaffID, role: admin.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

  const token = generateAdminToken(admin);

  res.status(200).json({
    success: true,
    message: 'Admin login successful',
    token: token,
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
  const smsMessage = `Hello ${admin.name}!\nYour MediQueue Admin login verification code is: ${verificationCode}\nCode expires in 5 minutes.`;

  await sendSMS(admin.phoneNumber, smsMessage);

  admin.verificationCode = verificationCode;
  admin.otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
  admin.otpAttempts = 0;
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

  if (admin.otpExpiresAt && new Date() > admin.otpExpiresAt) {
    res.status(400);
    throw new Error('Verification code has expired. Please request a new code.');
  }

  if (admin.otpAttempts && admin.otpAttempts >= 5) {
    res.status(429);
    throw new Error('Too many failed attempts. Please request a new code.');
  }

  if (!admin.verificationCode || String(admin.verificationCode).trim() !== String(code).trim()) {
    admin.otpAttempts = (admin.otpAttempts || 0) + 1;
    await admin.save();
    res.status(401);
    throw new Error('Invalid verification code');
  }

  admin.verificationCode = null;
  admin.otpExpiresAt = null;
  admin.otpAttempts = 0;
  await admin.save();

  const token = generateAdminToken(admin);

  res.status(200).json({
    success: true,
    message: 'Login successful',
    token: token,
    adminId: admin._id,
    name: admin.name,
    StaffID: admin.StaffID,
    email: admin.email,
    phoneNumber: admin.phoneNumber,
    status: admin.status,
    role: admin.role,
  });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { adminId, currentPassword, newPassword, code } = req.body;

  if (!newPassword) {
    res.status(400);
    throw new Error('New password is required');
  }

  const targetAdminId = req.user.id;
  if (adminId && String(adminId) !== String(targetAdminId)) {
    res.status(403);
    throw new Error('You can only reset your own password');
  }

  const admin = await Admin.findById(targetAdminId);
  if (!admin) {
    res.status(404);
    throw new Error('Admin not found');
  }

  // Security check: Must supply either current password or valid OTP code
  if (currentPassword) {
    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) {
      res.status(401);
      throw new Error('Current password is incorrect');
    }
  } else if (code) {
    if (!admin.verificationCode || String(admin.verificationCode).trim() !== String(code).trim()) {
      res.status(401);
      throw new Error('Invalid verification code for password reset');
    }
    if (admin.otpExpiresAt && new Date() > admin.otpExpiresAt) {
      res.status(400);
      throw new Error('Verification code has expired. Please request a new code.');
    }
    admin.verificationCode = null;
    admin.otpExpiresAt = null;
  } else {
    res.status(400);
    throw new Error('Current password or verification code is required to reset password');
  }

  if (newPassword.length < 6) {
    res.status(400);
    throw new Error('New password must be at least 6 characters long');
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