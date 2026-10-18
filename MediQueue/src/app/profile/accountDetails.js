import React, { useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { deletePatientProfile } from '../../services/profileService';


export default function AccountDetailsScreen() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({
    fullName: '',
    nic: '',
    patientId: '',
    dateOfBirth: '',
    age: '',
    gender: '',
    address: '',
    phoneNumber: '',
    emergencyContact: null,
    bloodGroup: '',
    knownAllergies: [],
  });

 
  const fetchAccountData = async () => {
    try {
      setLoading(true);
      const [
        savedNic,
        savedFullName,
        savedPatientId,
        savedDob,
        savedAge,
        savedGender,
        savedAddress,
        savedPhone,
        savedBlood,
        savedEmergency,
        savedAllergies,
      ] = await Promise.all([
        AsyncStorage.getItem('NIC'),
        AsyncStorage.getItem('fullName'),
        AsyncStorage.getItem('patientId'),
        AsyncStorage.getItem('dateOfBirth'),
        AsyncStorage.getItem('age'),
        AsyncStorage.getItem('gender'),
        AsyncStorage.getItem('address'),
        AsyncStorage.getItem('phoneNumber'),
        AsyncStorage.getItem('bloodGroup'),
        AsyncStorage.getItem('emergencyContact'),
        AsyncStorage.getItem('knownAllergies'),
      ]);

      
      let parsedEmergency = null;
      let parsedAllergies = [];

      try {
        if (savedEmergency) parsedEmergency = JSON.parse(savedEmergency);
      } catch (e) {
        parsedEmergency = null;
      }

      try {
        if (savedAllergies) parsedAllergies = JSON.parse(savedAllergies);
      } catch (e) {
        parsedAllergies = [];
      }

      setProfile({
        nic: savedNic || 'Not Available',
        fullName: savedFullName || 'Patient Name',
        patientId: savedPatientId || 'MQ-00000',
        dateOfBirth: savedDob ? savedDob.split('T')[0] : 'N/A',
        age: savedAge || 'N/A',
        gender: savedGender || 'N/A',
        address: savedAddress || 'Not Provided',
        phoneNumber: savedPhone || 'Not Provided',
        bloodGroup: savedBlood || 'N/A',
        emergencyContact: parsedEmergency,
        knownAllergies: Array.isArray(parsedAllergies) ? parsedAllergies : [],
      });
    } catch (error) {
      console.error('Error fetching account details:', error);
    } finally {
      setLoading(false);
    }
  };

  
  useFocusEffect(
    useCallback(() => {
      fetchAccountData();
    }, [])
  );

  const handleDeleteProfile = async () => {
    Alert.alert(
      'Delete Medical Profile',
      'Are you sure you want to delete your medical profile record? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const userId = await AsyncStorage.getItem('userId');
              if (userId) {
                await deletePatientProfile(userId.trim());
              }
              await AsyncStorage.multiRemove([
                'patientId',
                'dateOfBirth',
                'age',
                'gender',
                'address',
                'bloodGroup',
                'emergencyContact',
                'knownAllergies',
              ]);
              Alert.alert('Success', 'Medical profile deleted successfully.');
              router.replace('/(tabs)/profile');
            } catch (error) {
              console.error('Error deleting profile:', error);
              Alert.alert('Error', 'Failed to delete medical profile.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centerLoader]}>
        <ActivityIndicator size="large" color="#0D9488" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Account Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header Card */}
        <View style={styles.avatarCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {profile.fullName ? profile.fullName.charAt(0).toUpperCase() : 'P'}
            </Text>
          </View>
          <Text style={styles.profileName}>{profile.fullName}</Text>
          <Text style={styles.profileSubtitle}>
            OPD Patient ID: #{profile.patientId}
          </Text>
        </View>

        {/* 1. Personal Information */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="person-outline" size={18} color="#0D9488" />
            <Text style={styles.cardTitle}>Personal Information</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Full Name</Text>
            <Text style={styles.value}>{profile.fullName}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.label}>NIC / ID</Text>
            <Text style={styles.value}>{profile.nic}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.label}>Date of Birth</Text>
            <Text style={styles.value}>{profile.dateOfBirth}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.label}>Age</Text>
            <Text style={styles.value}>{profile.age} Yrs</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.label}>Gender</Text>
            <Text style={styles.value}>{profile.gender}</Text>
          </View>
        </View>

        {/* 2. Contact Information */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="call-outline" size={18} color="#0D9488" />
            <Text style={styles.cardTitle}>Contact Details</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Phone</Text>
            <Text style={styles.value}>{profile.phoneNumber}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.label}>Address</Text>
            <Text style={styles.value}>{profile.address}</Text>
          </View>
        </View>

        {/* 3. Emergency Contact */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="alert-circle-outline" size={18} color="#DC2626" />
            <Text style={[styles.cardTitle, { color: '#DC2626' }]}>
              Emergency Contact
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Contact Person</Text>
            <Text style={styles.value}>
              {profile.emergencyContact?.name
                ? `${profile.emergencyContact.name} (${profile.emergencyContact.relationship || 'Guardian'})`
                : 'Not Set'}
            </Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.label}>Emergency Phone</Text>
            <Text style={styles.value}>
              {profile.emergencyContact?.phoneNumber || 'Not Set'}
            </Text>
          </View>
        </View>

        {/* 4. Basic Medical Info */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="fitness-outline" size={18} color="#0D9488" />
            <Text style={styles.cardTitle}>Medical Profile</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Blood Group</Text>
            <View style={styles.bloodBadge}>
              <Text style={styles.bloodBadgeText}>{profile.bloodGroup}</Text>
            </View>
          </View>
          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.label}>Known Allergies</Text>
            <Text
              style={[
                styles.value,
                profile.knownAllergies.length > 0 && { color: '#DC2626' },
              ]}
            >
              {profile.knownAllergies.length > 0
                ? profile.knownAllergies.join(', ')
                : 'None'}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity
          style={styles.editButton}
          activeOpacity={0.85}
          onPress={() => router.push('/profile/EditAccountDetails')}
        >
          <Ionicons
            name="create-outline"
            size={18}
            color="#FFFFFF"
            style={{ marginRight: 6 }}
          />
          <Text style={styles.editButtonText}>Edit Details</Text>
        </TouchableOpacity>

        {/* Delete Medical Profile Button */}
        <TouchableOpacity
          style={styles.deleteButton}
          activeOpacity={0.85}
          onPress={handleDeleteProfile}
        >
          <Ionicons
            name="trash-outline"
            size={18}
            color="#DC2626"
            style={{ marginRight: 6 }}
          />
          <Text style={styles.deleteButtonText}>Delete Medical Profile</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EDF5FA',
  },
  centerLoader: {
    justifyContent: 'center',
    alignItems: 'center',
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
    padding: 20,
    paddingBottom: 40,
  },
  avatarCard: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#0D9488',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    elevation: 3,
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  profileSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
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
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  label: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  value: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#1E293B',
    maxWidth: '60%',
    textAlign: 'right',
  },
  bloodBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 8,
  },
  bloodBadgeText: {
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 13,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  editButton: {
    backgroundColor: '#0D9488',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
    elevation: 3,
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  deleteButton: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 12,
  },
  deleteButtonText: {
    color: '#DC2626',
    fontSize: 15,
    fontWeight: '700',
  },
});