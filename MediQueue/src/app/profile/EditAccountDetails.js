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
import { EditPatientDetails } from '../../services/profileService';

export default function EditAccountDetailsScreen() {
  // Form Input States
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [allergies, setAllergies] = useState('');
  const [saving, setSaving] = useState(false);

  // Parameters required by backend (loaded from AsyncStorage)
  const [userId, setUserId] = useState('');
  const [nic, setNic] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [age, setAge] = useState('');
  const [emergencyRelation, setEmergencyRelation] = useState('Guardian');
  const [medicalHistory, setMedicalHistory] = useState([]);

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  // Load existing data from AsyncStorage into form
  useEffect(() => {
    const loadStoredData = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem('userId');
        const storedNic = await AsyncStorage.getItem('NIC');
        const storedName = await AsyncStorage.getItem('fullName');
        const storedPhone = await AsyncStorage.getItem('phoneNumber');
        const storedAddress = await AsyncStorage.getItem('address');
        const storedBlood = await AsyncStorage.getItem('bloodGroup');
        const storedDob = await AsyncStorage.getItem('dateOfBirth');
        const storedGender = await AsyncStorage.getItem('gender');
        const storedAge = await AsyncStorage.getItem('age');
        const storedEmergency = await AsyncStorage.getItem('emergencyContact');
        const storedAllergies = await AsyncStorage.getItem('knownAllergies');
        const storedMedHistory = await AsyncStorage.getItem('medicalHistory');

        if (storedUserId) setUserId(storedUserId);
        if (storedNic) setNic(storedNic);
        if (storedName) setFullName(storedName);
        if (storedPhone) setPhone(storedPhone);
        if (storedAddress) setAddress(storedAddress);
        if (storedBlood) setBloodGroup(storedBlood);
        if (storedDob) setDateOfBirth(storedDob);
        if (storedGender) setGender(storedGender);
        if (storedAge) setAge(storedAge);

        // Read emergency contact
        if (storedEmergency) {
          try {
            const parsedEmergency = JSON.parse(storedEmergency);
            setEmergencyName(parsedEmergency.name || '');
            setEmergencyPhone(parsedEmergency.phoneNumber || '');
            if (parsedEmergency.relationship) setEmergencyRelation(parsedEmergency.relationship);
          } catch (e) {
            // In case of plain string fallback
            setEmergencyName(storedEmergency);
          }
        }

        // Read allergies
        if (storedAllergies) {
          try {
            const parsedAllergies = JSON.parse(storedAllergies);
            setAllergies(Array.isArray(parsedAllergies) ? parsedAllergies.join(', ') : storedAllergies);
          } catch (e) {
            setAllergies(storedAllergies);
          }
        }

        // Medical History
        if (storedMedHistory) {
          try {
            setMedicalHistory(JSON.parse(storedMedHistory));
          } catch (e) {
            setMedicalHistory([]);
          }
        }
      } catch (error) {
        console.error('Error loading stored details:', error);
      }
    };

    loadStoredData();
  }, []);

  const handleSave = async () => {
    if (!fullName.trim() || !phone.trim() || !emergencyPhone.trim()) {
      Alert.alert('Incomplete Details', 'Please fill in all essential required fields.');
      return;
    }

    if (phone.trim().replace(/[^0-9]/g, '').length < 9) {
      Alert.alert('Invalid Phone', 'Please enter a valid phone number (at least 9 digits).');
      return;
    }

    if (emergencyPhone.trim().replace(/[^0-9]/g, '').length < 9) {
      Alert.alert('Invalid Phone', 'Please enter a valid emergency phone number (at least 9 digits).');
      return;
    }

    try {
      setSaving(true);

      // 1. Convert allergies to array
      const allergiesArray = allergies
        ? allergies.split(',').map((item) => item.trim()).filter((item) => item.length > 0)
        : [];

      // 2. Build emergency contact object
      const emergencyContactObj = {
        name: emergencyName.trim(),
        relationship: emergencyRelation,
        phoneNumber: emergencyPhone.trim(),
      };

      // 3. Send 10 arguments to EditPatientDetails service
      const result = await EditPatientDetails(
        userId,
        fullName.trim(),
        dateOfBirth,
        gender,
        age ? Number(age) : 0,
        address.trim(),
        emergencyContactObj,
        bloodGroup,
        allergiesArray,
        medicalHistory
      );

      if (result.ok) {
        // Update AsyncStorage on backend success
        await AsyncStorage.setItem('fullName', fullName.trim());
        await AsyncStorage.setItem('phoneNumber', phone.trim());
        await AsyncStorage.setItem('address', address.trim());
        await AsyncStorage.setItem('bloodGroup', bloodGroup);
        await AsyncStorage.setItem('emergencyContact', JSON.stringify(emergencyContactObj));
        await AsyncStorage.setItem('knownAllergies', JSON.stringify(allergiesArray));

        Alert.alert('Success', 'Profile details updated successfully!', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        Alert.alert('Error', result.data?.message || 'Failed to update details.');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Details</Text>
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
          {/* 1. Personal Information */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="person-outline" size={18} color="#0D9488" />
              <Text style={styles.cardTitle}>Personal Information</Text>
            </View>

            <Text style={styles.inputLabel}>Full Name *</Text>
            <TextInput
              style={styles.textInput}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Full Name"
              placeholderTextColor="#94A3B8"
            />

            {/* Read-only NIC / Locked */}
            <View style={styles.lockedRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>NIC / Identification (Locked)</Text>
                <TextInput
                  style={[styles.textInput, styles.disabledInput]}
                  value={nic || '199214502341'}
                  editable={false}
                />
              </View>
              <Ionicons name="lock-closed" size={18} color="#94A3B8" style={styles.lockIcon} />
            </View>
          </View>

          {/* 2. Contact Details */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="call-outline" size={18} color="#0D9488" />
              <Text style={styles.cardTitle}>Contact Information</Text>
            </View>

            <View style={styles.lockedRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Phone Number (Locked)</Text>
                <TextInput
                  style={[styles.textInput, styles.disabledInput]}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  placeholder="+94 XX XXX XXXX"
                  placeholderTextColor="#94A3B8"
                  editable={false}
                />
                </View>
              <Ionicons name="lock-closed" size={18} color="#94A3B8" style={styles.lockIcon} />
            </View>
            <Text style={styles.inputLabel}>Residential Address</Text>
            <TextInput
              style={[styles.textInput, styles.multilineInput]}
              value={address}
              onChangeText={setAddress}
              placeholder="Your home address"
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={2}
            />
          </View>

          {/* 3. Emergency Contact */}
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

            <Text style={styles.inputLabel}>Emergency Contact Number *</Text>
            <TextInput
              style={styles.textInput}
              value={emergencyPhone}
              onChangeText={setEmergencyPhone}
              keyboardType="phone-pad"
              placeholder="+94 XX XXX XXXX"
              placeholderTextColor="#94A3B8"
            />
          </View>

          {/* 4. Medical Profile */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="fitness-outline" size={18} color="#0D9488" />
              <Text style={styles.cardTitle}>Medical Details</Text>
            </View>

            <Text style={styles.inputLabel}>Blood Group</Text>
            <View style={styles.bloodGroupContainer}>
              {bloodGroups.map((group) => (
                <TouchableOpacity
                  key={group}
                  style={[
                    styles.bloodBadgeOption,
                    bloodGroup === group && styles.bloodBadgeSelected,
                  ]}
                  onPress={() => setBloodGroup(group)}
                  activeOpacity={0.7}
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
              placeholder="e.g. Penicillin, Peanuts (or None)"
              placeholderTextColor="#94A3B8"
            />
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, saving && { opacity: 0.7 }]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.saveButtonText}>Save Changes</Text>
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
    marginBottom: 14,
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
  multilineInput: {
    height: 64,
    textAlignVertical: 'top',
  },
  lockedRow: {
    position: 'relative',
    justifyContent: 'center',
  },
  disabledInput: {
    backgroundColor: '#F1F5F9',
    color: '#64748B',
    borderColor: '#E2E8F0',
  },
  lockIcon: {
    position: 'absolute',
    right: 12,
    bottom: 12,
  },
  bloodGroupContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 6,
  },
  bloodBadgeOption: {
    paddingVertical: 6,
    paddingHorizontal: 14,
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
  saveButton: {
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
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});