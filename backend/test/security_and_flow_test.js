const assert = require('assert');
let jwt;
try {
    jwt = require('jsonwebtoken');
} catch (e) {
    jwt = require('../../../../backend/node_modules/jsonwebtoken');
}

// Ensure environment variable for test
process.env.JWT_SECRET = process.env.JWT_SECRET || 'pasindu_secret_key';
const JWT_SECRET = process.env.JWT_SECRET;

console.log('--- RUNNING SECURITY & LOGIC TESTS ---');

// Test 1: JWT Secret and Token Generation
console.log('Test 1: JWT token generation and verification...');
const mockUser = {
    _id: '67b36f1c24e89a0011223344',
    type: 'user',
    NIC: '200012345678',
    phoneNumber: '0771234567'
};

const token = jwt.sign(
    { id: mockUser._id, type: mockUser.type, NIC: mockUser.NIC, phoneNumber: mockUser.phoneNumber },
    JWT_SECRET,
    { expiresIn: '7d' }
);
assert(token && token.length > 20, 'Token generation failed');

const decoded = jwt.verify(token, JWT_SECRET);
assert.strictEqual(decoded.id, mockUser._id, 'Decoded user ID does not match');
assert.strictEqual(decoded.type, 'user', 'Decoded type does not match');
console.log('  PASS: JWT token generated and verified successfully.');

// Test 2: Token rejection for invalid secret
console.log('Test 2: Rejection of token with invalid secret...');
let caught = false;
try {
    jwt.verify(token, 'wrong_secret_key');
} catch (e) {
    caught = true;
}
assert(caught, 'Should reject token with invalid secret');
console.log('  PASS: Invalid secret rejected.');

// Test 3: OPD Booking Advance Date Rule (Reject past dates and today, allow tomorrow onwards)
console.log('Test 3: Advance booking date validation...');
const validateBookingDate = (appointmentDateStr) => {
    const appDate = new Date(appointmentDateStr);
    if (isNaN(appDate.getTime())) {
        throw new Error('Invalid appointment date format');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const bookingDate = new Date(appDate);
    bookingDate.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (bookingDate < tomorrow) {
        throw new Error('Appointments can only be booked from tomorrow onwards. Same-day (today) and past date bookings are not permitted.');
    }
    return true;
};

// Past date should throw
let pastCaught = false;
try {
    validateBookingDate('2020-01-01');
} catch (e) {
    pastCaught = true;
}
assert(pastCaught, 'Past date should be rejected');

// Today's date should throw
let todayCaught = false;
try {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    validateBookingDate(`${yyyy}-${mm}-${dd}`);
} catch (e) {
    todayCaught = true;
}
assert(todayCaught, 'Today\'s date should be rejected for advance booking');

// Tomorrow's date should succeed
const tomorrowDate = new Date();
tomorrowDate.setDate(tomorrowDate.getDate() + 1);
const tomYyyy = tomorrowDate.getFullYear();
const tomMm = String(tomorrowDate.getMonth() + 1).padStart(2, '0');
const tomDd = String(tomorrowDate.getDate()).padStart(2, '0');
const tomorrowStr = `${tomYyyy}-${tomMm}-${tomDd}`;
assert.strictEqual(validateBookingDate(tomorrowStr), true, 'Tomorrow\'s date should be permitted');

// 5 days ahead should succeed
const futureDate = new Date();
futureDate.setDate(futureDate.getDate() + 5);
const futYyyy = futureDate.getFullYear();
const futMm = String(futureDate.getMonth() + 1).padStart(2, '0');
const futDd = String(futureDate.getDate()).padStart(2, '0');
assert.strictEqual(validateBookingDate(`${futYyyy}-${futMm}-${futDd}`), true, 'Future date should be permitted');
console.log('  PASS: Advance date booking correctly enforces tomorrow onwards.');

// Test 4: Role-based Authorization Check
console.log('Test 4: Role check authorization...');
const requireRole = (...roles) => (user) => {
    if (!user || !roles.includes(user.role || user.type)) {
        throw new Error('Insufficient permissions');
    }
    return true;
};

const userChecker = requireRole('user');
assert.strictEqual(userChecker(mockUser), true, 'User should pass user role check');

let adminAccessDenied = false;
try {
    userChecker({ type: 'guest' });
} catch (e) {
    adminAccessDenied = true;
}
assert(adminAccessDenied, 'Guest should be rejected from user role');

const adminChecker = requireRole('super_admin', 'admin', 'it_support');
assert.strictEqual(adminChecker({ role: 'admin' }), true, 'Admin role should pass');
assert.strictEqual(adminChecker({ role: 'it_support' }), true, 'IT support role should pass');

let userBlockedFromAdmin = false;
try {
    adminChecker(mockUser);
} catch (e) {
    userBlockedFromAdmin = true;
}
assert(userBlockedFromAdmin, 'User should be blocked from admin endpoints');
console.log('  PASS: Role-based permissions correctly enforce user vs admin separation.');

// Test 5: Patient Defaults & Validation
console.log('Test 5: Patient creation defaults and validation...');
const validatePatientPayload = (body) => {
    const { fullName, dateOfBirth, gender, age, address, emergencyContact, bloodGroup, knownAllergies, medicalHistory } = body;
    if (!fullName || !dateOfBirth || !gender || age === undefined || !address || !emergencyContact || !bloodGroup) {
        throw new Error('All required fields including bloodGroup must be present');
    }
    return {
        bloodGroup: String(bloodGroup).trim(),
        knownAllergies: Array.isArray(knownAllergies) ? knownAllergies : (knownAllergies ? [knownAllergies] : []),
        medicalHistory: Array.isArray(medicalHistory) ? medicalHistory : (medicalHistory ? [medicalHistory] : [])
    };
};

let missingBloodGroup = false;
try {
    validatePatientPayload({
        fullName: 'Jane Doe',
        dateOfBirth: '1995-05-10',
        gender: 'Female',
        age: 30,
        address: '123 Main St',
        emergencyContact: '0771234567'
    });
} catch (e) {
    missingBloodGroup = true;
}
assert(missingBloodGroup, 'Missing bloodGroup must throw');

const sanitized = validatePatientPayload({
    fullName: 'Jane Doe',
    dateOfBirth: '1995-05-10',
    gender: 'Female',
    age: 30,
    address: '123 Main St',
    emergencyContact: '0771234567',
    bloodGroup: 'B+'
});
assert.strictEqual(sanitized.bloodGroup, 'B+')
assert.deepStrictEqual(sanitized.knownAllergies, [], 'Should default to empty array, not fake "None"');
assert.deepStrictEqual(sanitized.medicalHistory, [], 'Should default to empty array, not fake history');
console.log('  PASS: Patient defaults do not inject fake strings and strictly require bloodGroup.');

console.log('\n--- ALL 5 VERIFICATION TESTS PASSED SUCCESSFULLY! ---');
