import { BASE_URL } from './api';

export const getPatientDetails = async (userId) => {
  try {
    const response = await fetch(`${BASE_URL}/patient/details`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userId,
      }),
    });

    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const createAppointment = async (
  patientId,
  hospitalId,
  appointmentDate,
  appointmentTime,
  clinicDetails = {}
) => {
  try {
    const response = await fetch(`${BASE_URL}/appointment/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        patientId,
        hospitalId,
        appointmentDate,
        appointmentTime,
        clinicId: clinicDetails.clinicId || null,
        clinicName: clinicDetails.clinicName || null,
        roomNumber: clinicDetails.roomNumber || null,
        service: clinicDetails.service || null,
      }),
    });

    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const getPatientAppointmentDetails = async (userId) => {
  try {
    const response = await fetch(`${BASE_URL}/appointment/user/details`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userId,
      }),
    });

    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const getPatientPrescriptionsAndLabs = async (userId, patientId) => {
  try {
    const response = await fetch(`${BASE_URL}/clinical/patient/prescriptions-and-labs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, patientId }),
    });

    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    console.error('API Error in getPatientPrescriptionsAndLabs:', error);
    return { ok: false, data: { prescriptions: [], labOrders: [] } };
  }
};

export const updateAppointment = async (appointmentId, appointmentDate, appointmentTime) => {
  try {
    const response = await fetch(`${BASE_URL}/appointment/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        appointmentId,
        appointmentDate,
        appointmentTime,
      }),
    });

    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    console.error('API Error in updateAppointment:', error);
    throw error;
  }
};

export const deleteAppointment = async (appointmentId) => {
  try {
    const response = await fetch(`${BASE_URL}/appointment/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        appointmentId,
      }),
    });

    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    console.error('API Error in deleteAppointment:', error);
    throw error;
  }
};

export const joinLiveQueue = async (userId, patientId, hospitalId, clinicName, symptoms) => {
  try {
    const response = await fetch(`${BASE_URL}/clinical/patient/queue/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        patientId,
        hospitalId,
        clinicName,
        symptoms,
      }),
    });

    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    console.error('API Error in joinLiveQueue:', error);
    throw error;
  }
};

export const updateQueueSymptoms = async (appointmentId, tokenNumber, symptoms) => {
  try {
    const response = await fetch(`${BASE_URL}/clinical/patient/queue/update-symptoms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        appointmentId,
        tokenNumber,
        symptoms,
      }),
    });

    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    console.error('API Error in updateQueueSymptoms:', error);
    throw error;
  }
};

export const cancelQueueToken = async (appointmentId, tokenNumber) => {
  try {
    const response = await fetch(`${BASE_URL}/clinical/patient/queue/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        appointmentId,
        tokenNumber,
      }),
    });

    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    console.error('API Error in cancelQueueToken:', error);
    throw error;
  }
};

export const snoozeQueueToken = async (appointmentId, tokenNumber, snoozePositions = 2) => {
  try {
    const response = await fetch(`${BASE_URL}/clinical/patient/queue/snooze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        appointmentId,
        tokenNumber,
        snoozePositions,
      }),
    });

    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    console.error('API Error in snoozeQueueToken:', error);
    throw error;
  }
};

export const createRefillRequest = async (userId, patientId, medicineName, dosage, instructions, notes, hospitalId) => {
  try {
    const response = await fetch(`${BASE_URL}/pharmacy/refill/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        patientId,
        medicineName,
        dosage,
        instructions,
        notes,
        hospitalId,
      }),
    });

    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    console.error('API Error in createRefillRequest:', error);
    throw error;
  }
};

export const updateRefillRequest = async (prescriptionId, instructions, notes) => {
  try {
    const response = await fetch(`${BASE_URL}/pharmacy/refill/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prescriptionId,
        instructions,
        notes,
      }),
    });

    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    console.error('API Error in updateRefillRequest:', error);
    throw error;
  }
};

export const cancelRefillRequest = async (prescriptionId) => {
  try {
    const response = await fetch(`${BASE_URL}/pharmacy/refill/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prescriptionId,
      }),
    });

    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    console.error('API Error in cancelRefillRequest:', error);
    throw error;
  }
};


