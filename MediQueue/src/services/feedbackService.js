import { BASE_URL } from './api';

// 1. Submit Feedback (Create)
export const submitFeedback = async (payload) => {
  try {
    const response = await fetch(`${BASE_URL}/feedback/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    console.error('API Error in submitFeedback:', error);
    throw error;
  }
};

// 2. Fetch Patient Feedback (Read)
export const fetchPatientFeedback = async (userId, patientId) => {
  try {
    const response = await fetch(`${BASE_URL}/feedback/patient`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, patientId }),
    });
    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    console.error('API Error in fetchPatientFeedback:', error);
    throw error;
  }
};

// 3. Update Feedback (Update)
export const updateFeedback = async (feedbackId, rating, comment, category) => {
  try {
    const response = await fetch(`${BASE_URL}/feedback/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feedbackId, rating, comment, category }),
    });
    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    console.error('API Error in updateFeedback:', error);
    throw error;
  }
};

// 4. Delete Feedback (Delete)
export const deleteFeedback = async (feedbackId) => {
  try {
    const response = await fetch(`${BASE_URL}/feedback/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feedbackId }),
    });
    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    console.error('API Error in deleteFeedback:', error);
    throw error;
  }
};
