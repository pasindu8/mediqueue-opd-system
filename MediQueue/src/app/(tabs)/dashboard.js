import React, { useState, useEffect } from 'react'; 
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getPatientDetails } from '../../services/profileService';
import { getPatientAppointmentDetails } from '../../services/appointmentsService'; 
import { getHospitalDetails } from '../../services/hospitalService';

export default function DashboardScreen() {
  const [isNewUser, setIsNewUser] = useState(true);
  const [userName, setUserName] = useState('');
  const [activeToken, setActiveToken] = useState(null); // Store active appointment token data
  const [hospitalDetails, setHospitalDetails] = useState(null); // Store hospital details
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem('userId');
        const storedName = await AsyncStorage.getItem('fullName');

        if (storedName) {
          setUserName(storedName);
        }
        
        if (!storedUserId) {
          return;
        }

        setLoading(true);

        // 1. Fetch Profile Details and Patient ID
        const profileResult = await getPatientDetails(storedUserId.trim());

        if (profileResult.ok && profileResult.data) {
          const data = profileResult.data;

          if (data.patientId) {
            setIsNewUser(false);
            await AsyncStorage.setItem('patientId', String(data.patientId));

            
            const appointmentResult = await getPatientAppointmentDetails(storedUserId.trim());
            
            if (appointmentResult.ok && appointmentResult.data) {
              setActiveToken(appointmentResult.data.appointment);

              const hospitalResult = await getHospitalDetails(appointmentResult.data.appointment.hospitalId.trim());
              
              if (hospitalResult.ok && hospitalResult.data) {
                setHospitalDetails(hospitalResult.data.hospital);
              }
            } else {
              setActiveToken(null);
            }

          } else {
            setIsNewUser(true);
            setActiveToken(null);
          }

          if (data.fullName) {
            setUserName(data.fullName);
            await AsyncStorage.setItem('fullName', data.fullName);
          }
          if (data.dateOfBirth) {
            await AsyncStorage.setItem('dateOfBirth', String(data.dateOfBirth));
          }
          if (data.gender) {
            await AsyncStorage.setItem('gender', String(data.gender));
          }
          if (data.age) {
            await AsyncStorage.setItem('age', String(data.age));
          }
          if (data.address) {
            await AsyncStorage.setItem('address', String(data.address));
          }
          if (data.bloodGroup) {
            await AsyncStorage.setItem('bloodGroup', String(data.bloodGroup));
          }
          if (data.emergencyContact) {
            await AsyncStorage.setItem(
              'emergencyContact',
              JSON.stringify(data.emergencyContact)
            );
          }
          if (data.knownAllergies) {
            await AsyncStorage.setItem(
              'knownAllergies',
              JSON.stringify(data.knownAllergies)
            );
          }
          if (data.medicalHistory) {
            await AsyncStorage.setItem(
              'medicalHistory',
              JSON.stringify(data.medicalHistory)
            );
          }
        } else {
          setIsNewUser(true);
        }
      } catch (error) {
        console.error('Error fetching dashboard patient data:', error);
        Alert.alert(
          'Connection Error',
          'Unable to sync profile details from the server.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPatientData();
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Gradient Banner */}
        <LinearGradient
          colors={['#0B5338', '#127C55', '#24A876']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerBanner}
        >
          <Text style={styles.welcomeSubtitle}>Welcome,</Text>
          {/* Dynamic User Name */}
          <Text style={styles.welcomeTitle}>
            {userName ? userName : 'Patient'}
          </Text>
        </LinearGradient>

        <View style={styles.topCardWrapper}>
          {isNewUser ? (
            /* New User -> Profile Setup Notice Card */
            <TouchableOpacity
              style={styles.setupCard}
              activeOpacity={0.85}
              onPress={() => router.push('../profile/AddAccountDetails')}
            >
              <View style={styles.setupIconContainer}>
                <Ionicons name="person-add" size={24} color="#C53030" />
              </View>
              <View style={styles.setupTextContainer}>
                <Text style={styles.setupTitle}>Complete Your Profile</Text>
                <Text style={styles.setupSubtitle}>
                  Finalize personal details to get faster OPD tokens & appointments.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#0B5338" />
            </TouchableOpacity>
          ) : activeToken && activeToken.tokenNumber ? (
            /* User with Active Token -> Token Card */
            <View style={styles.tokenCard}>
              <Text style={styles.tokenCardHeader}>Your Token</Text>
              <Text style={styles.tokenNumber}>
                Token: {activeToken.tokenNumber || 'A ---'}
              </Text>

              <View style={styles.tokenDetailsRow}>
                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>Clinic:</Text>
                  <Text style={styles.detailValue}>
                    {activeToken.clinicName || hospitalDetails?.clinics?.clinicName || 'General OPD Clinic'}
                  </Text>
                </View>
                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>Room:</Text>
                  <Text style={styles.detailValue}>
                    {activeToken.roomNumber || hospitalDetails?.clinics?.roomNumber || 'Room 01'}
                  </Text>
                </View>
              </View>

              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>{activeToken.status || 'Waiting'}</Text>
              </View>
            </View>
          ) : (
            /* Old User but No Active Token -> Prompt to book a new token */
            <TouchableOpacity
              style={styles.setupCard}
              activeOpacity={0.85}
              onPress={() => router.push('/appointments/NewToken')}
            >
              <View style={[styles.setupIconContainer, { backgroundColor: '#E6F4EA' }]}>
                <Ionicons name="calendar-outline" size={24} color="#0B5338" />
              </View>
              <View style={styles.setupTextContainer}>
                <Text style={styles.setupTitle}>No Active Appointments</Text>
                <Text style={styles.setupSubtitle}>
                  Tap here to book a new token or check clinic availability.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#0B5338" />
            </TouchableOpacity>
          )}
        </View>

        {/* 2. 2x2 Quick Action Grid */}
        <View style={styles.gridContainer}>
          <TouchableOpacity
            style={styles.gridCard}
            activeOpacity={0.75}
            onPress={() => router.push('/appointments/NewToken')}
          >
            <View style={styles.iconCircle}>
              <Ionicons name="document-text-outline" size={26} color="#0B5338" />
            </View>
            <Text style={styles.gridTitle}>New Token</Text>
            <Text style={styles.gridSubtitle}>(New Token)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gridCard}
            activeOpacity={0.75}
            onPress={() => router.push('/appointments/doctor')}
          >
            <View style={styles.iconCircle}>
              <Ionicons name="people-outline" size={26} color="#0B5338" />
            </View>
            <Text style={styles.gridTitle}>Doctors</Text>
            <Text style={styles.gridSubtitle}>(Doctors)</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.gridCard} 
            activeOpacity={0.75}
            onPress={() => router.push('/appointments/QrScan')}
          >
            <View style={styles.iconCircle}>
              <Ionicons name="qr-code-outline" size={26} color="#0B5338" />
            </View>
            <Text style={styles.gridTitle}>Scan QR</Text>
            <Text style={styles.gridSubtitle}>(Scan QR)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gridCard}
            activeOpacity={0.75}
            onPress={() => router.push('/profile/helpSupport')}
          >
            <View style={styles.iconCircle}>
              <Ionicons name="help-circle-outline" size={26} color="#0B5338" />
            </View>
            <Text style={styles.gridTitle}>Help</Text>
            <Text style={styles.gridSubtitle}>(Help)</Text>
          </TouchableOpacity>
        </View>

        {/* 3. Clinic Availability Status Card */}
        <View style={styles.announcementCard}>
          <View style={styles.announcementHeader}>
            <View style={styles.announcementIconBox}>
              <Ionicons name="information-circle" size={20} color="#0D9488" />
            </View>
            <View style={styles.announcementTitleWrapper}>
              <Text style={styles.announcementTag}>NOTICE BOARD & TIPS</Text>
              <Text style={styles.announcementMainTitle}>Hospital Announcements</Text>
            </View>
          </View>

          <View style={styles.announcementContentBox}>
            <Ionicons name="megaphone-outline" size={18} color="#2563EB" style={{ marginTop: 2 }} />
            <Text style={styles.announcementText}>
              Please have your digital token number and National Identity Card (NIC) ready upon arrival at the hospital clinics.
            </Text>
          </View>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  headerBanner: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 48,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#D1FAE5',
    fontWeight: '500',
  },
  welcomeTitle: {
    fontSize: 22,
    color: '#FFFFFF',
    fontWeight: '700',
    marginTop: 4,
  },
  topCardWrapper: {
    marginHorizontal: 20,
    marginTop: -32,
  },
  setupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#FECACA',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  setupIconContainer: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  setupTextContainer: {
    flex: 1,
  },
  setupTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0B5338',
    marginBottom: 3,
  },
  setupSubtitle: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 16,
  },
  tokenCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  tokenCardHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  tokenNumber: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0D9488',
    marginBottom: 16,
  },
  tokenDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  detailCol: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  statusBadge: {
    backgroundColor: '#DCFCE7',
    paddingVertical: 5,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  statusText: {
    color: '#15803D',
    fontSize: 13,
    fontWeight: '700',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  gridCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#E6F4EA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  gridTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  gridSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  statusSectionCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 6,
    borderRadius: 16,
    padding: 18,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  clinicStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  clinicName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  badgeOnline: {
    flexDirection: 'row',
    zIndex: 1,
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  badgeOffline: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotGreen: {
    backgroundColor: '#16A34A',
  },
  dotRed: {
    backgroundColor: '#DC2626',
  },
  badgeTextOnline: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  badgeTextOffline: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B91C1C',
  },
  announcementCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  announcementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  announcementIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F0FDFA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  announcementTitleWrapper: {
    flex: 1,
  },
  announcementTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0D9488',
    letterSpacing: 0.5,
  },
  announcementMainTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  announcementContentBox: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#2563EB',
    gap: 10,
    alignItems: 'flex-start',
  },
  announcementText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
    fontWeight: '500',
    flex: 1,
  },
});