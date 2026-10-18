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

export const EditPatientDetails = async (userId, fullName, dateOfBirth, gender, age, address, emergencyContact, bloodGroup, knownAllergies, medicalHistory) => {
  try {
    const response = await fetch(`${BASE_URL}/patient/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId, 
        fullName, 
        dateOfBirth, 
        gender, 
        age, 
        address, 
        emergencyContact, 
        bloodGroup, 
        knownAllergies, 
        medicalHistory
      }),
    });

    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};


export const addPatientDetails = async (userId, fullName, dateOfBirth, gender, age, address, emergencyContact, bloodGroup, knownAllergies, medicalHistory) => {
  try {
    const response = await fetch(`${BASE_URL}/patient/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId, 
        fullName, 
        dateOfBirth, 
        gender, 
        age, 
        address, 
        emergencyContact, 
        bloodGroup, 
        knownAllergies, 
        medicalHistory
      }),
    });

    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const deletePatientProfile = async (userId) => {
  try {
    const response = await fetch(`${BASE_URL}/patient/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
      }),
    });

    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    console.error('API Error in deletePatientProfile:', error);
    throw error;
  }
};