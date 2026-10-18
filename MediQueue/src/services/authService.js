import { BASE_URL } from './api';

export const registerUser = async (name, nic, phoneNumber) => {
  try {
    const response = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: name,
        NIC: nic,
        phoneNumber: phoneNumber,
      }),
    });

    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const verifyUser = async (code, userId) => {
  try {
    const response = await fetch(`${BASE_URL}/auth/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: code,
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

export const loginNIC = async (nic, password) => {
  try {
    const response = await fetch(`${BASE_URL}/auth/loginnic`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nic: nic,
        password: password,
      }),
    });

    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const optcodegeni = async (phone) => {
  try {
    const response = await fetch(`${BASE_URL}/auth/optcodegeni`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone: phone,
      }),
    });

    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const loginPhone = async (phone, code) => {
  try {
    const response = await fetch(`${BASE_URL}/auth/loginphone`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone: phone,
        code: code,
      }),
    });

    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};