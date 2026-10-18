# IT23749252 - P R G K R S Bandara
## Component 2: NIC/PHN Verification & Security

---

### 1. Component Overview & Workload Description
- **Student ID:** IT23749252
- **Student Name:** P R G K R S Bandara
- **Component Title:** Component 2 – NIC/PHN Verification & Security
- **Course:** IT3060 – Human Computer Interaction (HCI)
- **Project Title:** MediQueue – Appointment Booking and Queue Management for Government Hospital OPDs
- **Group Number:** WE_170
- **Group Name:** MediQueue Innovators

Component 2 provides secure, accessible digital identity management for the public hospital system. In government OPDs, patient record duplication, identity fraud, and proxy management difficulties represent major administrative bottlenecks. Component 2 implements secure National Identity Card (NIC) verification, Personal Health Number (PHN) lookup, SMS OTP 2-factor authentication, dependent family profile management, and role-based access control for hospital staff.

---

### 2. Functional & Non-Functional Requirements Covered (From Milestone 01 PDF)

| Requirement ID | Type | Requirement Description | Traceable Research Evidence |
| :--- | :--- | :--- | :--- |
| **FR-01** | Functional | **User Registration and Login:** The system shall allow users to create an account and securely log in. | Patient and caregiver need for personalized appointment management |
| **FR-06** | Functional | **Identity Verification:** The system shall support secure patient verification using an appropriate identifier such as NIC/PHN and OTP. | Component 2 – Verification research & privacy concerns (Finding 04) |
| **FR-11** | Functional | **Proxy Booking:** The system shall allow an authorized caregiver to book and manage appointments on behalf of a family member. | Caregiver Questionnaire – Proxy Booking (Finding 03) |
| **FR-12** | Functional | **Multiple Family Profiles:** Caregivers shall be able to manage appointment profiles for multiple family members under one account. | Caregiver Questionnaire – family profile requirement |
| **NFR-06** | Non-Functional | **Security & Authentication:** User accounts and patient records must be protected via encrypted tokens (JWT) and secure data handling. | Patient concerns about medical data privacy |
| **NFR-07** | Non-Functional | **Privacy & Role-Based Access:** Medical and personal health data must only be accessible to authorized users and medical personnel. | Ethical considerations & clinical privacy standards |

---

### 3. Dedicated FULL CRUD Operation (Component 2)

**Target Entity:** Patient Identity Profile, PHN & Health Demographics (`PatientDetails` Model)

| Operation | Action Description | Backend API Endpoint | HTTP Method | UI Screen / User Trigger |
| :--- | :--- | :--- | :--- | :--- |
| **Create (C)** | Register new patient medical identity with PHN, DOB, blood group, allergies, and emergency contact | `/patient/create` | `POST` | `src/app/profile/AddAccountDetails.js` & `PersonalDetails.js` |
| **Read (R)** | Retrieve authenticated patient profile, PHN credentials, and emergency contact details | `/patient/details` | `POST` | `src/app/(tabs)/profile.js` & `src/app/profile/accountDetails.js` |
| **Update (U)** | Update patient address, phone, emergency contacts, known allergies, and medical history | `/patient/update` | `POST` | `src/app/profile/EditAccountDetails.js` -> Save Changes Button |
| **Delete (D)** | Remove patient demographic profile / de-register account records | `/patient/delete` | `POST` | `src/app/(tabs)/profile.js` & `accountDetails.js` -> Remove Profile |

---

### 4. Assigned App Screens & UI Components

1. **`src/app/LoginNIC.js` (NIC Authentication Screen)**:
   - National Identity Card (Old 9-digit + V/X and New 12-digit) input validation.
   - Trilingual language selection toggle (English, Sinhala, Tamil).
2. **`src/app/LoginPhone.js` & `src/app/opt.js` (SMS OTP Verification)**:
   - Mobile phone number submission with auto-prefix (+94).
   - 6-digit numeric OTP entry with countdown resend timer and error handling.
3. **`src/app/Register.js` (Patient Account Creation)**:
   - Account setup with name, phone, email, and password hashing.
4. **`src/app/PersonalDetails.js` & `src/app/MedicalDetails.js` (Initial Health Profile Setup)**:
   - Step-by-step onboarding capturing age, gender, address, blood group, and known drug allergies.
5. **`src/app/AdminLogin.js` (Hospital Staff Secure Login)**:
   - Role-based portal authentication for Doctors, Pharmacists, Lab Technicians, IT Support, and Super Admins.
6. **`src/app/(tabs)/profile.js` (Profile Overview & Language Settings)**:
   - Displays user details, active PHN, app language switcher, and secure session logout.
7. **`src/app/profile/accountDetails.js`, `AddAccountDetails.js`, `EditAccountDetails.js`**:
   - Complete interactive profile management supporting Create, Read, Update, and Delete.

---

### 5. Assigned Backend Files

- **Controllers**:
  - `backend/controllers/authController.js` - User registration, NIC login, OTP generation, and token signing.
  - `backend/controllers/patientController.js` - Patient medical demographics, PHN generation, profile updates, and deletion.
  - `backend/controllers/adminController.js` - Hospital staff role authentication and administrative token issuance.
- **Routes**:
  - `backend/routes/authRoutes.js`
  - `backend/routes/patientRoutes.js`
  - `backend/routes/adminRoutes.js`
- **Models**:
  - `backend/models/User.js` - Authentication credentials schema (`name`, `phoneNumber`, `NIC`, `password`).
  - `backend/models/PatientDetails.js` - Demographic & medical history schema (`userId`, `patientId`, `dateOfBirth`, `bloodGroup`, `knownAllergies`, `emergencyContact`).
  - `backend/models/Admin.js` - Staff role schema (`StaffID`, `email`, `role`, `hospitalId`).
- **Middlewares**:
  - `backend/middleware/authMiddleware.js` - JWT bearer token verification and route protection.

---

### 6. Assigned Frontend Services & Utilities

- `src/services/authService.js` - API communication for `loginNIC`, `loginPhone`, `verifyOTP`, `registerUser`.
- `src/services/profileService.js` - API communication for `getPatientDetails`, `addPatientDetails`, `EditPatientDetails`, `deletePatientProfile`.

---

### 7. HCI Design & Usability Principles Implemented

- **Error Prevention & Format Feedback (Nielsen Heuristic #5)**: Real-time validation for Sri Lankan NIC numbers (9 numbers + V/X or 12 numeric digits) prevents incorrect registration.
- **User Control and Freedom (Nielsen Heuristic #3)**: Patients can review, edit, or delete their profile information at any time without hospital counter assistance.
- **Aesthetic and Minimalist Design (Nielsen Heuristic #8)**: Medical information is grouped logically into accordion tabs (Demographics, Emergency Contacts, Allergies) to avoid cognitive overload.
