# IT23623286 - H H V J Karunarathna
## Component 1: Search & Hospital Filtering

---

### 1. Component Overview & Workload Description
- **Student ID:** IT23623286
- **Student Name:** H H V J Karunarathna
- **Component Title:** Component 1 – Search & Hospital Filtering
- **Course:** IT3060 – Human Computer Interaction (HCI)
- **Project Title:** MediQueue – Appointment Booking and Queue Management for Government Hospital OPDs
- **Group Number:** WE_170
- **Group Name:** MediQueue Innovators

Component 1 focuses on eliminating patient uncertainty before travelling to government hospitals. Patients and caregivers often commute long distances without knowing whether a specific hospital OPD, clinic type, or specialized service is operational. Component 1 provides real-time search, multi-criteria filtering (by district, clinic category, doctor specialty, and availability), hospital information display, and multi-language accessibility (Sinhala, Tamil, English).

---

### 2. Functional & Non-Functional Requirements Covered (From Milestone 01 PDF)

| Requirement ID | Type | Requirement Description | Traceable Research Evidence |
| :--- | :--- | :--- | :--- |
| **FR-02** | Functional | **Hospital Search:** The system shall allow users to search for available government hospitals across Sri Lanka. | Patient Questionnaire – Hospital/OPD access and selection |
| **FR-03** | Functional | **OPD Search and Filtering:** Users shall be able to filter hospitals and OPDs by relevant criteria such as location, district, clinic type, and available services. | Component 1 – Search & Filtering research (Finding 01 & 02) |
| **FR-19** | Functional | **Hospital and Clinic Information:** Users shall be able to view relevant hospital, OPD, clinic, doctor rosters, and service information before booking. | Patient search and filtering needs |
| **FR-23** | Functional | **Multi-Language Support:** The system shall support relevant national languages (Sinhala, Tamil, and English) across the application. | Accessibility for diverse literacy levels |
| **NFR-13** | Non-Functional | **Multilingual Accessibility:** Supported languages must be presented consistently throughout key user search flows. | Inclusive design for non-English speakers |
| **NFR-01** | Non-Functional | **Usability & Learnability:** The search interface must be simple, clean, and intuitive with clear filter tags. | Usability considerations for elderly patients |

---

### 3. Dedicated FULL CRUD Operation (Component 1)

**Target Entity:** Government Hospital Directory & OPD Units (`Hospital` Model)

| Operation | Action Description | Backend API Endpoint | HTTP Method | UI Screen / User Trigger |
| :--- | :--- | :--- | :--- | :--- |
| **Create (C)** | Register new government hospital into national directory with district, category, and assigned IT lead | `/hospital/addHospital` | `POST` | `src/app/admin/super-admin.js` -> "+ Add Hospital" Modal |
| **Read (R)** | Search & filter hospitals by district/name and fetch hospital details and OPD clinics | `/hospital/all` & `/hospital/details` | `POST` | `src/app/appointments/doctor.js` & `NewToken.js` & `super-admin.js` |
| **Update (U)** | Update hospital details, district jurisdiction, OPD units, or assigned IT administrative leads | `/hospital/update` | `POST` | `src/app/admin/super-admin.js` -> Edit Hospital Modal |
| **Delete (D)** | De-register or remove a hospital entry from the national OPD directory | `/hospital/delete` | `POST` | `src/app/admin/super-admin.js` -> Delete Hospital Button |

---

### 4. Assigned App Screens & UI Components

1. **`src/app/appointments/doctor.js` (Doctor Specialty Search & Filtering)**:
   - Search bar with instant real-time debounced query filtering.
   - Filter chips for medical specialties (Cardiology, Dermatology, General Medicine, Pediatrics, Dental).
   - Doctor profile cards displaying room numbers, clinic affiliations, and availability badges.
2. **`src/app/appointments/NewToken.js` (Hospital & OPD Clinic Selector)**:
   - District selection picker and hospital facility dropdown.
   - Clinic unit selector displaying operational status and active queue counts.
   - Date and time-slot selection for OPD consultation.
3. **`src/app/admin/super-admin.js` (National Hospital Grid & Directory Management)**:
   - Complete administrative CRUD management for hospitals, OPD clinics, and district officers.
   - District distribution metrics and real-time hospital search.
4. **`src/app/admin/it-support.js` (Hospital IT Infrastructure Roster)**:
   - Doctors, clinics, pharmacies, and lab stations configuration.
5. **`src/locales/` (`en.json`, `si.json`, `ta.json`) & `src/i18n.js`**:
   - Trilingual localization engine supporting instant English, Sinhala (සිංහල), and Tamil (தமிழ்) UI translation.

---

### 5. Assigned Backend Files

- **Controllers**:
  - `backend/controllers/hospitalController.js` - Hospital search, district filtering, creation, update, and deletion.
  - `backend/controllers/clinicController.js` - OPD clinic scheduling, room allocations, and clinic queries.
  - `backend/controllers/doctorController.js` - Doctor directory, specialties, and hospital affiliations.
- **Routes**:
  - `backend/routes/hospitalRoutes.js`
  - `backend/routes/clinicRoutes.js`
  - `backend/routes/doctorRoutes.js`
- **Models**:
  - `backend/models/Hospital.js` - Mongoose Hospital Schema (`name`, `district`, `category`, `clinics`, `assignedITLead`).
  - `backend/models/Clinic.js` - Mongoose Clinic Schema (`name`, `roomNumber`, `hospitalId`, `service`).
  - `backend/models/Doctor.js` - Mongoose Doctor Schema (`name`, `specialty`, `hospitalId`, `clinicId`).

---

### 6. Assigned Frontend Services & Utilities

- `src/services/hospitalService.js` - API communication for `allHospitals`, `getHospitalDetails`, `createHospital`, `updateHospital`, `deleteHospital`.
- `src/services/doctorService.js` - API communication for `getAllDoctors`, `getDoctorsBySpecialty`.
- `src/i18n.js` - Translation provider with `react-i18next`.

---

### 7. HCI Design & Usability Principles Implemented

- **Recognition Rather Than Recall (Nielsen Heuristic #6)**: Visual district tags and specialty badges allow patients to recognize available clinics without typing complex medical terms.
- **Accessibility & Multilingual Inclusion (NFR-13)**: Trilingual toggling ensures patients from rural or non-English speaking backgrounds can independently navigate hospital services.
- **Error Prevention (Nielsen Heuristic #5)**: Dynamic dropdowns and validated search filters prevent users from searching for non-existent clinic sessions.
