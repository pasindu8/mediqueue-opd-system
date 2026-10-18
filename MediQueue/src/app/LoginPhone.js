import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
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
import ErrorBanner from '../components/ErrorBanner';
import SuccessBanner from '../components/SuccessBanner';
import { loginPhone, optcodegeni } from '../services/authService';

export default function LoginPhone() {
  const router = useRouter();
  const { t } = useTranslation();

  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']); 
  const [errorMessage, setErrorMessage] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showError, setShowError] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loading2, setLoading2] = useState(false);
  const [isPhoneLocked, setIsPhoneLocked] = useState(false);

  
  const inputRefs = useRef([]);

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

  
  const handleOtpChange = (text, index) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    
    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  
  const handleOtpKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  
  const sendOtp = async () => {
    if (!phone.trim()) {
      triggerError('Please enter your phone number.');
      return;
    }

    setLoading(true);

    try {
      const result = await optcodegeni(phone.trim());

      if (result.ok) {
        triggerSuccess(result.data?.message);
        setIsPhoneLocked(true); 
        setTimeout(() => inputRefs.current[0]?.focus(), 300); 
      } else {
        triggerError(result.data?.message);
      }
    } catch (error) {
      triggerError('Unable to connect to the backend server. Check if the server is active.');
    } finally {
      setLoading(false);
    }
  };

 
  const handleLoginPhone = async () => {
    if (!phone.trim()) {
      triggerError('Please enter your phone number.');
      return;
    }

    const fullOtp = otp.join('');
    if (fullOtp.length !== 6) {
      triggerError('Please enter the complete 6-digit verification code.');
      return;
    }

    setLoading2(true);

    try {
      const result = await loginPhone(phone.trim(), fullOtp);

      if (result.ok) {
        if (result.data?.token) await AsyncStorage.setItem('token', String(result.data.token));
        if (result.data?.userId) await AsyncStorage.setItem('userId', String(result.data.userId));
        if (result.data?.name) await AsyncStorage.setItem('name', String(result.data.name));
        if (result.data?.NIC) await AsyncStorage.setItem('NIC', String(result.data.NIC));
        if (result.data?.phoneNumber) await AsyncStorage.setItem('phoneNumber', String(result.data.phoneNumber));
        if (result.data?.type) await AsyncStorage.setItem('type', String(result.data.type));

        triggerSuccess(result.data?.message || 'Login successful!');
        setTimeout(() => {
          router.replace('/(tabs)/dashboard');
        }, 1200);
      } else {
        triggerError(result.data?.message || 'Invalid verification code.');
      }
    } catch (error) {
      triggerError('Unable to connect to the backend server. Check if the server is active.');
    } finally {
      setLoading2(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
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

      {/* Header with Back Button */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleGoBack}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color="#0F3A5D" />
        </TouchableOpacity>
      </View>

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

        <Text style={styles.lPb1s}>{t('lpb1')}</Text>
        <Text style={styles.lPb2s}>{t('lpb2')}</Text>

        <View style={styles.phoneLabelRow}>
          <Text style={styles.lPb3s}>{t('lpb3')}</Text>
          {isPhoneLocked && (
            <TouchableOpacity onPress={() => setIsPhoneLocked(false)}>
              <Text style={styles.changePhoneText}>Edit Number</Text>
            </TouchableOpacity>
          )}
        </View>

        <TextInput
          style={[styles.input, isPhoneLocked && styles.readOnlyInput]}
          placeholder="77 123 4567"
          placeholderTextColor="#94A3B8"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          editable={!isPhoneLocked}
          autoCorrect={false}
        />

        <TouchableOpacity
          style={[styles.lnbB1s, isPhoneLocked && { opacity: 0.6 }]}
          onPress={sendOtp}
          disabled={loading || isPhoneLocked}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.lnbBT1s}>{isPhoneLocked ? 'Code Sent' : t('lpb4')}</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.lPb3s}>{t('lpb5')}</Text>

        {/* 6 Digit OTP Inputs */}
        <View style={styles.rowContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputRefs.current[index] = ref)}
              style={[
                styles.input2,
                digit ? styles.input2Active : null
              ]}
              placeholder="-"
              placeholderTextColor="#94A3B8"
              value={digit}
              onChangeText={(text) => handleOtpChange(text, index)}
              onKeyPress={(e) => handleOtpKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
        </View>

        <TouchableOpacity
          style={styles.lnbB2s}
          onPress={handleLoginPhone}
          disabled={loading2}
          activeOpacity={0.85}
        >
          {loading2 ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.lnbBT2s}>{t('lpb7')}</Text>
          )}
        </TouchableOpacity>

        <View style={styles.footerRow}>
          <Text style={styles.lnb6s}>{t('lpb8')}</Text>
          <TouchableOpacity
            style={styles.primaryBtn2}
            onPress={() => router.replace('/LoginNIC')}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText2}>{t('lpb9')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
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
    paddingBottom: 30,
    alignItems: 'center',
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 20,
    marginBottom: 16,
    alignSelf: 'center',
  },
  lPb1s: {
    fontSize: 24,
    color: '#0F3A5D',
    textAlign: 'center',
    fontFamily: 'DMSerifDisplay_400Regular',
    marginBottom: 6,
  },
  lPb2s: {
    fontSize: 13,
    color: '#334155',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  phoneLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    alignItems: 'center',
    marginBottom: 8,
  },
  lPb3s: {
    fontSize: 13,
    color: '#1E293B',
    fontWeight: '500',
  },
  changePhoneText: {
    fontSize: 12,
    color: '#135E96',
    fontWeight: '600',
  },
  input: {
    width: '100%',
    height: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#0F172A',
    marginBottom: 16,
  },
  readOnlyInput: {
    backgroundColor: '#E2E8F0',
    color: '#64748B',
    borderColor: '#CBD5E1',
  },
  lnbB1s: {
    backgroundColor: '#0E6649',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  lnbBT1s: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginVertical: 12,
  },
  input2: {
    width: 46,
    height: 52,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  input2Active: {
    borderColor: '#0E6649',
    backgroundColor: '#F0FDF4',
  },
  lnbB2s: {
    backgroundColor: '#135E96',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  lnbBT2s: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  lnb6s: {
    fontSize: 12.5,
    color: '#334155',
  },
  primaryBtn2: {
    marginLeft: 5,
  },
  primaryBtnText2: {
    fontSize: 12.5,
    color: '#0D9488',
    fontWeight: '600',
  },
});