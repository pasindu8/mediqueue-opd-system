import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoClient?.hostUri;
let ip = debuggerHost ? debuggerHost.split(':')[0] : 'localhost';

if (ip === 'localhost' && Platform.OS === 'android') {
  ip = '10.0.2.2';
}

export const BASE_URL = `http://${ip}:5000`;

export const apiFetch = async (url, options = {}) => {
  const token = await AsyncStorage.getItem('token');
  const headers = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  return fetch(url, { ...options, headers });
};
