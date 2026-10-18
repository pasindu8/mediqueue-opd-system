import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from 'expo-speech';
import {
  fetchPharmacyAdminQueue,
  submitDispensePrescription,
} from '../../services/adminService';

export default function PharmacyScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [pharmacistName, setPharmacistName] = useState('Dr. Samantha Wickramasinghe (RPh)');
  const [dispensedTodayCount, setDispensedTodayCount] = useState(0);
  const [pickupQueueCount, setPickupQueueCount] = useState(0);

  const [activePrescription, setActivePrescription] = useState(null);
  const [checkedMeds, setCheckedMeds] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      let currentHospId = null;
      const stored = await AsyncStorage.getItem('adminUser');
      if (stored) {
        const u = JSON.parse(stored);
        if (u.name) setPharmacistName(`${u.name} (RPh)`);
        if (u.hospitalId) currentHospId = u.hospitalId;
      }

      // Fetch live pharmacy queue from MongoDB database
      const res = await fetchPharmacyAdminQueue(currentHospId);
      if (res.ok && res.data) {
        setActivePrescription(res.data.activePrescription || null);
        setDispensedTodayCount(res.data.dispensedCount || 0);
        const queueLen = (res.data.incomingQueue?.length || 0) + (res.data.activePrescription ? 1 : 0);
        setPickupQueueCount(queueLen);
      }
    } catch (e) {
      console.log('Error loading pharmacy queue from MongoDB:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleEndShift = () => {
    Alert.alert('End Shift', 'Are you sure you want to end your dispensary shift?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End Shift',
        style: 'destructive',
        onPress: async () => {
          router.replace('/admin/portal');
        },
      },
    ]);
  };

  const toggleMedCheck = (id) => {
    setCheckedMeds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleDispense = async () => {
    if (!activePrescription) return;
    try {
      setIsProcessing(true);
      // Submit real dispense update to MongoDB database
      await submitDispensePrescription(
        activePrescription._id,
        activePrescription.token,
        pharmacistName,
        'Dispensary Counter 01'
      );

      Alert.alert(
        'Dispensed Successfully',
        `Prescription for Token ${activePrescription.token} marked as dispensed in database.`
      );
      loadData();
    } catch (err) {
      console.error('Error dispensing prescription:', err);
      Alert.alert('Error', 'Unable to dispense prescription.');
    } finally {
      setIsProcessing(false);
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
            onRefresh={() => {
              setRefreshing(true);
              loadData();
            }}
            tintColor="#FFFFFF"
          />
        }
      >
        {/* ============================================================== */}
        {/* HERO HEADER (Curved Green Hero Banner)                         */}
        {/* ============================================================== */}
        <View style={styles.heroBanner}>
          <View style={styles.heroTopRow}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={styles.heroTitle}>Dispensary Counter</Text>
              <Text style={styles.heroSubtitle}>
                Pharmacist: {pharmacistName}
              </Text>
            </View>

            {/* End Shift Header Button */}
            <TouchableOpacity
              style={styles.headerEndShiftBtn}
              onPress={handleEndShift}
              activeOpacity={0.8}
            >
              <Ionicons name="log-out-outline" size={17} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.headerEndShiftText}>End Shift</Text>
            </TouchableOpacity>
          </View>

          {/* 2 Metrics Cards Row: DISPENSED TODAY & PICKUP QUEUE */}
          <View style={styles.metricsRow}>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>DISPENSED TODAY</Text>
              <Text style={[styles.metricNumber, { color: '#2E7D52' }]}>
                {dispensedTodayCount}
              </Text>
            </View>

            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>PICKUP QUEUE</Text>
              <Text style={[styles.metricNumber, { color: '#C2410C' }]}>
                {pickupQueueCount}
              </Text>
            </View>
          </View>
        </View>

        {/* ============================================================== */}
        {/* CONTENT AREA: No Prescriptions Waiting OR Active Prescription */}
        {/* ============================================================== */}
        <View style={styles.contentWrap}>
          {activePrescription ? (
            /* Active Prescription Card */
            <View style={styles.waitingCard}>
              <View style={styles.rxHeaderRow}>
                <View style={styles.tokenBox}>
                  <Text style={styles.tokenLabel}>TOKEN</Text>
                  <Text style={styles.tokenNumber}>{activePrescription.token}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.patientName}>{activePrescription.patientName}</Text>
                  <Text style={styles.patientMeta}>
                    {activePrescription.age} Yrs · {activePrescription.gender}
                  </Text>
                  <Text style={styles.doctorMeta}>Doctor: {activePrescription.doctor}</Text>
                </View>
              </View>

              <Text style={styles.checkHeading}>Verify Medications</Text>
              {activePrescription.medicines?.map((med, idx) => {
                const checked = !!checkedMeds[med.id || idx];
                return (
                  <TouchableOpacity
                    key={med.id || idx}
                    style={[styles.medCheckRow, checked && styles.medCheckRowChecked]}
                    onPress={() => toggleMedCheck(med.id || idx)}
                  >
                    <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                      {checked && <Ionicons name="checkmark" size={13} color="#FFFFFF" />}
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.medDrug}>{med.drug}</Text>
                      <Text style={styles.medDose}>{med.dose} · {med.days}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}

              <TouchableOpacity
                style={styles.dispenseActionBtn}
                onPress={handleDispense}
                disabled={isProcessing}
              >
                <Text style={styles.dispenseActionBtnText}>Dispense & Complete</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Screenshot 2: No Prescriptions Waiting Empty State Card */
            <View style={styles.waitingCard}>
              <View style={styles.boxCircle}>
                <Ionicons name="cube-outline" size={38} color="#2E7D52" />
              </View>

              <Text style={styles.waitingTitle}>No Prescriptions Waiting</Text>
              <Text style={styles.waitingSubtitle}>
                All prescriptions submitted by doctors have been packed and dispensed.
              </Text>
            </View>
          )}

          {/* End Shift Large Bottom Pill Button */}
          <TouchableOpacity
            style={styles.bottomEndShiftBtn}
            onPress={handleEndShift}
            activeOpacity={0.8}
          >
            <Text style={styles.bottomEndShiftText}>End Shift</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    paddingBottom: 40,
  },

  /* Hero Banner */
  heroBanner: {
    backgroundColor: '#2E7D52',
    paddingTop: Platform.OS === 'ios' ? 16 : 24,
    paddingBottom: 28,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#D1FAE5',
    fontWeight: '500',
    marginTop: 4,
  },
  headerEndShiftBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  headerEndShiftText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  /* 2 Metrics Cards Row: DISPENSED TODAY & PICKUP QUEUE */
  metricsRow: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 20,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  metricNumber: {
    fontSize: 28,
    fontWeight: '900',
    marginTop: 4,
  },

  /* Content Area */
  contentWrap: {
    paddingHorizontal: 18,
    marginTop: 18,
  },

  /* Waiting Card (Matching Screenshot 2) */
  waitingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 44,
    paddingHorizontal: 26,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    marginBottom: 24,
  },
  boxCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E6F4EA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  waitingTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  waitingSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 10,
  },

  /* Active Rx Styles */
  rxHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  tokenBox: {
    backgroundColor: '#E6F4EA',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  tokenLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#2E7D52',
  },
  tokenNumber: {
    fontSize: 18,
    fontWeight: '900',
    color: '#2E7D52',
  },
  patientName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  patientMeta: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  doctorMeta: {
    fontSize: 11,
    color: '#2E7D52',
    fontWeight: '600',
    marginTop: 1,
  },
  checkHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  medCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    width: '100%',
  },
  medCheckRowChecked: {
    backgroundColor: '#E6F4EA',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#2E7D52',
    borderColor: '#2E7D52',
  },
  medDrug: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  medDose: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  dispenseActionBtn: {
    backgroundColor: '#2E7D52',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    width: '100%',
    marginTop: 10,
  },
  dispenseActionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },

  /* Bottom End Shift Button */
  bottomEndShiftBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    marginTop: 8,
  },
  bottomEndShiftText: {
    color: '#B91C1C',
    fontSize: 15,
    fontWeight: '800',
  },
});
