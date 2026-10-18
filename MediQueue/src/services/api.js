import Constants from 'expo-constants';
import { Platform } from 'react-native';

const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoClient?.hostUri;
let ip = debuggerHost ? debuggerHost.split(':')[0] : 'localhost';

if (ip === 'localhost' && Platform.OS === 'android') {
  ip = '10.0.2.2';
}

export const BASE_URL = `http://${ip}:5000`;