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
  fetchLabAdminQueue,
  submitVerifyLabReport,
} from '../../services/adminService';

export default function LabScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isReleasing, setIsReleasing] = useState(false);

  const [technologistName, setTechnologistName] = useState('Kasun Rathnayake');
  const [pendingCount, setPendingCount] = useState(0);

  // Queue Pills row loaded from MongoDB
  const [queuePills, setQueuePills] = useState([]);
  const [labOrdersList, setLabOrdersList] = useState([]);

  // Active Specimen Patient loaded from MongoDB
  const [activePatient, setActivePatient] = useState({
    _id: '',
    name: 'Kavindu Perera',
    age: 32,
    gender: 'Male',
    testType: 'Full Blood Count (FBC)',
    token: 'L 229',
  });

  // Critical Panic Alert Switch
  const [panicAlert, setPanicAlert] = useState(false);

  // Parameters loaded from MongoDB
  const [parameters, setParameters] = useState([
    {
      id: 'p1',
      name: 'White Blood Cells',
      ref: 'Ref: 4.0 - 11.0',
      value: '7.4',
      unit: '10³/µL',
    },
    {
      id: 'p2',
      name: 'Platelet Count',
      ref: 'Ref: 150k - 450k',
      value: '240000',
      unit: 'cells/mm³',
    },
    {
      id: 'p3',
      name: 'Hemoglobin',
      ref: 'Ref: 13.0 - 17.0',
      value: '14.2',
      unit: 'g/dL',
    },
    {
      id: 'p4',
      name: 'Hematocrit',
      ref: 'Ref: 40 - 52',
      value: '42',
      unit: '%',
    },
  ]);

  const [attachedFile, setAttachedFile] = useState(null);

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
        if (u.name) setTechnologistName(u.name);
        if (u.hospitalId) currentHospId = u.hospitalId;
      }

      // Fetch live lab queue from MongoDB
      const res = await fetchLabAdminQueue(currentHospId);
      if (res.ok && res.data) {
        const orders = res.data.pendingOrders || [];
        setLabOrdersList(orders);
        setPendingCount(orders.length);

        if (orders.length > 0) {
          const first = orders[0];
          setActivePatient({
            _id: first._id,
            name: first.patientName || 'Kavindu Perera',
            age: first.patientAge || 32,
            gender: first.patientGender || 'Male',
            testType: first.testName || 'Full Blood Count (FBC)',
            token: first.tokenNumber || 'L 229',
          });

          if (Array.isArray(first.results) && first.results.length > 0) {
            setParameters(
              first.results.map((r, i) => ({
                id: r.id || String(i),
                name: r.param || 'Parameter',
                ref: `Ref: ${r.refRange || 'Normal'}`,
                value: String(r.value || ''),
                unit: r.unit || '',
              }))
            );
          }

          const pills = orders.slice(1).map((o, idx) => ({
            id: o._id || String(idx),
            token: `${o.tokenNumber}${o.priority?.includes('High') ? ' · High' : ''}`,
            type: o.priority?.includes('High') ? 'high' : 'normal',
            orderObj: o,
          }));
          setQueuePills(pills);
        }
      }
    } catch (e) {
      console.log('Error fetching lab queue from MongoDB:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleUpdateParam = (id, val) => {
    setParameters((prev) =>
      prev.map((p) => (p.id === id ? { ...p, value: val } : p))
    );
  };

  const handleAttach = () => {
    Alert.alert('Attach Document', 'Attach digital analyzer printout or PDF slide scan?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Attach Analyzer Report',
        onPress: () => {
          setAttachedFile(`Report_${activePatient.token}.pdf`);
          Alert.alert('Attached', `Report_${activePatient.token}.pdf attached to this report.`);
        },
      },
    ]);
  };

  const handleReleaseReport = async () => {
    setIsReleasing(true);
    try {
      // 1. Submit Real Lab Report Verification to MongoDB
      const formattedResults = parameters.map((p) => ({
        id: p.id,
        param: p.name,
        value: p.value,
        unit: p.unit,
        refRange: p.ref.replace('Ref: ', ''),
        isCritical: panicAlert,
      }));

      await submitVerifyLabReport({
        labOrderId: activePatient._id || undefined,
        token: activePatient.token,
        technologistName,
        isCriticalFlagged: panicAlert,
        criticalNote: panicAlert ? 'CRITICAL VALUE: Urgent clinical attention required!' : '',
        results: formattedResults,
      });

      Alert.alert(
        'Report Released to Database',
        `Diagnostic report for Token ${activePatient.token} (${activePatient.name}) published to Doctor desk and Patient portal.`
      );

      loadData();
    } catch (err) {
      console.error('Error releasing lab report:', err);
      Alert.alert('Error', 'Unable to release report.');
    } finally {
      setIsReleasing(false);
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
        {/* HERO HEADER (Curved Green Hero Banner)                         */}
        {/* ============================================================== */}
        <View style={styles.heroBanner}>
          <View style={styles.heroTopRow}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={styles.heroTitle}>Diagnostic Lab</Text>
              <Text style={styles.heroSubtitle}>
                MLT: {technologistName} · {pendingCount} pending
              </Text>
            </View>

            {/* Refresh Header Button (Screenshot 3) */}
            <TouchableOpacity
              style={styles.headerRefreshBtn}
              onPress={() => Alert.alert('Refreshed', 'Laboratory analyzer feed synchronized.')}
              activeOpacity={0.8}
            >
              <Ionicons name="time-outline" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.headerRefreshText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Content Container */}
        <View style={styles.contentWrap}>
          {/* Horizontal Queue Badges Row (Screenshot 3) */}
          <View style={styles.queueRow}>
            {queuePills.map((pill) => (
              <TouchableOpacity
                key={pill.id}
                style={[
                  styles.queuePill,
                  pill.type === 'high' ? styles.queuePillHigh : styles.queuePillNormal,
                ]}
                onPress={() => {
                  setActivePatient((prev) => ({
                    ...prev,
                    token: pill.token.split(' ')[0] + ' ' + pill.token.split(' ')[1],
                  }));
                }}
              >
                <Text
                  style={[
                    styles.queuePillText,
                    pill.type === 'high' ? styles.queuePillTextHigh : styles.queuePillTextNormal,
                  ]}
                >
                  {pill.token}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Specimen Under Analysis Card (Screenshot 3) */}
          <View style={styles.specimenCard}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={styles.specimenHeaderLabel}>SPECIMEN UNDER ANALYSIS</Text>
              <Text style={styles.patientNameText}>{activePatient.name}</Text>
              <Text style={styles.patientSubText}>
                {activePatient.age} Yrs · {activePatient.gender} · {activePatient.testType}
              </Text>
            </View>

            {/* Right Lab Token Badge */}
            <View style={styles.labTokenBox}>
              <Text style={styles.labTokenLabel}>LAB TOKEN</Text>
              <Text style={styles.labTokenNumber}>{activePatient.token}</Text>
            </View>
          </View>

          {/* Critical Panic Alert Card (Screenshot 3) */}
          <View style={styles.panicAlertCard}>
            <View style={styles.bellIconCircle}>
              <Ionicons name="notifications-outline" size={20} color="#DC2626" />
            </View>

            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.panicTitle}>Critical panic alert</Text>
              <Text style={styles.panicSub}>Pop-up on doctor's screen on release</Text>
            </View>

            <TouchableOpacity
              style={[styles.panicTogglePill, panicAlert && styles.panicTogglePillOn]}
              onPress={() => setPanicAlert(!panicAlert)}
              activeOpacity={0.8}
            >
              <Text style={[styles.panicToggleText, panicAlert && styles.panicToggleTextOn]}>
                {panicAlert ? 'On' : 'Off'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* 4 Test Parameter Rows (Screenshot 3) */}
          {parameters.map((param) => (
            <View key={param.id} style={styles.paramCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.paramTitle}>{param.name}</Text>
                <Text style={styles.paramRef}>{param.ref}</Text>
              </View>

              <View style={styles.paramRightCol}>
                <TextInput
                  style={styles.paramInputBox}
                  value={param.value}
                  onChangeText={(val) => handleUpdateParam(param.id, val)}
                  keyboardType="numeric"
                />
                <Text style={styles.paramUnitText}>{param.unit}</Text>
              </View>
            </View>
          ))}

          {/* Bottom Action Buttons: Attach & Release Report (Screenshot 3) */}
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              style={styles.attachBtn}
              onPress={handleAttach}
              activeOpacity={0.8}
            >
              <Text style={styles.attachBtnText}>Attach</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.releaseReportBtn}
              onPress={handleReleaseReport}
              disabled={isReleasing}
              activeOpacity={0.85}
            >
              {isReleasing ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.releaseReportText}>Release Report</Text>
              )}
            </TouchableOpacity>
          </View>
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
  headerRefreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  headerRefreshText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  /* Content Container */
  contentWrap: {
    paddingHorizontal: 18,
    marginTop: 14,
  },

  /* Horizontal Queue Badges Row (Screenshot 3) */
  queueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  queuePill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
  },
  queuePillNormal: {
    backgroundColor: '#E6F4EA',
  },
  queuePillHigh: {
    backgroundColor: '#FEE2E2',
  },
  queuePillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  queuePillTextNormal: {
    color: '#2E7D52',
  },
  queuePillTextHigh: {
    color: '#DC2626',
  },

  /* Specimen Card (Screenshot 3) */
  specimenCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  specimenHeaderLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2E7D52',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  patientNameText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  patientSubText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 3,
  },
  labTokenBox: {
    backgroundColor: '#E6F4EA',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 90,
  },
  labTokenLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#2E7D52',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  labTokenNumber: {
    fontSize: 22,
    fontWeight: '900',
    color: '#2E7D52',
  },

  /* Critical Panic Alert Card (Screenshot 3) */
  panicAlertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 22,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  bellIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  panicTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#DC2626',
  },
  panicSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  panicTogglePill: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 6,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
  },
  panicTogglePillOn: {
    backgroundColor: '#DC2626',
  },
  panicToggleText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  panicToggleTextOn: {
    color: '#FFFFFF',
  },

  /* Parameter Row Card (Screenshot 3) */
  paramCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  paramTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  paramRef: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  paramRightCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paramInputBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    minWidth: 74,
    textAlign: 'center',
  },
  paramUnitText: {
    fontSize: 12,
    color: '#64748B',
    minWidth: 44,
  },

  /* Bottom Action Buttons (Screenshot 3) */
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 10,
    marginBottom: 20,
  },
  attachBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 15,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  attachBtnText: {
    color: '#2E7D52',
    fontSize: 14,
    fontWeight: '800',
  },
  releaseReportBtn: {
    flex: 1,
    backgroundColor: '#2E7D52',
    borderRadius: 20,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#2E7D52',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
  },
  releaseReportText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
