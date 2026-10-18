import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ErrorBanner from '../components/ErrorBanner';
import SuccessBanner from '../components/SuccessBanner';
import { verifyUser } from '../services/authService';

export default function VerifyOtpScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  const [otp1, setOtp1] = useState('');
  const [otp2, setOtp2] = useState('');
  const [otp3, setOtp3] = useState('');
  const [otp4, setOtp4] = useState('');
  const [otp5, setOtp5] = useState('');
  const [otp6, setOtp6] = useState('');

  const input1Ref = useRef(null);
  const input2Ref = useRef(null);
  const input3Ref = useRef(null);
  const input4Ref = useRef(null);
  const input5Ref = useRef(null);
  const input6Ref = useRef(null);

  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const triggerError = (msg) => {
    setErrorMessage(msg);
    setShowError(true);
  };

  const triggerSuccess = (msg) => {
    setSuccessMsg(msg);
    setShowSuccess(true);
  };

  useEffect(() => {
    const checkUserAuth = async () => {
      try {
        const savedId = await AsyncStorage.getItem('userId');

        if (!savedId) {
          router.replace('/LoginNIC');
        }
      } catch (error) {
        triggerError('Error fetching userId');
        router.replace('/LoginNIC');
      }
    };
    checkUserAuth();
  }, []);

  const handleVerify = async () => {
    const fullOtp = `${otp1}${otp2}${otp3}${otp4}${otp5}${otp6}`;

    if (fullOtp.length < 6) {
      triggerError('Please enter all 6 digits of the OTP code.');
      return;
    }

    setLoading(true);

    try {
      const savedUserId = await AsyncStorage.getItem('userId');
      const result = await verifyUser(fullOtp, savedUserId);

      if (result.ok) {
        triggerSuccess(result.data?.message || 'Verification successful!');
        setTimeout(() => {
          router.replace('/LoginNIC');
        }, 1500);
      } else {
        triggerError(result.data?.message || 'Invalid verification code');
      }
    } catch (error) {
      triggerError('Unable to connect to the backend server. Check if the server is active.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
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

        <View style={styles.topBadge} />

        <Text style={styles.title}>{t('otp1')}</Text>

        <Text style={styles.subtitle}>{t('otp2')}</Text>
        <Text style={styles.phoneNumber}>+94 77 123 4567</Text>

        <View style={styles.otpRow}>
          <TextInput
            ref={input1Ref}
            style={[styles.input2, otp1 ? styles.inputActive : null]}
            placeholder="0"
            placeholderTextColor="#94A3B8"
            value={otp1}
            onChangeText={(text) => {
              setOtp1(text);
              if (text.length === 1) input2Ref.current?.focus();
            }}
            keyboardType="number-pad"
            maxLength={1}
            autoCorrect={false}
          />

          <TextInput
            ref={input2Ref}
            style={[styles.input2, otp2 ? styles.inputActive : null]}
            placeholder="0"
            placeholderTextColor="#94A3B8"
            value={otp2}
            onChangeText={(text) => {
              setOtp2(text);
              if (text.length === 1) input3Ref.current?.focus();
            }}
            onKeyPress={({ nativeEvent }) => {
              if (nativeEvent.key === 'Backspace' && !otp2) input1Ref.current?.focus();
            }}
            keyboardType="number-pad"
            maxLength={1}
            autoCorrect={false}
          />

          <TextInput
            ref={input3Ref}
            style={[styles.input2, otp3 ? styles.inputActive : null]}
            placeholder="0"
            placeholderTextColor="#94A3B8"
            value={otp3}
            onChangeText={(text) => {
              setOtp3(text);
              if (text.length === 1) input4Ref.current?.focus();
            }}
            onKeyPress={({ nativeEvent }) => {
              if (nativeEvent.key === 'Backspace' && !otp3) input2Ref.current?.focus();
            }}
            keyboardType="number-pad"
            maxLength={1}
            autoCorrect={false}
          />

          <TextInput
            ref={input4Ref}
            style={[styles.input2, otp4 ? styles.inputActive : null]}
            placeholder="0"
            placeholderTextColor="#94A3B8"
            value={otp4}
            onChangeText={(text) => {
              setOtp4(text);
              if (text.length === 1) input5Ref.current?.focus();
            }}
            onKeyPress={({ nativeEvent }) => {
              if (nativeEvent.key === 'Backspace' && !otp4) input3Ref.current?.focus();
            }}
            keyboardType="number-pad"
            maxLength={1}
            autoCorrect={false}
          />

          <TextInput
            ref={input5Ref}
            style={[styles.input2, otp5 ? styles.inputActive : null]}
            placeholder="0"
            placeholderTextColor="#94A3B8"
            value={otp5}
            onChangeText={(text) => {
              setOtp5(text);
              if (text.length === 1) input6Ref.current?.focus();
            }}
            onKeyPress={({ nativeEvent }) => {
              if (nativeEvent.key === 'Backspace' && !otp5) input4Ref.current?.focus();
            }}
            keyboardType="number-pad"
            maxLength={1}
            autoCorrect={false}
          />

          <TextInput
            ref={input6Ref}
            style={[styles.input2, otp6 ? styles.inputActive : null]}
            placeholder="0"
            placeholderTextColor="#94A3B8"
            value={otp6}
            onChangeText={(text) => {
              setOtp6(text);
            }}
            onKeyPress={({ nativeEvent }) => {
              if (nativeEvent.key === 'Backspace' && !otp6) input5Ref.current?.focus();
            }}
            keyboardType="number-pad"
            maxLength={1}
            autoCorrect={false}
          />
        </View>

        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>
            {t('otp3')}{' '}
            <Text style={styles.resendLink}>{t('otp4')}</Text>
          </Text>
        </View>

        <TouchableOpacity
          style={styles.verifyBtn}
          onPress={handleVerify}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.verifyBtnText}>{t('otp5')}</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#EDF5FA',
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBadge: {
    width: 75,
    height: 75,
    borderRadius: 22,
    backgroundColor: '#D1F2E0',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F3A5D',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 13.5,
    color: '#334155',
    textAlign: 'center',
    lineHeight: 20,
  },
  phoneNumber: {
    fontSize: 13.5,
    color: '#1E293B',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 32,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  input2: {
    width: 46,
    height: 54,
    backgroundColor: '#EDF5FA',
    borderWidth: 1.2,
    borderColor: '#0E6649',
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
  },
  inputActive: {
    borderColor: '#135E96',
    backgroundColor: '#FFFFFF',
  },
  resendContainer: {
    marginBottom: 36,
  },
  resendText: {
    fontSize: 12.5,
    color: '#334155',
    textAlign: 'center',
  },
  resendLink: {
    color: '#135E96',
    fontWeight: '600',
  },
  verifyBtn: {
    backgroundColor: '#0E6649',
    width: '100%',
    paddingVertical: 15,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});