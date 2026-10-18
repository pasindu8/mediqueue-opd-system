# IT23172500 - P A D T Prathiraja
## Component 3: Triage Priority & Feedback Systems

---

### 1. Component Overview & Workload Description
- **Student ID:** IT23172500
- **Student Name:** P A D T Prathiraja
- **Component Title:** Component 3 – Triage Priority & Feedback Systems
- **Course:** IT3060 – Human Computer Interaction (HCI)
- **Project Title:** MediQueue – Appointment Booking and Queue Management for Government Hospital OPDs
- **Group Number:** WE_170
- **Group Name:** MediQueue Innovators

Component 3 ensures clinical safety, emergency prioritization, and continuous service quality improvement in government hospitals. High patient volumes often cause critical cases to wait unnoticed in manual queues. Component 3 provides clinical triage categorization, diagnostic lab order monitoring with panic-value doctor alerts, dispensary verification, and an end-to-end patient feedback and service rating system to hold public hospital departments accountable.

---

### 2. Functional & Non-Functional Requirements Covered (From Milestone 01 PDF)

| Requirement ID | Type | Requirement Description | Traceable Research Evidence |
| :--- | :--- | :--- | :--- |
| **FR-14** | Functional | **Priority / Triage Management:** Authorized hospital staff shall be able to manage eligible priority cases according to hospital clinical urgency. | Component 3 – Priority/Triage research & staff questionnaire |
| **FR-21** | Functional | **Feedback Submission:** The system shall allow patients to submit feedback and quality ratings regarding OPD services and hospital facilities. | Component 3 – Feedback/Review research |
| **FR-24** | Functional | **Help / Assistance Function:** The system shall provide immediate guidance and an emergency assistance mechanism (e.g. 1990 Suwa Seriya direct dial). | Caregiver Questionnaire – Emergency help & elderly support |
| **NFR-08** | Non-Functional | **Clinical Accuracy & Synchronization:** Queue states, medication instructions, and diagnostic assay findings must be synchronized accurately. | Staff questionnaire – Manual errors and miscommunication risks |
| **NFR-02** | Non-Functional | **Accessibility for Elderly/Vulnerable Patients:** High contrast priority badges and simplified feedback scales ensure ease of use. | Persona 01 (Nimal) & Persona 02 (Kumari) |

---

### 3. Dedicated FULL CRUD Operations (Component 3)

#### Primary CRUD: Patient OPD Quality Feedback & Service Review (`Feedback` Model)

| Operation | Action Description | Backend API Endpoint | HTTP Method | UI Screen / User Trigger |
| :--- | :--- | :--- | :--- | :--- |
| **Create (C)** | Submit star rating (1-5) and detailed feedback for Doctor, Pharmacy, Lab, or Wait Times | `/feedback/create` | `POST` | `src/app/profile/helpSupport.js` -> "Write Review" Modal |
| **Read (R)** | Fetch and view patient's submitted feedback history and hospital department response status | `/feedback/patient` | `POST` | `src/app/profile/helpSupport.js` -> Review Cards Feed |
| **Update (U)** | Edit rating stars or update review comments after hospital response or follow-up | `/feedback/update` | `POST` | `src/app/profile/helpSupport.js` -> Pencil Edit Icon Modal |
| **Delete (D)** | Delete or withdraw a submitted review from the hospital feedback registry | `/feedback/delete` | `POST` | `src/app/profile/helpSupport.js` -> Trash Can Delete Icon |

#### Secondary CRUD: Pharmacy Chronic Refill Requests (`Prescription` Model)

| Operation | Action Description | Backend API Endpoint | HTTP Method | UI Screen / User Trigger |
| :--- | :--- | :--- | :--- | :--- |
| **Create (C)** | Request chronic prescription refill from hospital dispensary | `/pharmacy/refill/request` | `POST` | `src/app/(tabs)/pharmacy.js` -> "Request Refill" Modal |
| **Read (R)** | View active prescriptions, dosage schedules, and dispensary counter tokens | `/clinical/patient/prescriptions-and-labs` | `POST` | `src/app/(tabs)/pharmacy.js` -> Pharmacy Tab |
| **Update (U)** | Update refill instructions, dosage adjustments, or patient caregiver notes | `/pharmacy/refill/update` | `POST` | `src/app/(tabs)/pharmacy.js` -> Edit Refill Modal |
| **Delete (D)** | Cancel pending refill request | `/pharmacy/refill/cancel` | `POST` | `src/app/(tabs)/pharmacy.js` -> Cancel Refill Button |

