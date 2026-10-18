import { BASE_URL } from './api';

// 1. Fetch raw doctor records from backend
export const getAllDoctors = async () => {
  try {
    const response = await fetch(`${BASE_URL}/doctor/getAllDoctors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    console.error('API Error (getAllDoctors):', error);
    throw error;
  }
};

// 2. Fetch all hospital clinics from backend
export const getAllClinics = async () => {
  try {
    const response = await fetch(`${BASE_URL}/clinic/all`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    console.error('API Error (getAllClinics):', error);
    return { ok: false, data: { data: [] } };
  }
};

// 3. Fetch all hospitals from backend
export const getAllHospitals = async () => {
  try {
    const response = await fetch(`${BASE_URL}/hospital/all`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    console.error('API Error (getAllHospitals):', error);
    return { ok: false, data: { data: [] } };
  }
};

// 4. Fetch Doctor Desk Info by Email
export const getDoctorDeskInfo = async (email) => {
  try {
    const response = await fetch(`${BASE_URL}/clinical/doctor/desk-info`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    console.error('API Error (getDoctorDeskInfo):', error);
    return { ok: false, data: null };
  }
};

// Known doctor admin accounts registered in system
const DOCTOR_ADMIN_EMAILS = [
  'samantha.w@mediqueue.lk',
  'nhk@health.gov.lk',
  'csth@health.gov.lk',
  'cnth@health.gov.lk',
  'thkarapitiya@health.gov.lk',
  'director@lrh.health.gov.lk',
];

// Helper to normalize doctor names to "Dr. [Name]"
const formatDoctorName = (rawName, specialty) => {
  if (!rawName) return `Dr. ${specialty || 'Medical Specialist'}`;
  let clean = rawName.trim();
  if (clean.toLowerCase().startsWith('dr.')) return clean;
  // Replace prefixes like Eng., Mrs., Mr., Ms. with Dr.
  clean = clean.replace(/^(Eng\.|Mrs\.|Mr\.|Ms\.)\s*/i, '');
  return `Dr. ${clean}`;
};

// 5. Get Enriched Doctors (combines Doctor, Clinic, Hospital and Admin Desk info)
export const getEnrichedDoctors = async () => {
  try {
    const [docRes, clinicRes, hospRes] = await Promise.all([
      getAllDoctors(),
      getAllClinics(),
      getAllHospitals(),
    ]);

    if (!docRes.ok || !docRes.data) {
      return {
        ok: false,
        status: docRes.status,
        message: docRes.data?.message || 'Failed to load doctors from backend',
        doctors: [],
      };
    }

    const rawDoctors = Array.isArray(docRes.data.doctors)
      ? docRes.data.doctors
      : Array.isArray(docRes.data)
      ? docRes.data
      : [];

    const clinics = Array.isArray(clinicRes.data?.data)
      ? clinicRes.data.data
      : Array.isArray(clinicRes.data)
      ? clinicRes.data
      : [];

    const hospitals = Array.isArray(hospRes.data?.data)
      ? hospRes.data.data
      : Array.isArray(hospRes.data)
      ? hospRes.data
      : [];

    // Create lookup maps
    const clinicMap = new Map();
    clinics.forEach((c) => {
      if (c._id) clinicMap.set(String(c._id), c);
    });

    const hospMap = new Map();
    hospitals.forEach((h) => {
      if (h._id) hospMap.set(String(h._id), h);
    });

    // Query desk info for doctor admins in parallel
    const deskResults = await Promise.all(
      DOCTOR_ADMIN_EMAILS.map((email) => getDoctorDeskInfo(email))
    );

    const deskMap = new Map();
    deskResults.forEach((res) => {
      if (res?.ok && res.data?.success && res.data.data) {
        const item = res.data.data;
        if (item.doctorId) deskMap.set(String(item.doctorId), item);
        if (item.adminId) deskMap.set(String(item.adminId), item);
      }
    });

    // Merge everything into full-fledged Doctor objects
    const enrichedList = rawDoctors.map((doc, idx) => {
      const docIdStr = String(doc._id || doc.id || '');
      const adminIdStr = String(doc.adminId || '');
      const clinicIdStr = String(doc.clinicId || '');
      const hospIdStr = String(doc.hospitalId || '');

      const desk = deskMap.get(docIdStr) || deskMap.get(adminIdStr) || {};
      const clinic = clinicMap.get(clinicIdStr) || {};
      const hosp = hospMap.get(hospIdStr) || {};

      const formattedName = formatDoctorName(desk.name || doc.name, doc.specialty || desk.specialty);

      return {
        _id: doc._id || doc.id,
        id: doc._id || doc.id,
        adminId: doc.adminId,
        name: formattedName,
        rawName: desk.name || doc.name || formattedName,
        slmc: desk.staffId || doc.StaffID || doc.slmcNumber || `SLMC-${String(doc._id || '').slice(-4).toUpperCase()}`,
        specialty: doc.specialty || desk.specialty || 'General Practitioner',
        clinicId: doc.clinicId,
        clinicName: clinic.name || desk.clinicName || 'General OPD Clinic',
        roomNumber: clinic.roomNumber || desk.roomNumber || 'Room 01',
        hospitalId: doc.hospitalId,
        hospitalName: hosp.name || desk.hospitalName || 'District General Hospital',
        hospitalDistrict: hosp.district || hosp.location || 'Kalutara',
        status: doc.status || 'Available',
        timeSlots: clinic.timeSlots || ['08:00 AM - 12:00 PM', '01:00 PM - 04:00 PM'],
        services: clinic.services || ['General Consultation', 'Routine Health Checkup'],
        email: desk.email || '',
        qrCodeString: desk.qrCodeString || '',
        isOnCall: idx === 0, // Primary on-call consultant
      };
    });

    // Also include Dr. Samantha Wickramasinghe (Lead Consultant) if not in the list
    const samanthaDesk = deskMap.get('6ab1730d0f8e7f0161f1b98e');
    if (samanthaDesk && !enrichedList.some((d) => d.email === 'samantha.w@mediqueue.lk')) {
      const samHosp = hospMap.get(String(samanthaDesk.hospitalId)) || {};
      enrichedList.unshift({
        _id: samanthaDesk.doctorId || samanthaDesk.adminId,
        id: samanthaDesk.doctorId || samanthaDesk.adminId,
        adminId: samanthaDesk.adminId,
        name: samanthaDesk.name || 'Dr. Samantha Wickramasinghe',
        rawName: samanthaDesk.name || 'Dr. Samantha Wickramasinghe',
        slmc: samanthaDesk.staffId || 'STF-2024-001',
        specialty: samanthaDesk.specialty || 'Consultant Physician',
        clinicId: samanthaDesk.clinicId || '',
        clinicName: samanthaDesk.clinicName || 'General OPD Clinic',
        roomNumber: samanthaDesk.roomNumber || 'Room 03',
        hospitalId: samanthaDesk.hospitalId || '',
        hospitalName: samHosp.name || samanthaDesk.hospitalName || 'District General Hospital - Kalutara',
        hospitalDistrict: samHosp.district || 'Kalutara',
        status: 'Available',
        timeSlots: ['08:00 AM - 12:00 PM', '01:00 PM - 04:30 PM'],
        services: ['Clinical Consultation', 'Inpatient Review', 'Emergency On-Call'],
        email: samanthaDesk.email,
        qrCodeString: samanthaDesk.qrCodeString || '',
        isOnCall: true,
      });
    }

    return {
      ok: true,
      status: 200,
      data: {
        doctors: enrichedList,
      },
    };
  } catch (error) {
    console.error('Error in getEnrichedDoctors:', error);
    throw error;
  }
};