import { BASE_URL } from './api';

// --- AUTHENTICATION ---
export const loginAdmin = async (emailOrStaffId, password) => {
  try {
    const response = await fetch(`${BASE_URL}/admin/loginadmin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: emailOrStaffId,
        StaffID: emailOrStaffId,
        password,
      }),
    });
    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    console.error('API Error in loginAdmin:', error);
    throw error;
  }
};

export const registerOfficer = async (name, StaffID, email, phoneNumber, password, role = 'it_support') => {
  try {
    const response = await fetch(`${BASE_URL}/admin/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        StaffID,
        email,
        phoneNumber,
        password,
        role,
      }),
    });
    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    console.error('API Error in registerOfficer:', error);
    throw error;
  }
};

export const fetchAllOfficers = async () => {
  try {
    const response = await fetch(`${BASE_URL}/admin/all`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    console.error('API Error in fetchAllOfficers:', error);
    throw error;
  }
};

// --- DOCTOR DESK ---
export const fetchDoctorDeskData = async (adminId) => {
  try {
    const response = await fetch(`${BASE_URL}/doctor/gacd`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminId }),
    });
    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    console.error('API Error in fetchDoctorDeskData:', error);
    throw error;
  }
};

export const fetchDoctorQueue = async (hospitalId, clinicId) => {
  try {
    const response = await fetch(`${BASE_URL}/appointment/getByHospital`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hospitalId, clinicId }),
    });
    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    console.error('API Error in fetchDoctorQueue:', error);
    throw error;
  }
};

export const submitFinishConsultation = async (consultationPayload) => {
  try {
    const response = await fetch(`${BASE_URL}/clinical/doctor/finish-consultation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(consultationPayload),
    });
    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    console.error('API Error in submitFinishConsultation:', error);
    throw error;
  }
};

// --- PHARMACY DESK ---
export const fetchPharmacyAdminQueue = async (hospitalId) => {
  try {
    const response = await fetch(`${BASE_URL}/clinical/pharmacy/queue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hospitalId }),
    });
    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    console.error('API Error in fetchPharmacyAdminQueue:', error);
    throw error;
  }
};

export const submitDispensePrescription = async (prescriptionId, token, pharmacistName, counter) => {
  try {
    const response = await fetch(`${BASE_URL}/clinical/pharmacy/dispense`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prescriptionId, token, pharmacistName, counter }),
    });
    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    console.error('API Error in submitDispensePrescription:', error);
    throw error;
  }
};

export const submitSkipPrescription = async (prescriptionId, token) => {
  try {
    const response = await fetch(`${BASE_URL}/clinical/pharmacy/skip`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prescriptionId, token }),
    });
    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    console.error('API Error in submitSkipPrescription:', error);
    throw error;
  }
};

// --- LAB DESK ---
export const fetchLabAdminQueue = async (hospitalId) => {
  try {
    const response = await fetch(`${BASE_URL}/clinical/lab/queue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hospitalId }),
    });
    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    console.error('API Error in fetchLabAdminQueue:', error);
    throw error;
  }
};

export const submitVerifyLabReport = async (payload) => {
  try {
    const isFormData = typeof FormData !== 'undefined' && payload instanceof FormData;
    const response = await fetch(`${BASE_URL}/clinical/lab/verify-publish`, {
      method: 'POST',
      headers: isFormData ? undefined : { 'Content-Type': 'application/json' },
      body: isFormData ? payload : JSON.stringify(payload),
    });
    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    console.error('API Error in submitVerifyLabReport:', error);
    throw error;
  }
};

// --- HOSPITALS & SUPER ADMIN ---
export const fetchAllHospitals = async () => {
  try {
    const response = await fetch(`${BASE_URL}/hospital/all`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    console.error('API Error in fetchAllHospitals:', error);
    throw error;
  }
};

export const createHospital = async (name, district, category, adminEmail) => {
  try {
    const response = await fetch(`${BASE_URL}/hospital/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        district,
        category,
        assignedITLead: adminEmail,
      }),
    });
    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    console.error('API Error in createHospital:', error);
    throw error;
  }
};

export const getHospitalDetails = async (hospitalId) => {
  try {
    const response = await fetch(`${BASE_URL}/hospital/details`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hospitalId }),
    });
    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    console.error('API Error in getHospitalDetails:', error);
    throw error;
  }
};

// --- CLINICS ---
export const fetchHospitalClinics = async (hospitalId) => {
  try {
    const response = await fetch(`${BASE_URL}/clinic/allhc`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hospitalId }),
    });
    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    console.error('API Error in fetchHospitalClinics:', error);
    throw error;
  }
};