---

### 4. Assigned App Screens & UI Components

1. **`src/app/profile/helpSupport.js` (Helpdesk, Emergency Hotlines & Feedback CRUD)**:
   - 1990 Suwa Seriya direct dial button for life-threatening medical emergencies.
   - Interactive FAQ accordion for common OPD questions.
   - Complete live Feedback & Review CRUD (Write, Read list, Edit comments, Delete).
2. **`src/app/admin/lab.js` (Diagnostic Laboratory Station)**:
   - Real-time lab test sample processing feed (Dengue NS1 Antigen, Full Blood Count, Lipid Profile).
   - 4-parameter assay result input with critical panic threshold evaluation.
   - Audio broadcast alert and stamped report publishing.
3. **`src/app/admin/pharmacy.js` (Pharmacy Dispensary Station)**:
   - Counter allocation switcher (Counter 01, Counter 02, Counter 03).
   - Interactive prescription checklist, item verification, and one-click dispense.
4. **`src/app/(tabs)/pharmacy.js` (Patient Pharmacy & Lab Monitor)**:
   - Live prescription progress indicator (Doctor Sent -> Dispensing -> Ready for Pickup).
   - Downloadable verified diagnostic laboratory findings and MLT stamps.
5. **`src/app/profile/notifications.js` (Triage Alerts & Clinical Notices)**:
   - Urgent lab panic notices and pharmacy counter ready notifications.

---

### 5. Assigned Backend Files

- **Controllers**:
  - `backend/controllers/feedbackController.js` - Complete CRUD operations for patient service reviews.
  - `backend/controllers/labController.js` - Lab test queue, parameter evaluation, and report uploads.
  - `backend/controllers/pharmacyController.js` - Dispensary queues, prescription dispensing, and refill handling.
  - `backend/controllers/clinicalController.js` - Critical alert broadcasting and clinical data queries.
- **Routes**:
  - `backend/routes/feedbackRoutes.js`
  - `backend/routes/labRoutes.js`
  - `backend/routes/pharmacyRoutes.js`
  - `backend/routes/clinicalRoutes.js`
- **Models**:
  - `backend/models/Feedback.js` - Mongoose Feedback Schema (`rating`, `comment`, `category`, `status`, `response`).
  - `backend/models/Prescription.js` - Prescriptions and refill requests schema (`medicines`, `status`, `counter`).
  - `backend/models/LabOrder.js` - Diagnostic orders schema (`testName`, `results`, `isCriticalFlagged`, `verifiedBy`).
  - `backend/models/Lab.js` & `backend/models/Pharmacy.js` - Facility station schemas.

---

### 6. Assigned Frontend Services & Utilities

- `src/services/feedbackService.js` - API communication for `submitFeedback`, `fetchPatientFeedback`, `updateFeedback`, `deleteFeedback`.
- `src/services/adminService.js` - API communication for `fetchPharmacyAdminQueue`, `submitDispensePrescription`, `fetchLabAdminQueue`, `submitVerifyLabReport`.

---

### 7. HCI Design & Usability Principles Implemented

- **Visibility of System Status (Nielsen Heuristic #1)**: Distinct color-coded status badges (Green = Verified, Amber = Processing, Red = Critical Panic) immediately inform users of their test results.
- **Help Users Recognize, Diagnose, and Recover from Errors (Nielsen Heuristic #9)**: Automatic out-of-range parameter validation in laboratory screens highlights critical findings with clear text explanations.
- **Feedback & User Control (Nielsen Heuristic #3)**: Patients have the freedom to edit or withdraw their reviews at any time, promoting transparency and trust in public healthcare.
