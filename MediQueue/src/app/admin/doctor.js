import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  RefreshControl,
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
import * as Speech from 'expo-speech';

import {
  fetchDoctorQueue,
  submitFinishConsultation,
} from '../../services/adminService';

const AVAILABLE_TESTS = [
  'FBC',
  'FBS',
  'Lipid Profile',
  'Creatinine',
  'UFR',
  'Dengue NS1',
];

export default function DoctorScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);

  // Clinic metadata
  const [roomInfo, setRoomInfo] = useState({
    room: 'Room 01',
    clinic: 'General OPD',
    queueTotal: 0,
    hospitalId: '',
    clinicId: '',
  });

  // Next up tokens loaded from DB
  const [nextUpList, setNextUpList] = useState([]);
  const [fullQueueList, setFullQueueList] = useState([]);

  // Active Patient loaded from DB
  const [activePatient, setActivePatient] = useState({
    _id: '',
    token: 'A 001',
    name: 'Patient Waiting',
    age: 24,
    gender: 'Male',
    phn: 'PHN-MQ-89241',
    bloodGroup: 'O+',
    allergies: 'None reported',
    chronic: 'None',
  });

  // Form states
  const [diagnosis, setDiagnosis] = useState('');
  const [medicineInput, setMedicineInput] = useState('');
  const [prescribedList, setPrescribedList] = useState([]);
  const [selectedTests, setSelectedTests] = useState([]);

  useEffect(() => {
    loadSavedData();
  }, []);

  const loadSavedData = async () => {
    try {
      setLoading(true);
      let hospId = '';
      let clinId = '';
      const storedUser = await AsyncStorage.getItem('adminUser');
      if (storedUser) {
        const u = JSON.parse(storedUser);
        if (u.room) setRoomInfo((prev) => ({ ...prev, room: u.room }));
        if (u.hospitalId) {
          hospId = u.hospitalId;
          setRoomInfo((prev) => ({ ...prev, hospitalId: u.hospitalId }));
        }
        if (u.clinicId) {
          clinId = u.clinicId;
          setRoomInfo((prev) => ({ ...prev, clinicId: u.clinicId }));
        }
      }

      // Fetch Live Doctor Queue from MongoDB
      const res = await fetchDoctorQueue(hospId, clinId);
      if (res.ok && Array.isArray(res.data?.appointments) && res.data.appointments.length > 0) {
        const appts = res.data.appointments;
        setFullQueueList(appts);
        setRoomInfo((prev) => ({ ...prev, queueTotal: appts.length }));

        const first = appts[0];
        setActivePatient({
          _id: first._id,
          token: first.tokenNumber || first.token || 'A 001',
          name: first.name || first.patientName || 'Namal Gunawardena',
          age: first.age || 24,
          gender: first.gender || 'Male',
          phn: first.phn || 'PHN-MQ-89241',
          bloodGroup: first.bloodGroup || 'O+',
          allergies: Array.isArray(first.allergies)
            ? first.allergies.join(', ')
            : first.allergies || 'Penicillin, Peanuts',
          chronic: Array.isArray(first.chronicConditions)
            ? first.chronicConditions.join(' · ')
            : first.chronicConditions || 'Asthma (2018) · Hypertension',
        });

        const nextTokens = appts.slice(1).map((a) => a.tokenNumber || a.token);
        setNextUpList(nextTokens);
      }
    } catch (e) {
      console.log('Error loading doctor queue from MongoDB:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAddMedicine = () => {
    if (!medicineInput.trim()) {
      Alert.alert('Prescription', 'Please enter Medicine name, Dosage, and Duration.');
      return;
    }
    setPrescribedList((prev) => [
      ...prev,
      { id: Date.now().toString(), text: medicineInput.trim() },
    ]);
    setMedicineInput('');
  };

  const handleRemoveMedicine = (id) => {
    setPrescribedList((prev) => prev.filter((item) => item.id !== id));
  };

  const toggleTest = (testName) => {
    setSelectedTests((prev) =>
      prev.includes(testName)
        ? prev.filter((t) => t !== testName)
        : [...prev, testName]
    );
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Patient',
      `Move ${activePatient.name} (${activePatient.token}) to the end of the queue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Skip',
          style: 'default',
          onPress: () => {
            if (fullQueueList.length > 1) {
              const remaining = fullQueueList.slice(1);
              remaining.push(fullQueueList[0]);
              setFullQueueList(remaining);

              const nextAppt = remaining[0];
              setActivePatient({
                _id: nextAppt._id,
                token: nextAppt.tokenNumber || nextAppt.token,
                name: nextAppt.name || nextAppt.patientName,
                age: nextAppt.age || 30,
                gender: nextAppt.gender || 'Male',
                phn: nextAppt.phn || 'PHN-MQ-74120',
                bloodGroup: nextAppt.bloodGroup || 'B+',
                allergies: Array.isArray(nextAppt.allergies) ? nextAppt.allergies.join(', ') : nextAppt.allergies || 'None reported',
                chronic: Array.isArray(nextAppt.chronicConditions) ? nextAppt.chronicConditions.join(' · ') : nextAppt.chronicConditions || 'None',
              });

              setNextUpList(remaining.slice(1).map((a) => a.tokenNumber || a.token));
              setDiagnosis('');
              setMedicineInput('');
              setPrescribedList([]);
              setSelectedTests([]);

              try {
                Speech.speak(`Calling token number ${nextAppt.tokenNumber || nextAppt.token}. Please proceed to ${roomInfo.room}.`, {
                  language: 'en-US',
                  rate: 0.9,
                });
              } catch (e) {}
            } else {
              Alert.alert('Queue Complete', 'No other patients waiting in queue.');
            }
          },
        },
      ]
    );
  };

  const handleTransmitAndNext = async () => {
    setIsSubmitting(true);
    try {
      const medicinesToSend = prescribedList.map((p) => {
        const parts = p.text.split('·');
        return {
          drug: parts[0]?.trim() || p.text,
          dose: parts[1]?.trim() || '1 Tab TDS',
          days: parts[2]?.trim() || '3 Days',
        };
      });

      if (medicinesToSend.length === 0 && medicineInput.trim()) {
        medicinesToSend.push({
          drug: medicineInput.trim(),
          dose: '1 Tab Daily',
          days: '3 Days',
        });
      }

      // 1. Submit Real Consultation to MongoDB (creates Prescription & LabOrder in DB)
      await submitFinishConsultation({
        hospitalId: roomInfo.hospitalId || undefined,
        tokenNumber: activePatient.token,
        patientName: activePatient.name,
        patientAge: activePatient.age,
        patientGender: activePatient.gender,
        diagnosis: diagnosis || 'General Consultation',
        prescriptions: medicinesToSend,
        selectedLabTests: selectedTests,
      });

      const testsSummary = selectedTests.length > 0 ? selectedTests.join(', ') : 'None';
      const medsSummary =
        medicinesToSend.length > 0
          ? medicinesToSend.map((m) => m.drug).join(', ')
          : 'Standard discharge';

      Alert.alert(
        'Consultation Transmitted',
        `Prescription & Lab orders saved to database for ${activePatient.name} (${activePatient.token}).\n\nDiagnosis: ${diagnosis || 'General checkup'}\nTests: ${testsSummary}\nMeds: ${medsSummary}`
      );

      // Advance to next patient from live list
      if (fullQueueList.length > 1) {
        const remaining = fullQueueList.slice(1);
        setFullQueueList(remaining);

        const nextAppt = remaining[0];
        setActivePatient({
          _id: nextAppt._id,
          token: nextAppt.tokenNumber || nextAppt.token,
          name: nextAppt.name || nextAppt.patientName,
          age: nextAppt.age || 35,
          gender: nextAppt.gender || 'Male',
          phn: nextAppt.phn || 'PHN-MQ-93011',
          bloodGroup: nextAppt.bloodGroup || 'A+',
          allergies: Array.isArray(nextAppt.allergies) ? nextAppt.allergies.join(', ') : nextAppt.allergies || 'None',
          chronic: Array.isArray(nextAppt.chronicConditions) ? nextAppt.chronicConditions.join(' · ') : nextAppt.chronicConditions || 'None',
        });

        setNextUpList(remaining.slice(1).map((a) => a.tokenNumber || a.token));
        setDiagnosis('');
        setMedicineInput('');
        setPrescribedList([]);
        setSelectedTests([]);

        try {
          Speech.speak(`Token number ${nextAppt.tokenNumber || nextAppt.token}. Please enter consultation room.`, {
            language: 'en-US',
            rate: 0.9,
          });
        } catch (e) {}
      } else {
        setFullQueueList([]);
        setNextUpList([]);
        Alert.alert('Queue Completed', 'All queue patients have been attended to in this session.');
      }
    } catch (err) {
      console.error('Error submitting consultation:', err);
      Alert.alert('Error', 'Unable to transmit consultation to hospital network.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => setRefreshing(false)}
            tintColor="#FFFFFF"
          />
        }
      >
        {/* ============================================================== */}
        {/* HERO HEADER: Curved Green Banner (Screenshot 4)                */}
        {/* ============================================================== */}
        <View style={styles.heroBanner}>
          <View style={styles.heroTopRow}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={styles.heroTitle}>Attending {activePatient.token}</Text>
              <Text style={styles.heroSubtitle}>
                {roomInfo.room} · {roomInfo.clinic} · Queue {roomInfo.queueTotal}
              </Text>
            </View>

            {/* QR Scanner Pill Button (Screenshot 4) */}
            <TouchableOpacity
              style={styles.qrPillBtn}
              onPress={() => setShowQRModal(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="scan-outline" size={17} color="#FFFFFF" style={{ marginRight: 5 }} />
              <Text style={styles.qrPillText}>QR</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ============================================================== */}
        {/* QUEUE ROW: Next up Pills (Screenshot 4)                        */}
        {/* ============================================================== */}
        <View style={styles.nextUpRow}>
          <Text style={styles.nextUpLabel}>Next up</Text>
          {nextUpList.map((token, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.nextUpPill}
              activeOpacity={0.7}
              onPress={() =>
                Alert.alert('Queue Patient', `Token ${token} is waiting in ${roomInfo.clinic}.`)
              }
            >
              <Text style={styles.nextUpPillText}>{token}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ============================================================== */}
        {/* PATIENT CARD (Screenshot 4)                                    */}
        {/* ============================================================== */}
        <View style={styles.patientCard}>
          <View style={styles.patientTopRow}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={styles.patientName}>{activePatient.name}</Text>
              <Text style={styles.patientSubtitle}>
                {activePatient.age} Yrs · {activePatient.gender} · {activePatient.phn}
              </Text>
            </View>

            {/* Blood Group Badge (Screenshot 4: O+) */}
            <View style={styles.bloodBadge}>
              <Text style={styles.bloodBadgeText}>{activePatient.bloodGroup}</Text>
            </View>
          </View>

          {/* Allergies Banner (Screenshot 4) */}
          <View style={styles.allergyBanner}>
            <Text style={styles.allergyLabel}>Allergies: </Text>
            <Text style={styles.allergyValue}>{activePatient.allergies}</Text>
          </View>

          {/* Chronic Conditions Banner (Screenshot 4) */}
          <View style={styles.chronicBanner}>
            <Text style={styles.chronicLabel}>Chronic: </Text>
            <Text style={styles.chronicValue}>{activePatient.chronic}</Text>
          </View>
        </View>

        {/* ============================================================== */}
        {/* FORM 1: DIAGNOSIS (Screenshot 4)                               */}
        {/* ============================================================== */}
        <View style={styles.formCard}>
          <Text style={styles.formSectionLabel}>DIAGNOSIS</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Upper Respiratory Tract Infection"
              placeholderTextColor="#94A3B8"
              value={diagnosis}
              onChangeText={setDiagnosis}
            />
          </View>
        </View>

        {/* ============================================================== */}
        {/* FORM 2: PRESCRIBE MEDICINES (Screenshot 4)                     */}
        {/* ============================================================== */}
        <View style={styles.formCard}>
          <Text style={styles.formSectionLabel}>PRESCRIBE MEDICINES</Text>
          <View style={styles.prescribeRow}>
            <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
              <TextInput
                style={styles.textInput}
                placeholder="Drug · Dosage · Duration"
                placeholderTextColor="#94A3B8"
                value={medicineInput}
                onChangeText={setMedicineInput}
                onSubmitEditing={handleAddMedicine}
                returnKeyType="done"
              />
            </View>
            <TouchableOpacity
              style={styles.addMedicineBtn}
              onPress={handleAddMedicine}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Prescribed Items List */}
          {prescribedList.length > 0 && (
            <View style={styles.prescribedListWrap}>
              {prescribedList.map((item) => (
                <View key={item.id} style={styles.prescribedTag}>
                  <Text style={styles.prescribedTagText}>{item.text}</Text>
                  <TouchableOpacity
                    onPress={() => handleRemoveMedicine(item.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="close-circle" size={17} color="#059669" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ============================================================== */}
        {/* FORM 3: ORDER DIAGNOSTIC TESTS (Screenshot 4)                  */}
        {/* ============================================================== */}
        <View style={styles.formCard}>
          <Text style={styles.formSectionLabel}>ORDER DIAGNOSTIC TESTS</Text>
          <View style={styles.testsChipRow}>
            {AVAILABLE_TESTS.map((test) => {
              const isSelected = selectedTests.includes(test);
              return (
                <TouchableOpacity
                  key={test}
                  style={[styles.testChip, isSelected && styles.testChipSelected]}
                  onPress={() => toggleTest(test)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.testChipText, isSelected && styles.testChipTextSelected]}>
                    {test}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Bottom spacing for floating bar */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ============================================================== */}
      {/* FLOATING BOTTOM ACTIONS: Skip & Transmit & Next (Screenshot 4) */}
      {/* ============================================================== */}
      <View style={styles.bottomBarContainer}>
        <TouchableOpacity
          style={styles.skipBtn}
          onPress={handleSkip}
          activeOpacity={0.8}
        >
          <Text style={styles.skipBtnText}>Skip</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.transmitBtn}
          onPress={handleTransmitAndNext}
          disabled={isSubmitting}
          activeOpacity={0.85}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.transmitBtnText}>Transmit & Next</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* ============================================================== */}
      {/* QR SCANNER MODAL                                               */}
      {/* ============================================================== */}
      <Modal visible={showQRModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.qrHeaderRow}>
              <Text style={styles.qrModalTitle}>Patient QR Check-in</Text>
              <TouchableOpacity onPress={() => setShowQRModal(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.qrPlaceholderBox}>
              <Image
                source={{
                  uri: `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                    JSON.stringify({
                      type: 'MEDIQUEUE_DESK',
                      hospitalId: roomInfo.hospitalId || '6abe1095389a5f3809a9da0a',
                      clinicId: roomInfo.clinicId || '6ac0ac6d9d8d70c4b8d6fd99',
                      doctorId: '6ad482e96ec85cac883d4afa',
                      doctorName: 'Dr. Samantha Wickramasinghe',
                      roomNumber: roomInfo.room || 'Room 01',
                      clinicName: roomInfo.clinic || 'General OPD',
                    })
                  )}`
                }}
                style={{ width: 180, height: 180, borderRadius: 12, backgroundColor: '#FFFFFF' }}
                resizeMode="contain"
              />
              <Text style={[styles.qrInstructionText, { marginTop: 12 }]}>
                {roomInfo.room || 'Room 01'} Official Desk QR Code.{'\n'}Patients scan this code with the MediQueue app to connect.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.qrSimulateBtn}
              onPress={() => {
                setShowQRModal(false);
                Alert.alert('Scanned Successfully', 'Verified Patient: Namal Gunawardena (MQ-89241)');
              }}
            >
              <Text style={styles.qrSimulateBtnText}>Simulate Quick Scan</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#EBF2F0',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },

  /* Hero Header */
  heroBanner: {
    backgroundColor: '#2E7D52',
    paddingTop: Platform.OS === 'ios' ? 14 : 22,
    paddingBottom: 30,
    paddingHorizontal: 22,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  heroSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
    fontWeight: '500',
  },
  qrPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.24)',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 22,
  },
  qrPillText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },

  /* Next up Row */
  nextUpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 22,
    marginTop: 18,
    marginBottom: 8,
  },
  nextUpLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginRight: 14,
  },
  nextUpPill: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 15,
    paddingVertical: 6,
    marginRight: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
  },
  nextUpPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },

  /* Patient Card */
  patientCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 24,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
  },
  patientTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  patientName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  patientSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 4,
  },
  bloodBadge: {
    backgroundColor: '#FEE2E2',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bloodBadgeText: {
    color: '#B91C1C',
    fontWeight: '800',
    fontSize: 15,
  },

  /* Allergies & Chronic Banners */
  allergyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderRadius: 13,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginTop: 14,
  },
  allergyLabel: {
    color: '#991B1B',
    fontWeight: '800',
    fontSize: 13,
  },
  allergyValue: {
    color: '#1E293B',
    fontSize: 13,
    fontWeight: '500',
  },
  chronicBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 13,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginTop: 8,
  },
  chronicLabel: {
    color: '#92400E',
    fontWeight: '800',
    fontSize: 13,
  },
  chronicValue: {
    color: '#1E293B',
    fontSize: 13,
    fontWeight: '500',
  },

  /* Form Cards */
  formCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 22,
    padding: 18,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
  },
  formSectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  inputContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
  },
  textInput: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '500',
    padding: 0,
  },

  /* Prescribe Medicines Row */
  prescribeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addMedicineBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2E7D52',
    alignItems: 'center',
    justifyContent: 'center',
  },
  prescribedListWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  prescribedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  prescribedTagText: {
    fontSize: 12,
    color: '#065F46',
    fontWeight: '700',
  },

  /* Diagnostic Tests Chips */
  testsChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  testChip: {
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  testChipSelected: {
    backgroundColor: '#2E7D52',
  },
  testChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  testChipTextSelected: {
    color: '#FFFFFF',
  },

  /* Floating Bottom Action Bar */
  bottomBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#EBF2F0',
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    paddingTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  skipBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 26,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
  },
  skipBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
  },
  transmitBtn: {
    flex: 1,
    backgroundColor: '#2E7D52',
    borderRadius: 24,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  transmitBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  /* QR Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    width: '100%',
    maxWidth: 380,
    padding: 22,
    alignItems: 'center',
  },
  qrHeaderRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  qrModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  qrPlaceholderBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 26,
    alignItems: 'center',
    width: '100%',
    marginVertical: 10,
  },
  qrInstructionText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 14,
    lineHeight: 18,
  },
  qrSimulateBtn: {
    backgroundColor: '#2E7D52',
    borderRadius: 16,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
    marginTop: 12,
  },
  qrSimulateBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