export const createClinic = async (hospitalId, name, roomNumber, services, timeSlots, status = 'active') => {
  try {
    const response = await fetch(`${BASE_URL}/clinic/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hospitalId,
        name,
        roomNumber,
        status,
        services,
        timeSlots,
      }),
    });
    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    console.error('API Error in createClinic:', error);
    throw error;
  }
};

export const updateClinic = async (clinicId, name, roomNumber, services, timeSlots, status = 'active') => {
  try {
    const response = await fetch(`${BASE_URL}/clinic/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clinicId,
        name,
        roomNumber,
        status,
        services,
        timeSlots,
      }),
    });
    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    console.error('API Error in updateClinic:', error);
    throw error;
  }
};

export const deleteClinic = async (clinicId) => {
  try {
    const response = await fetch(`${BASE_URL}/clinic/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clinicId }),
    });
    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    console.error('API Error in deleteClinic:', error);
    throw error;
  }
};

// --- DOCTORS ---
export const fetchHospitalDoctors = async (hospitalId) => {
  try {
    const response = await fetch(`${BASE_URL}/doctor/all`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hospitalId }),
    });
    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    console.error('API Error in fetchHospitalDoctors:', error);
    throw error;
  }
};

export const createDoctor = async (slmc, specialty, hospitalId, clinicId, status = 'Available') => {
  try {
    const response = await fetch(`${BASE_URL}/doctor/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        StaffID: slmc,
        specialty,
        hospitalId,
        clinicId,
        status,
      }),
    });
    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    console.error('API Error in createDoctor:', error);
    throw error;
  }
};

export const updateDoctor = async (doctorId, slmc, specialty, clinicId, status = 'Available') => {
  try {
    const response = await fetch(`${BASE_URL}/doctor/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        doctorId,
        slmc,
        specialty,
        clinicId,
        status,
      }),
    });
    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    console.error('API Error in updateDoctor:', error);
    throw error;
  }
};

export const deleteDoctor = async (doctorId) => {
  try {
    const response = await fetch(`${BASE_URL}/doctor/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doctorId }),
    });
    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    console.error('API Error in deleteDoctor:', error);
    throw error;
  }
};

// --- PHARMACIES ---
export const fetchHospitalPharmacies = async (hospitalId) => {
  try {
    const response = await fetch(`${BASE_URL}/pharmacy/all`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hospitalId }),
    });
    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    console.error('API Error in fetchHospitalPharmacies:', error);
    throw error;
  }
};

export const createPharmacyCounter = async (counter, staff, hospitalId) => {
  try {
    const response = await fetch(`${BASE_URL}/pharmacy/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ counter, staff, hospitalId, status: 'active' }),
    });
    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    console.error('API Error in createPharmacyCounter:', error);
    throw error;
  }
};

export const updatePharmacyCounter = async (pharmacyId, counter, staff, status = 'active') => {
  try {
    const response = await fetch(`${BASE_URL}/pharmacy/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pharmacyId, counter, staff, status }),
    });
    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    console.error('API Error in updatePharmacyCounter:', error);
    throw error;
  }
};

export const deletePharmacyCounter = async (pharmacyId) => {
  try {
    const response = await fetch(`${BASE_URL}/pharmacy/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pharmacyId }),
    });
    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    console.error('API Error in deletePharmacyCounter:', error);
    throw error;
  }
};

// --- LAB UNITS ---
export const fetchHospitalLabs = async (hospitalId) => {
  try {
    const response = await fetch(`${BASE_URL}/lab/all`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hospitalId }),
    });
    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    console.error('API Error in fetchHospitalLabs:', error);
    throw error;
  }
};

export const createLabUnit = async (unit, staff, sampleTypes, hospitalId) => {
  try {
    const response = await fetch(`${BASE_URL}/lab/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ unit, staff, sampleTypes, hospitalId, status: 'active' }),
    });
    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    console.error('API Error in createLabUnit:', error);
    throw error;
  }
};

export const updateLabUnit = async (labId, unit, staff, sampleTypes, status = 'active') => {
  try {
    const response = await fetch(`${BASE_URL}/lab/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ labId, unit, staff, sampleTypes, status }),
    });
    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    console.error('API Error in updateLabUnit:', error);
    throw error;
  }
};

export const deleteLabUnit = async (labId) => {
  try {
    const response = await fetch(`${BASE_URL}/lab/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ labId }),
    });
    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    console.error('API Error in deleteLabUnit:', error);
    throw error;
  }
};
