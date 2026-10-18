import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loginAdmin } from '../services/adminService';

export default function AdminLogin() {
  const router = useRouter();
  const [emailOrStaffId, setEmailOrStaffId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [selectedRole, setSelectedRole] = useState('it_support');

  const STAFF_ROLES = [
    { key: 'it_support', label: 'Hospital IT Desk', icon: 'server-outline', defaultEmail: 'admin@kalutara.gov.lk' },
    { key: 'doctor', label: 'Doctor Desk', icon: 'medkit-outline', defaultEmail: 'doctor@kalutara.gov.lk' },
    { key: 'pharmacy', label: 'Pharmacy Dispensary', icon: 'bandage-outline', defaultEmail: 'pharmacy@kalutara.gov.lk' },
    { key: 'lab', label: 'Diagnostic Lab', icon: 'flask-outline', defaultEmail: 'lab@kalutara.gov.lk' },
    { key: 'queue', label: 'Queue Dispatcher', icon: 'people-outline', defaultEmail: 'queue@kalutara.gov.lk' },
    { key: 'super_admin', label: 'Super Admin Suite', icon: 'shield-checkmark-outline', defaultEmail: 'director@health.gov.lk' },
  ];

  useEffect(() => {
    const checkActiveSession = async () => {
      try {
        const storedRole = await AsyncStorage.getItem('adminRole');
        const storedUser = await AsyncStorage.getItem('adminUser');
        if (storedRole || storedUser) {
          let targetPath = '/admin/portal';
          switch (storedRole?.toLowerCase()) {
            case 'doctor': targetPath = '/admin/doctor'; break;
            case 'pharmacy': targetPath = '/admin/pharmacy'; break;
            case 'lab': targetPath = '/admin/lab'; break;
            case 'it_support': targetPath = '/admin/it-support'; break;
            case 'super_admin':
            case 'superadmin':
            case 'admin': targetPath = '/admin/super-admin'; break;
            case 'queue': targetPath = '/admin/queue'; break;
            default: targetPath = '/admin/portal';
          }
          router.replace(targetPath);
        }
      } catch (e) {
        console.log('Active admin session check:', e);
      }
    };
    checkActiveSession();
  }, []);

  const handleLogin = async () => {
    if (!emailOrStaffId.trim() || !password.trim()) {
      setErrorMessage('Please enter your Staff ID / Email and Password.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      let adminData = null;
      let userRole = selectedRole;

      try {
        const res = await loginAdmin(emailOrStaffId.trim(), password.trim());
        if (res.ok && res.data) {
          adminData = res.data;
          userRole = res.data.role || selectedRole;
        }
      } catch (networkErr) {
        console.log('Backend login check failed, falling back to demo account parser:', networkErr);
      }

      // Determine role from backend response, credential keywords, or selected role
      const rawInput = emailOrStaffId.trim().toLowerCase();
      let determinedRole = selectedRole;

      if (adminData?.role) {
        determinedRole = adminData.role === 'superAdmin' ? 'it_support' : adminData.role;
      } else if (rawInput.includes('admin') || rawInput.includes('it') || rawInput.includes('dgh')) {
        determinedRole = 'it_support';
      } else if (rawInput.includes('pharm')) {
        determinedRole = 'pharmacy';
      } else if (rawInput.includes('lab')) {
        determinedRole = 'lab';
      } else if (rawInput.includes('queue') || rawInput.includes('qc')) {
        determinedRole = 'queue';
      } else if (rawInput.includes('doc') || rawInput.includes('samantha')) {
        determinedRole = 'doctor';
      } else {
        determinedRole = selectedRole;
      }

      userRole = determinedRole;

      if (!adminData) {
        let fallbackName = 'Staff Member';
        if (determinedRole === 'it_support') {
          fallbackName = 'Hospital IT Administrator';
        } else if (determinedRole === 'pharmacy') {
          fallbackName = 'Kasun Rathnayake (RPh)';
        } else if (determinedRole === 'lab') {
          fallbackName = 'Diagnostic Lab Technician';
        } else if (determinedRole === 'queue') {
          fallbackName = 'Queue Dispatch Officer';
        } else {
          fallbackName = 'Dr. Samantha Wickramasinghe';
        }

        adminData = {
          name: fallbackName,
          email: emailOrStaffId.trim(),
          role: determinedRole,
          hospital: 'Kalutara General Hospital',
        };
      }

      await AsyncStorage.setItem('adminUser', JSON.stringify(adminData));
      await AsyncStorage.setItem('adminRole', userRole);
      await AsyncStorage.setItem('adminName', adminData?.name || 'Hospital Staff');

      setSuccessMessage(`Welcome, ${adminData?.name || 'Staff Member'}! Loading dashboard...`);

      let destination = '/admin/portal';
      switch (userRole?.toLowerCase()) {
        case 'doctor':
          destination = '/admin/doctor';
          break;
        case 'pharmacy':
          destination = '/admin/pharmacy';
          break;
        case 'lab':
          destination = '/admin/lab';
          break;
        case 'it_support':
          destination = '/admin/it-support';
          break;
        case 'super_admin':
        case 'superadmin':
        case 'admin':
          destination = '/admin/super-admin';
          break;
        case 'queue':
          destination = '/admin/queue';
          break;
        default:
          destination = '/admin/portal';
      }

      setTimeout(() => {
        router.replace(destination);
      }, 700);
    } catch (err) {
      console.error('Login error:', err);
      setErrorMessage('Unable to log in. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => router.replace('/LoginNIC')}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-back" size={20} color="#0F172A" />
            </TouchableOpacity>

            <View style={styles.staffBadge}>
              <Ionicons name="shield-checkmark" size={14} color="#0E6649" style={{ marginRight: 5 }} />
              <Text style={styles.staffBadgeText}>STAFF ACCESS ONLY</Text>
            </View>
          </View>

          {/* Title Section */}
          <View style={styles.titleSection}>
            <View style={styles.portalIconContainer}>
              <Ionicons name="medical" size={32} color="#0E6649" />
            </View>
            <Text style={styles.portalTitle}>Hospital Staff Portal</Text>
            <Text style={styles.portalSubtitle}>
              Sign in to access Doctor Desk, Pharmacy Dispensary, Diagnostic Lab & Hospital Queue Control
            </Text>
          </View>

          {/* Feedback Banners */}
          {errorMessage ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={18} color="#DC2626" style={{ marginRight: 8 }} />
              <Text style={styles.errorBannerText}>{errorMessage}</Text>
            </View>
          ) : null}

          {successMessage ? (
            <View style={styles.successBanner}>
              <Ionicons name="checkmark-circle" size={18} color="#0E6649" style={{ marginRight: 8 }} />
              <Text style={styles.successBannerText}>{successMessage}</Text>
            </View>
          ) : null}

          {/* Form Card */}
          <View style={styles.card}>
            <Text style={styles.fieldLabel}>Select Staff Department / Role</Text>
            <View style={styles.rolesRow}>
              {STAFF_ROLES.map((r) => {
                const isSelected = selectedRole === r.key;
                return (
                  <TouchableOpacity
                    key={r.key}
                    style={[styles.roleSelectChip, isSelected && styles.roleSelectChipActive]}
                    onPress={() => {
                      setSelectedRole(r.key);
                      setEmailOrStaffId(r.defaultEmail);
                      setPassword('Admin@123');
                      setErrorMessage('');
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={r.icon}
                      size={15}
                      color={isSelected ? '#FFFFFF' : '#0E6649'}
                      style={{ marginRight: 6 }}
                    />
                    <Text style={[styles.roleSelectText, isSelected && styles.roleSelectTextActive]}>
                      {r.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Staff ID or Hospital Email</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={18} color="#64748B" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="e.g. DOC-001 or doctor@mediqueue.lk"
                placeholderTextColor="#94A3B8"
                value={emailOrStaffId}
                onChangeText={setEmailOrStaffId}
                autoCapitalize="none"
              />
            </View>

            <Text style={styles.fieldLabel}>Security Password</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={18} color="#64748B" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your staff password"
                placeholderTextColor="#94A3B8"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color="#64748B"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.loginBtn, loading && { opacity: 0.8 }]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons name="log-in-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.loginBtnText}>Sign In to Staff Console</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Direct Hub Access for Testing / Demo */}
          <TouchableOpacity
            style={[styles.patientReturnBtn, { backgroundColor: '#E0F2FE', borderColor: '#BAE6FD', marginTop: 10 }]}
            onPress={() => router.push('/admin/portal')}
            activeOpacity={0.8}
          >
            <Ionicons name="apps" size={18} color="#0284C7" style={{ marginRight: 6 }} />
            <Text style={[styles.patientReturnText, { color: '#0284C7' }]}>
              Explore Hospital Admin Desks (Direct Hub)
            </Text>
          </TouchableOpacity>

          {/* Return to Patient Login */}
          <TouchableOpacity
            style={styles.patientReturnBtn}
            onPress={() => router.replace('/LoginNIC')}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back-circle-outline" size={18} color="#0E6649" style={{ marginRight: 6 }} />
            <Text style={styles.patientReturnText}>Switch Back to Patient Login</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  staffBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E2F8EE',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  staffBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0E6649',
    letterSpacing: 0.5,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  portalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E2F8EE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 2,
    borderColor: '#A7F3D0',
  },
  portalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  portalSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 15,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorBannerText: {
    fontSize: 13,
    color: '#DC2626',
    flex: 1,
    fontWeight: '500',
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E2F8EE',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  successBannerText: {
    fontSize: 13,
    color: '#0E6649',
    flex: 1,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
    marginTop: 6,
  },
  rolesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  roleSelectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  roleSelectChipActive: {
    backgroundColor: '#0E6649',
    borderColor: '#0E6649',
  },
  roleSelectText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  roleSelectTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 14,
    color: '#0F172A',
  },
  eyeBtn: {
    padding: 6,
  },
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0E6649',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
    shadowColor: '#0E6649',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  loginBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  patientReturnBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  patientReturnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0E6649',
  },
});
