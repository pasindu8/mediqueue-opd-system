# MediQueue – OPD Appointment Booking and Queue Management System

> **Course:** IT3060 – Human Computer Interaction (HCI)  
> **Group:** WE_170 | MediQueue Innovators  
> **Target Environment:** Sri Lankan Government Hospital Outpatient Departments (OPDs)

---

## 👥 Group Members & Individual Components

| Student ID | Student Name | Assigned Component | Dedicated CRUD & Responsibilities | Branch |
| :--- | :--- | :--- | :--- | :--- |
| **IT23623286** | H H V J Karunarathna | **Component 1** – Search & Hospital Filtering | Hospital directory, OPD unit lookup, district filtering, multilingual UI | `IT23623286_Component_1` |
| **IT23749252** | P R G K R S Bandara | **Component 2** – NIC/PHN Verification & Security | Patient verification, NIC/PHN auth, OTP verification, proxy family profiles | `IT23749252_Component_2` |
| **IT23172500** | P A D T Prathiraja | **Component 3** – Triage Priority & Feedback Systems | OPD star rating & review CRUD, clinical priority triage, pharmacy refills | `IT23172500_Component_3` |
| **IT23630116** | Vithana O V D P D | **Component 4** – OPD Slot Booking & Live Tracking | OPD slot booking CRUD, digital token generation, QR check-in, real-time wait queue | `IT23630116_Component_4` |

---

## 🏗️ Repository Architecture

This repository contains the complete cross-platform mobile frontend and Express backend:
- `MediQueue/` – React Native / Expo patient and staff mobile interface.
- `backend/` – Express.js REST API with MongoDB and JWT authentication.

### Git Branch Structure
- `main` – Production-ready integrated application containing merged components from all 4 group members.
- `IT23623286_Component_1` (`IT23623286`) – Search & Hospital Filtering by Member 1.
- `IT23749252_Component_2` (`IT23749252`) – Verification & Security by Member 2.
- `IT23172500_Component_3` (`IT23172500`) – Triage & Patient Feedback by Member 3.
- `IT23630116_Component_4` (`IT23630116`) – OPD Slot Booking & Live Tracking by Member 4.

---

## 🚀 Getting Started

### 1. Backend Setup
```bash
cd backend
npm install
npm run dev # or npm start
```

### 2. Frontend (MediQueue) Setup
```bash
cd MediQueue
npm install
npx expo start
```
