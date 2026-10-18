import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ErrorBanner from '../components/ErrorBanner';
import SuccessBanner from '../components/SuccessBanner';
import { registerUser } from '../services/authService';

export default function RegisterScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [nicNumber, setNicNumber] = useState('');
  const [isAgreed, setIsAgreed] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const triggerError = (msg) => {
    setErrorMessage(msg);
    setShowError(true);
  };

  const triggerSuccess = (msg) => {
    setSuccessMsg(msg);
    setShowSuccess(true);
  };

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/MainOnBoarding');
    }
  };

  const handleRegister = async () => {
    if (!fullName.trim() || !nicNumber.trim() || !mobileNumber.trim()) {
      triggerError('Please enter all details.');
      return;
    }

    if (!isAgreed) {
      triggerError('Please agree to the terms and conditions.');
      return;
    }

    setLoading(true);

    try {
      const result = await registerUser(
        fullName.trim(),
        nicNumber.trim(),
        mobileNumber.trim()
      );

      if (result.ok) {
        triggerSuccess(`Account created successfully!`);
        await AsyncStorage.setItem('userId', result.data?.userId);
        setTimeout(() => {
          router.replace('/opt');
        }, 1200);
      } else {
        triggerError(result.data?.message || 'Unable to create account.');
      }
    } catch (error) {
      triggerError('Unable to connect to the backend server. Check if the server is active.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ErrorBanner
        visible={showError}
        message={errorMessage}
        onHide={() => setShowError(false)}
      />
      <SuccessBanner
        visible={showSuccess}
        message={successMsg}
        onHide={() => setShowSuccess(false)}
      />

      {/* Top Header with Back Button */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleGoBack}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color="#0F3A5D" />
        </TouchableOpacity>
      </View>

      {/* Scrollable Form View */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Image
          source={require('../assets/images/mediqueue.png')}
          style={styles.image}
          resizeMode="contain"
        />

        <Text style={styles.title}>{t('rp1')}</Text>
        <Text style={styles.subtitle}>{t('rp2')}</Text>

        <View style={styles.accentDash} />

        <View style={styles.formContainer}>
          <Text style={styles.fieldLabel}>{t('rp3')}</Text>
          <TextInput
            style={styles.input}
            placeholder="As per your NIC"
            placeholderTextColor="#94A3B8"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
          />

          <Text style={styles.fieldLabel}>{t('rp4')}</Text>
          <View style={styles.phoneInputRow}>
            <View style={styles.countryCodeBox}>
              <Text style={styles.countryCodeText}>+94</Text>
            </View>
            <TextInput
              style={styles.phoneInput}
              placeholder="77 123 4567"
              placeholderTextColor="#94A3B8"
              value={mobileNumber}
              onChangeText={setMobileNumber}
              keyboardType="phone-pad"
            />
          </View>

          <Text style={styles.fieldLabel}>{t('rp5')}</Text>
          <TextInput
            style={styles.input}
            placeholder="200012345678V"
            placeholderTextColor="#94A3B8"
            value={nicNumber}
            onChangeText={setNicNumber}
            autoCapitalize="characters"
          />

          <View style={styles.checkboxRow}>
            <TouchableOpacity
              style={[styles.checkbox, isAgreed && styles.checkboxActive]}
              onPress={() => setIsAgreed(!isAgreed)}
              activeOpacity={0.8}
            >
              {isAgreed && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
            </TouchableOpacity>
            <Text style={styles.checkboxLabel}>{t('rp6')}</Text>
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, loading && { opacity: 0.7 }]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.submitBtnText}>{t('rp7')}</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>{t('rp8')}</Text>
          <TouchableOpacity onPress={() => router.replace('/LoginNIC')}>
            <Text style={styles.footerLink}>{t('rp9')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#EDF5FA',
  },
  topHeader: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
    alignItems: 'flex-start',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 40,
    alignItems: 'center',
  },
  image: {
    width: 120,
    height: 120,
    alignSelf: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontFamily: 'DMSerifDisplay_400Regular',
    color: '#0F3A5D',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: '#334155',
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 15,
  },
  accentDash: {
    width: 28,
    height: 4,
    backgroundColor: '#0E6649',
    borderRadius: 2,
    marginTop: 10,
    marginBottom: 20,
  },
  formContainer: {
    width: '100%',
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1E293B',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    height: 48,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#0F172A',
    marginBottom: 18,
    backgroundColor: '#FFFFFF',
  },
  phoneInputRow: {
    flexDirection: 'row',
    width: '100%',
    height: 48,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    marginBottom: 18,
    alignItems: 'center',
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
  },
  countryCodeBox: {
    marginRight: 12,
  },
  countryCodeText: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '500',
  },
  phoneInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    color: '#0F172A',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 24,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#0E6649',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    backgroundColor: '#FFFFFF',
  },
  checkboxActive: {
    backgroundColor: '#0E6649',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 11.5,
    color: '#334155',
    lineHeight: 16,
  },
  submitBtn: {
    backgroundColor: '#0E6649',
    width: '100%',
    paddingVertical: 15,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12.5,
    color: '#334155',
  },
  footerLink: {
    fontSize: 12.5,
    color: '#135E96',
    fontWeight: '600',
  },
});