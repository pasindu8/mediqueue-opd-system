import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import si from './locales/si.json';
import ta from './locales/ta.json';

const LANGUAGE_KEY = 'user_selected_language';

// AsyncStorage Language Detector Plugin
const languageDetector = {
  type: 'languageDetector',
  async: true,
  init: () => {},
  detect: async (callback) => {
    try {
      // Check if previous language is saved in AsyncStorage
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
      if (savedLanguage) {
        return callback(savedLanguage);
      }
      return callback('en'); // Default fallback language is 'en'
    } catch (error) {
      console.log('Error reading language', error);
      callback('en');
    }
  },
  cacheUserLanguage: async (language) => {
    try {
      // Cache newly selected user language into AsyncStorage
      await AsyncStorage.setItem(LANGUAGE_KEY, language);
    } catch (error) {
      console.log('Error saving language', error);
    }
  },
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3',
    fallbackLng: 'en',
    resources: {
      en: { translation: en },
      si: { translation: si },
      ta: { translation: ta },
    },
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;