import { BASE_URL } from './api';

export const getHospitalDetails = async (hospitalId) => {
  try {
    const response = await fetch(`${BASE_URL}/hospital/details`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        hospitalId: hospitalId,
      }),
    });

    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const allHospitals = async () => {
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
    console.error('API Error:', error);
    throw error;
  }
};

export const createHospital = async (name, district, category, assignedITLead) => {
  try {
    const response = await fetch(`${BASE_URL}/hospital/addHospital`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, district, category, assignedITLead }),
    });
    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    console.error('API Error in createHospital:', error);
    throw error;
  }
};

export const updateHospital = async (hospitalId, name, district, clinics) => {
  try {
    const response = await fetch(`${BASE_URL}/hospital/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hospitalId, name, district, clinics }),
    });
    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    console.error('API Error in updateHospital:', error);
    throw error;
  }
};

export const deleteHospital = async (hospitalId) => {
  try {
    const response = await fetch(`${BASE_URL}/hospital/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hospitalId }),
    });
    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    console.error('API Error in deleteHospital:', error);
    throw error;
  }
};
