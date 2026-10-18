import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function IndexScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const savedAdmin = await AsyncStorage.getItem('adminUser');
        const adminRole = await AsyncStorage.getItem('adminRole');
        if (savedAdmin || adminRole) {
          router.replace('/admin/portal');
          return;
        }

        const savedId = await AsyncStorage.getItem('userId');
        const NIC = await AsyncStorage.getItem('NIC');
        if (savedId && NIC) {
          router.replace('/(tabs)/dashboard');
          return;
        }
      } catch (error) {
        console.error('Error checking auth:', error);
      }
    };

    checkAuth();
  }, []);

  const currentLang = i18n.language;

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Graphic Image */}
      <Image
        source={require('../assets/images/onboarding1.png')}
        style={styles.image}
        resizeMode="cover"
      />

      {/* Language Selector Pills */}
      <View style={styles.langSection}>
        <Text style={styles.langLabel}>Select Language</Text>
        <View style={styles.langRow}>
          <TouchableOpacity
            style={[styles.langBtn, currentLang === 'en' && styles.activeLangBtn]}
            onPress={() => changeLanguage('en')}
            activeOpacity={0.8}
          >
            <Text style={[styles.langBtnText, currentLang === 'en' && styles.activeLangBtnText]}>
              English
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.langBtn, currentLang === 'si' && styles.activeLangBtn]}
            onPress={() => changeLanguage('si')}
            activeOpacity={0.8}
          >
            <Text style={[styles.langBtnText, currentLang === 'si' && styles.activeLangBtnText]}>
              සිංහල
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.langBtn, currentLang === 'ta' && styles.activeLangBtn]}
            onPress={() => changeLanguage('ta')}
            activeOpacity={0.8}
          >
            <Text style={[styles.langBtnText, currentLang === 'ta' && styles.activeLangBtnText]}>
              தமிழ்
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Action Button */}
      <TouchableOpacity
        style={styles.primaryBtn}
        onPress={() => router.replace('/MainOnBoarding')}
        activeOpacity={0.85}
      >
        <Text style={styles.primaryBtnText}>{t('go_to_home')}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  image: {
    width: 400,
    height: 400,
    borderRadius: 10,
    alignSelf: 'center',
    marginTop: 10,
  },
  textContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  appName: {
    fontSize: 42,
    color: '#0F172A',
    fontFamily: 'DMSerifDisplay_400Regular_Italic',
  },
  tagline: {
    fontSize: 18,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    fontFamily: 'DMSerifDisplay_400Regular',
  },
  langSection: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 15,
    marginTop: -20,
  },
  langLabel: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 10,
    fontWeight: '500',
  },
  langRow: {
    flexDirection: 'row',
    gap: 10,
  },
  langBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  activeLangBtn: {
    backgroundColor: '#0D9488',
    borderColor: '#0D9488',
  },
  langBtnText: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '600',
  },
  activeLangBtnText: {
    color: '#FFFFFF',
  },
  primaryBtn: {
    backgroundColor: '#0D9488',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});