# IT23630116 - Vithana O V D P D
## Component 4: OPD Slot Booking & Live Tracking

---

### 1. Component Overview & Workload Description
- **Student ID:** IT23630116
- **Student Name:** Vithana O V D P D
- **Component Title:** Component 4 – OPD Slot Booking & Live Tracking
- **Course:** IT3060 – Human Computer Interaction (HCI)
- **Project Title:** MediQueue – Appointment Booking and Queue Management for Government Hospital OPDs
- **Group Number:** WE_170
- **Group Name:** MediQueue Innovators

Component 4 addresses the critical problem of overcrowded waiting areas and long waiting times in Sri Lankan government hospital Outpatient Departments (OPDs). By digitizing the appointment scheduling and queue management process, Component 4 enables patients and caregivers to book designated OPD time slots in advance, receive automated digital queue tokens with verifiable QR codes, and track their estimated consultation and queue position in real-time. This significantly minimizes physical congestion, reduces patient fatigue, and improves overall OPD workflow efficiency.

---

### 2. Functional & Non-Functional Requirements Covered

| Requirement ID | Type | Requirement Description | Traceable Research Evidence |
| :--- | :--- | :--- | :--- |
| **FR-04** | Functional | **Slot Booking & Scheduling:** Patients shall be able to book available OPD time slots and select doctors or clinics. | Patient survey – Need for scheduled arrival vs walk-in waiting |
| **FR-05** | Functional | **Token Generation & QR Code:** The system shall generate digital tokens with scannable QR verification for hospital arrival. | Hospital arrival workflow & desk congestion reduction |
| **FR-15** | Functional | **Live Queue Tracking:** The system shall display real-time queue position and estimated time until consultation. | Patient anxiety reduction & wait-time transparency |
| **FR-16** | Functional | **Appointment Rescheduling & Cancellation:** Patients shall be able to update or cancel scheduled appointments in advance. | Flexibility for elderly/rural patients traveling long distances |
| **NFR-03** | Non-Functional | **Real-Time Responsiveness:** Queue status updates and live token transitions must reflect with minimal latency. | Accurate queue progression without patient confusion |
| **NFR-04** | Non-Functional | **Reliability & Concurrency:** Booking slots and queue numbers must prevent duplicate allocations under peak loads. | Prevents duplicate tokens and double-booking |

---

### 3. Dedicated FULL CRUD Operation (Component 4)

**Target Entity:** OPD Appointments & Queue Tokens (`Appointment` Model)

| Operation | Action Description | Backend API Endpoint | HTTP Method | UI Screen / User Trigger |
| :--- | :--- | :--- | :--- | :--- |
| **Create (C)** | Book a new OPD appointment time slot and generate digital queue token | `/appointment/create` | `POST` | `src/app/appointments/NewToken.js` -> "Book Appointment" / "Confirm Token" |
| **Read (R)** | View active and upcoming appointments, queue number, and QR verification | `/appointment/details`, `/appointment/user/details` | `POST` | `src/app/(tabs)/appointments.js` & `src/app/(tabs)/queue.js` |
| **Update (U)** | Reschedule appointment date, clinic slot, or update patient notes | `/appointment/update` | `POST` | `src/app/(tabs)/appointments.js` -> "Reschedule" Modal |
| **Delete (D)** | Cancel an upcoming OPD appointment slot and release token | `/appointment/delete` | `POST` | `src/app/(tabs)/appointments.js` -> "Cancel Appointment" |

---

### 4. Assigned App Screens & UI Components

1. **`src/app/(tabs)/appointments.js` (Appointments Hub)**:
   - Lists active, completed, and cancelled appointments with status badges.
   - Quick access to QR code passes and rescheduling options.
2. **`src/app/(tabs)/queue.js` (Live Queue Tracker)**:
   - Dynamic counter showing current serving token number vs patient's token.
   - Estimated wait time calculation with progress bar.
3. **`src/app/appointments/NewToken.js` (OPD Booking & Slot Selection)**:
   - Selection of hospital, clinic type, date, and preferred morning/evening time slot.
4. **`src/app/appointments/QrScan.js` (Token Verification & Hospital Check-in)**:
   - Fast hospital gate check-in via QR code scanning.
5. **`src/app/appointments/doctor.js` (Doctor Directory & Availability)**:
   - View OPD doctor profiles and clinic room allocations.

---

### 5. Backend Controllers & Routes

- **Controller:** `backend/controllers/appointmentController.js`
  - `appointmentCreate`: Validates slot capacity, creates token, and persists record.
  - `getAppointmentDetails`: Retrieves single booking data by ID.
  - `getuserAppointmentDetails`: Fetches all appointments for logged-in patient/caregiver.
  - `getAppointmentsByHospital`: Admin/Doctor queue monitoring endpoint.
  - `updateAppointmentDetails`: Updates slot/reschedules booking.
  - `deleteAppointment`: Cancels booking and updates slot availability.
- **Routes:** `backend/routes/appointmenthospitalRoutes.js`
- **Testing:** `backend/test/security_and_flow_test.js`

---

### 6. Component Dependencies & Services

- **Service Module:** `MediQueue/src/services/appointmentsService.js`
- **API Base Client:** `MediQueue/src/services/api.js`
