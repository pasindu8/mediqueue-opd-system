import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Image,
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
import { loginNIC } from '../services/authService';

export default function LoginNIC() {
  const router = useRouter();
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [nic, setNic] = useState('');
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

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

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/MainOnBoarding');
    }
  };

  const triggerError = (msg) => {
    setErrorMessage(msg);
    setShowError(true);
  };

  const triggerSuccess = (msg) => {
    setSuccessMsg(msg);
    setShowSuccess(true);
  };

  const handlelogin = async () => {
    const cleanNic = nic.trim();
    if (!cleanNic || !password.trim()) {
      triggerError('Please enter both NIC and Password.');
      return;
    }

    const nicRegex = /^([0-9]{9}[vVxX]|[0-9]{12})$/;
    if (!nicRegex.test(cleanNic)) {
      triggerError('Please enter a valid Sri Lankan NIC number (e.g. 9 digits with V/X, or 12 digits).');
      return;
    }

    setLoading(true);

    try {
      const result = await loginNIC(cleanNic, password.trim());

      if (result.ok) {
        if (result.data?.userId) await AsyncStorage.setItem('userId', String(result.data.userId));
        if (result.data?.name) await AsyncStorage.setItem('name', String(result.data.name));
        if (result.data?.NIC) await AsyncStorage.setItem('NIC', String(result.data.NIC));
        if (result.data?.phoneNumber) await AsyncStorage.setItem('phoneNumber', String(result.data.phoneNumber));
        if (result.data?.type) await AsyncStorage.setItem('type', String(result.data.type));

        triggerSuccess(result.data?.message || 'Login successful!');
        setTimeout(() => {
          router.replace('/(tabs)/dashboard');
        }, 1500);
      } else {
        triggerError(result.data?.message || 'Invalid NIC or password.');
      }
    } catch (error) {
      triggerError('Unable to connect to the backend server. Check if the server is active.');
    } finally {
      setLoading(false);
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

      {/* Main Content Area */}
      <View style={styles.content}>
        <Image
          source={require('../assets/images/mediqueue.png')}
          style={styles.image}
          resizeMode="contain"
        />

        <Text style={styles.lnb1s}>{t('lnb1')}</Text>
        <Text style={styles.lnb2s}>{t('lnb2')}</Text>

        <Text style={styles.lnb3s}>{t('lnb3')}</Text>
        <TextInput
          style={styles.input}
          placeholder="200012345678 / 851234567V"
          placeholderTextColor="#94A3B8"
          value={nic}
          onChangeText={setNic}
          autoCapitalize="characters"
          autoCorrect={false}
        />

        <Text style={styles.lnb3s}>{t('lnb4')}</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your password"
          placeholderTextColor="#94A3B8"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={true}
          autoCapitalize="none"
          maxLength={20}
          autoCorrect={false}
        />

        <Text style={styles.lnb4s}>{t('lnb5')}</Text>

        <TouchableOpacity
          style={styles.lnbB1s}
          onPress={handlelogin}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.lnbBT1s}>{t('lnb6')}</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.lnb5s}>{t('lnb7')}</Text>

        <TouchableOpacity
          style={styles.lnbB2s}
          onPress={() => router.replace('/LoginPhone')}
          activeOpacity={0.85}
        >
          <Text style={styles.lnbBT2s}>{t('lnb8')}</Text>
        </TouchableOpacity>

        <View style={styles.rowContainer}>
          <Text style={styles.lnb6s}>{t('lnb9')}</Text>
          <TouchableOpacity
            style={styles.primaryBtn2}
            onPress={() => router.replace('/Register')}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText2}>{t('lnb10')}</Text>
          </TouchableOpacity>
        </View>

        {/* Hospital Staff / Admin Portal Link */}
        <TouchableOpacity
          style={styles.adminSmallLink}
          onPress={() => router.push('/AdminLogin')}
          activeOpacity={0.7}
        >
          <Text style={styles.adminSmallLinkText}>Hospital Staff / Admin Portal</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    paddingBottom: 24,
  },
  topHeader: {
    paddingTop: 8,
    paddingBottom: 4,
    alignItems: 'flex-start',
    width: '100%',
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  image: {
    width: 100,
    height: 100,
    alignSelf: 'center',
    marginBottom: 20,
    marginTop: -40,
  },
  lnb1s: {
    fontSize: 30,
    fontWeight: '900',
    textAlign: 'center',
    color: '#0F172A',
    lineHeight: 38,
    marginBottom: 10,
  },
  lnb2s: {
    fontSize: 17,
    fontWeight: '300',
    textAlign: 'center',
    color: '#3b3b3b',
    lineHeight: 28,
    marginBottom: 20,
  },
  lnb3s: {
    fontSize: 17,
    fontWeight: '300',
    alignSelf: 'flex-start',
    color: '#000000',
    lineHeight: 28,
    marginBottom: 5,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  lnb4s: {
    fontSize: 15,
    fontWeight: '300',
    alignSelf: 'flex-start',
    color: '#000000',
    lineHeight: 28,
    marginBottom: 5,
    marginTop: -10,
  },
  lnbB1s: {
    backgroundColor: '#0066ff',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 50,
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 20,
  },
  lnbBT1s: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  lnbB2s: {
    backgroundColor: '#008000',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 50,
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 20,
  },
  lnbBT2s: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  primaryBtnText2: {
    color: '#0044ff',
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  adminSmallLink: {
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 8,
    width: '100%',
  },
  adminSmallLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
    textDecorationLine: 'underline',
  },
});