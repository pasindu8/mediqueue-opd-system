import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker'; // DatePicker import
import { addPatientDetails } from '../../services/profileService';
import ErrorBanner from '../../components/ErrorBanner';
import SuccessBanner from '../../components/SuccessBanner';

export default function AddPatientDetailsScreen() {
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState('');
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // 1. Auto-generated Patient ID (e.g. MQ-84920)
  const [patientId, setPatientId] = useState('');

  // Form States
  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date(2000, 0, 1));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [gender, setGender] = useState('Male');
  const [age, setAge] = useState('');
  const [address, setAddress] = useState('');

  // Emergency Contact
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyRelation, setEmergencyRelation] = useState('Parent');
  const [emergencyPhone, setEmergencyPhone] = useState('');

  // Medical Information
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [allergies, setAllergies] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('');

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const genderOptions = ['Male', 'Female', 'Other'];

  const triggerError = (msg) => {
    setErrorMessage(msg);
    setShowError(true);
  };

  const triggerSuccess = (msg) => {
    setSuccessMsg(msg);
    setShowSuccess(true);
  };

  useEffect(() => {
    // Auto-generate Patient ID (MQ-XXXXX)
    const generatedId = `MQ-${Math.floor(10000 + Math.random() * 90000)}`;
    setPatientId(generatedId);

    // Retrieve existing userId and user info from AsyncStorage
    const fetchUserData = async () => {
      const storedUserId = await AsyncStorage.getItem('userId');
      const storedName = await AsyncStorage.getItem('fullName');
      if (storedUserId) setUserId(storedUserId);
      if (storedName) setFullName(storedName);
    };

    fetchUserData();
  }, []);

  // Triggered when a date is selected from calendar
  const onDateChange = (event, date) => {
    setShowDatePicker(false);

    if (event.type === 'set' && date) {
      setSelectedDate(date);

      // Format date to YYYY-MM-DD
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      setDateOfBirth(formattedDate);

      // Calculate age automatically
      const today = new Date();
      let calculatedAge = today.getFullYear() - year;
      const monthDiff = today.getMonth() - date.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
        calculatedAge--;
      }

      setAge(calculatedAge >= 0 ? String(calculatedAge) : '0');
    }
  };

  const handleCreateProfile = async () => {
    if (
      !fullName.trim() ||
      !dateOfBirth.trim() ||
      !age.trim() ||
      !address.trim() ||
      !emergencyPhone.trim()
    ) {
      triggerError('Please fill in all the required details.');
      return;
    }

    if (emergencyPhone.trim().replace(/[^0-9]/g, '').length < 9) {
      triggerError('Please enter a valid emergency phone number (at least 9 digits).');
      return;
    }

    try {
      setLoading(true);

      const emergencyContactObj = {
        name: emergencyName.trim() || 'Guardian',
        relationship: emergencyRelation,
        phoneNumber: emergencyPhone.trim(),
      };

      const allergiesArray = allergies
        ? allergies
            .split(',')
            .map((item) => item.trim())
            .filter((item) => item.length > 0)
        : [];

      const medicalHistoryArray = medicalHistory
        ? medicalHistory
            .split(',')
            .map((item) => item.trim())
            .filter((item) => item.length > 0)
        : [];

      const result = await addPatientDetails(
        userId,
        fullName.trim(),
        dateOfBirth.trim(),
        gender,
        Number(age),
        address.trim(),
        emergencyContactObj,
        bloodGroup,
        allergiesArray,
        medicalHistoryArray
      );

      if (result.ok) {
        await AsyncStorage.setItem('patientId', patientId);
        await AsyncStorage.setItem('fullName', fullName.trim());
        await AsyncStorage.setItem('dateOfBirth', dateOfBirth.trim());
        await AsyncStorage.setItem('gender', gender);
        await AsyncStorage.setItem('age', String(age));
        await AsyncStorage.setItem('address', address.trim());
        await AsyncStorage.setItem('bloodGroup', bloodGroup);
        await AsyncStorage.setItem('emergencyContact', JSON.stringify(emergencyContactObj));
        await AsyncStorage.setItem('knownAllergies', JSON.stringify(allergiesArray));
        await AsyncStorage.setItem('medicalHistory', JSON.stringify(medicalHistoryArray));

        triggerSuccess('Patient profile created successfully!');
        setTimeout(() => {
          router.replace('/(tabs)/dashboard');
        }, 1500);
      } else {
        triggerError(result.data?.message || 'Unable to register patient profile.');
      }
    } catch (error) {
      console.error('Error creating patient profile:', error);
      triggerError('Check backend server connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
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

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Complete Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Auto-Generated Patient ID Card */}
          <View style={styles.idCard}>
            <View style={styles.idIconCircle}>
              <Ionicons name="finger-print-outline" size={24} color="#0D9488" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.idCardLabel}>Assigned Patient ID</Text>
              <Text style={styles.idCardValue}>#{patientId}</Text>
            </View>
            <View style={styles.autoBadge}>
              <Text style={styles.autoBadgeText}>Auto-Generated</Text>
            </View>
          </View>

          {/* 1. Basic Information */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="person-outline" size={18} color="#0D9488" />
              <Text style={styles.cardTitle}>Basic Information</Text>
            </View>

            <Text style={styles.inputLabel}>Full Name *</Text>
            <TextInput
              style={styles.textInput}
              value={fullName}
              onChangeText={setFullName}
              placeholder="e.g. Namal Gunawardena"
              placeholderTextColor="#94A3B8"
            />

            <View style={styles.rowInputs}>
              {/* Date of Birth Picker Button */}
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.inputLabel}>Date of Birth *</Text>
                <TouchableOpacity
                  style={[styles.textInput, styles.datePickerBtn]}
                  onPress={() => setShowDatePicker(true)}
                  activeOpacity={0.7}
                >
                  <Text style={dateOfBirth ? styles.dateText : styles.placeholderText}>
                    {dateOfBirth || 'YYYY-MM-DD'}
                  </Text>
                  <Ionicons name="calendar-outline" size={18} color="#0D9488" />
                </TouchableOpacity>
              </View>

              {/* Editable Age Input */}
              <View style={{ width: 90 }}>
                <Text style={styles.inputLabel}>Age *</Text>
                <TextInput
                  style={styles.textInput}
                  value={age}
                  onChangeText={setAge}
                  keyboardType="numeric"
                  placeholder="Age"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            {/* DatePicker Modal/Dialog */}
            {showDatePicker && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                maximumDate={new Date()}
                onChange={onDateChange}
              />
            )}

            <Text style={styles.inputLabel}>Gender *</Text>
            <View style={styles.chipRow}>
              {genderOptions.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[styles.genderChip, gender === item && styles.genderChipSelected]}
                  onPress={() => setGender(item)}
                >
                  <Text
                    style={[
                      styles.genderChipText,
                      gender === item && styles.genderChipTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Address *</Text>
            <TextInput
              style={[styles.textInput, styles.multilineInput]}
              value={address}
              onChangeText={setAddress}
              placeholder="Full home address"
              placeholderTextColor="#94A3B8"
              multiline
            />
          </View>

          {/* 2. Emergency Contact */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="alert-circle-outline" size={18} color="#DC2626" />
              <Text style={[styles.cardTitle, { color: '#DC2626' }]}>Emergency Contact</Text>
            </View>

            <Text style={styles.inputLabel}>Contact Person Name *</Text>
            <TextInput
              style={styles.textInput}
              value={emergencyName}
              onChangeText={setEmergencyName}
              placeholder="Guardian / Spouse Name"
              placeholderTextColor="#94A3B8"
            />

            <View style={styles.rowInputs}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.inputLabel}>Relationship</Text>
                <TextInput
                  style={styles.textInput}
                  value={emergencyRelation}
                  onChangeText={setEmergencyRelation}
                  placeholder="e.g. Father, Spouse"
                  placeholderTextColor="#94A3B8"
                />
              </View>
              <View style={{ flex: 1.2 }}>
                <Text style={styles.inputLabel}>Contact Phone *</Text>
                <TextInput
                  style={styles.textInput}
                  value={emergencyPhone}
                  onChangeText={setEmergencyPhone}
                  keyboardType="phone-pad"
                  placeholder="+94 7X XXX XXXX"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>
          </View>

          {/* 3. Medical Profile */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="fitness-outline" size={18} color="#0D9488" />
              <Text style={styles.cardTitle}>Medical Profile</Text>
            </View>

            <Text style={styles.inputLabel}>Blood Group *</Text>
            <View style={styles.chipRow}>
              {bloodGroups.map((group) => (
                <TouchableOpacity
                  key={group}
                  style={[styles.bloodBadge, bloodGroup === group && styles.bloodBadgeSelected]}
                  onPress={() => setBloodGroup(group)}
                >
                  <Text
                    style={[
                      styles.bloodBadgeText,
                      bloodGroup === group && styles.bloodBadgeTextSelected,
                    ]}
                  >
                    {group}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Known Allergies</Text>
            <TextInput
              style={styles.textInput}
              value={allergies}
              onChangeText={setAllergies}
              placeholder="e.g. Penicillin, Peanuts (Comma separated)"
              placeholderTextColor="#94A3B8"
            />

            <Text style={styles.inputLabel}>Past Medical History</Text>
            <TextInput
              style={styles.textInput}
              value={medicalHistory}
              onChangeText={setMedicalHistory}
              placeholder="e.g. Asthma, High Blood Pressure"
              placeholderTextColor="#94A3B8"
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, loading && { opacity: 0.7 }]}
            onPress={handleCreateProfile}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={20}
                  color="#FFFFFF"
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.submitButtonText}>Register Profile</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EDF5FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 40,
  },
  idCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#CCFBF1',
    elevation: 2,
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  idIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0FDFA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  idCardLabel: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '600',
  },
  idCardValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0D9488',
  },
  autoBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  autoBadgeText: {
    color: '#0369A1',
    fontSize: 11,
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0D9488',
  },
  inputLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
    marginTop: 8,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1E293B',
  },
  datePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateText: {
    fontSize: 14,
    color: '#1E293B',
  },
  placeholderText: {
    fontSize: 14,
    color: '#94A3B8',
  },
  multilineInput: {
    height: 60,
    textAlignVertical: 'top',
  },
  rowInputs: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 4,
  },
  genderChip: {
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  genderChipSelected: {
    backgroundColor: '#0D9488',
    borderColor: '#0D9488',
  },
  genderChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  genderChipTextSelected: {
    color: '#FFFFFF',
  },
  bloodBadge: {
    paddingVertical: 6,
    paddingHorizontal: 13,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  bloodBadgeSelected: {
    backgroundColor: '#0D9488',
    borderColor: '#0D9488',
  },
  bloodBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  bloodBadgeTextSelected: {
    color: '#FFFFFF',
  },
  submitButton: {
    backgroundColor: '#0D9488',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 4,
    elevation: 3,
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});