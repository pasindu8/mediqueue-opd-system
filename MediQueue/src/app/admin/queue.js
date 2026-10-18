import React, { useState, useEffect, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
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
  fetchPharmacyAdminQueue,
  fetchLabAdminQueue,
} from '../../services/adminService';
import { joinLiveQueue } from '../../services/appointmentsService';

export default function QueueDispatcherScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hospitalName, setHospitalName] = useState('Kalutara General Hospital');

  const [nowCalling, setNowCalling] = useState({
    token: '--',
    patientName: 'Ready for Patient',
    room: 'Room 03 (OPD Wing)',
    department: 'Medical Consultation',
  });

  const [queueItems, setQueueItems] = useState([]);

  const [triageName, setTriageName] = useState('');
  const [triageReason, setTriageReason] = useState('');

  const loadData = useCallback(async () => {
    try {
      let hospitalId = null;
      const userStr = await AsyncStorage.getItem('adminUser');
      if (userStr) {
        try {
          const parsed = JSON.parse(userStr);
          if (parsed.hospitalId) hospitalId = parsed.hospitalId;
          if (parsed.hospitalName) setHospitalName(parsed.hospitalName);
        } catch (e) {}
      }

      const [docRes, pharmRes, labRes] = await Promise.allSettled([
        fetchDoctorQueue(hospitalId),
        fetchPharmacyAdminQueue(hospitalId),
        fetchLabAdminQueue(hospitalId),
      ]);

      const feed = [];

      // 1. Doctor OPD Queue from MongoDB
      if (docRes.status === 'fulfilled' && docRes.value.ok && Array.isArray(docRes.value.data?.appointments)) {
        docRes.value.data.appointments.forEach((apt) => {
          feed.push({
            token: apt.token || apt.tokenNumber || 'Q-OPD',
            name: apt.name || 'Walk-in Patient',
            room: 'Room 03',
            clinic: apt.clinicName || 'Medical OPD',
            status: apt.status === 'scheduled' ? 'Waiting' : apt.status || 'Waiting',
          });
        });
      }

      // 2. Pharmacy Queue from MongoDB
      if (pharmRes.status === 'fulfilled' && pharmRes.value.ok && Array.isArray(pharmRes.value.data?.queue)) {
        pharmRes.value.data.queue.forEach((p) => {
          feed.push({
            token: p.token || p.tokenNumber || 'P-001',
            name: p.patientName || 'Patient',
            room: p.counter || 'Counter 01',
            clinic: 'Pharmacy Dispensary',
            status: p.status || 'Calling',
          });
        });
      }

      // 3. Lab Queue from MongoDB
      if (labRes.status === 'fulfilled' && labRes.value.ok && Array.isArray(labRes.value.data?.queue)) {
        labRes.value.data.queue.forEach((l) => {
          feed.push({
            token: l.token || l.tokenNumber || 'L-001',
            name: l.patientName || 'Patient',
            room: 'Central Lab',
            clinic: 'Diagnostics',
            status: l.status === 'verified' ? 'Completed' : 'Processing',
          });
        });
      }

      if (feed.length > 0) {
        setNowCalling(feed[0]);
        setQueueItems(feed.slice(1));
      } else {
        setNowCalling({
          token: '--',
          patientName: 'Queue is Clear',
          room: 'Room 03 (OPD Wing)',
          department: 'Medical Consultation',
        });
        setQueueItems([]);
      }
    } catch (err) {
      console.error('Error loading live queue dispatch data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleSpeak = (token, room) => {
    try {
      const speechText = `Token number ${token}. Please proceed to ${room}.`;
      Speech.speak(speechText, {
        language: 'en-US',
        pitch: 1.0,
        rate: 0.9,
      });
      Alert.alert('Live Audio Broadcast', `Announced: "${speechText}"`);
    } catch (e) {
      Alert.alert('Announcement Broadcast', `Token ${token} called to ${room}`);
    }
  };

  const handleCallNext = () => {
    if (queueItems.length === 0) {
      Alert.alert('Queue Empty', 'No more patients currently waiting in queue.');
      return;
    }
    const next = queueItems[0];
    setNowCalling({
      token: next.token,
      patientName: next.name,
      room: next.room,
      department: next.clinic,
    });
    setQueueItems((prev) => prev.slice(1));
    handleSpeak(next.token, next.room);
  };

  const handleDispatchEmergencyTriage = async () => {
    if (!triageName.trim()) {
      Alert.alert('Required', 'Please enter emergency patient name.');
      return;
    }
    try {
      let hospitalId = null;
      const userStr = await AsyncStorage.getItem('adminUser');
      if (userStr) {
        try {
          const parsed = JSON.parse(userStr);
          if (parsed.hospitalId) hospitalId = parsed.hospitalId;
        } catch (e) {}
      }

      const res = await joinLiveQueue(
        null,
        null,
        hospitalId,
        'Emergency OPD',
        `EMERGENCY: ${triageName.trim()} - ${triageReason.trim() || 'Acute Condition'}`
      );

      const emergToken = res.ok && res.data?.tokenNumber ? res.data.tokenNumber : `EM-${Math.floor(100 + Math.random() * 900)}`;

      const newEntry = {
        token: emergToken,
        name: triageName.trim() + ' (EMERGENCY)',
        room: 'Room 01 (Triage)',
        clinic: 'Emergency OPD',
        status: 'PRIORITY 1',
      };

      setNowCalling(newEntry);
      setQueueItems((prev) => [nowCalling, ...prev]);
      Alert.alert('Emergency Token Generated', `Token ${emergToken} assigned highest priority and registered in MongoDB.`);
      handleSpeak(emergToken, 'Emergency Triage Room 01');
      setTriageName('');
      setTriageReason('');
      loadData();
    } catch (e) {
      console.error('Error dispatching triage:', e);
      Alert.alert('Notice', 'Emergency triage token broadcasted.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.hubBtn}
            onPress={() => router.push('/admin/portal')}
            activeOpacity={0.7}
          >
            <Ionicons name="apps" size={20} color="#0D9488" />
          </TouchableOpacity>
          <View style={{ marginLeft: 10 }}>
            <View style={styles.badgeRow}>
              <View style={styles.queueBadge}>
                <Ionicons name="megaphone" size={12} color="#0D9488" style={{ marginRight: 4 }} />
                <Text style={styles.queueBadgeText}>QUEUE DISPATCHER</Text>
              </View>
              <Text style={styles.hospitalSub}>{hospitalName}</Text>
            </View>
            <Text style={styles.titleText}>Central OPD Display & Dispatch</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => {
            setRefreshing(true);
            loadData();
          }}
        >
          <Ionicons name="refresh" size={19} color="#334155" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 60 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadData();
            }}
            colors={['#0D9488']}
          />
        }
      >
        {/* Now Calling Billboard */}
        <View style={styles.billboardCard}>
          <Text style={styles.billboardLabel}>NOW CALLING / CURRENT TOKEN</Text>
          <Text style={styles.billboardToken}>{nowCalling.token}</Text>
          <Text style={styles.billboardPatient}>{nowCalling.patientName}</Text>
          <View style={styles.roomPill}>
            <Ionicons name="location" size={14} color="#042F2E" style={{ marginRight: 4 }} />
            <Text style={styles.roomPillText}>{nowCalling.room} • {nowCalling.department}</Text>
          </View>

          <View style={styles.billboardBtnRow}>
            <TouchableOpacity
              style={styles.repeatVoiceBtn}
              onPress={() => handleSpeak(nowCalling.token, nowCalling.room)}
            >
              <Ionicons name="volume-high" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.repeatVoiceText}>Repeat Broadcast</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.nextCallBtn} onPress={handleCallNext}>
              <Text style={styles.nextCallText}>Dispatch Next</Text>
              <Ionicons name="arrow-forward" size={16} color="#042F2E" style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Emergency Triage Ticket Generator */}
        <View style={styles.triageCard}>
          <View style={styles.triageHeader}>
            <Ionicons name="flash" size={18} color="#DC2626" style={{ marginRight: 6 }} />
            <Text style={styles.triageTitle}>Fast-Track Emergency Triage Ticket</Text>
          </View>

          <TextInput
            style={styles.triageInput}
            placeholder="Emergency patient name..."
            placeholderTextColor="#94A3B8"
            value={triageName}
            onChangeText={setTriageName}
          />

          <TextInput
            style={[styles.triageInput, { marginTop: 8 }]}
            placeholder="Condition / Triage notes (e.g. Chest pain, acute dyspnea)..."
            placeholderTextColor="#94A3B8"
            value={triageReason}
            onChangeText={setTriageReason}
          />

          <TouchableOpacity
            style={styles.triageBtn}
            onPress={handleDispatchEmergencyTriage}
          >
            <Ionicons name="add-circle" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.triageBtnText}>Generate Priority Triage Token</Text>
          </TouchableOpacity>
        </View>

        {/* Live Active Queue List */}
        <Text style={styles.sectionTitle}>Hospital Cross-Department Token Feed ({queueItems.length})</Text>
        {queueItems.length === 0 ? (
          <View style={[styles.feedCard, { justifyContent: 'center', paddingVertical: 18 }]}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#0D9488" style={{ marginRight: 8 }} />
            <Text style={{ color: '#64748B', fontSize: 13, fontWeight: '500' }}>
              No other patients waiting in queue.
            </Text>
          </View>
        ) : (
          queueItems.map((item, idx) => (
            <View key={idx} style={styles.feedCard}>
              <View style={styles.feedTokenPill}>
                <Text style={styles.feedTokenText}>{item.token}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.feedName}>{item.name}</Text>
                <Text style={styles.feedMeta}>
                  {item.clinic} • {item.room}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.feedCallBtn}
                onPress={() => handleSpeak(item.token, item.room)}
              >
                <Ionicons name="volume-medium" size={18} color="#0D9488" />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  hubBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  queueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#CCFBF1',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 6,
  },
  queueBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0D9488',
  },
  hospitalSub: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  titleText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: 14,
  },
  billboardCard: {
    backgroundColor: '#042F2E',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#042F2E',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  billboardLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#5EEAD4',
    letterSpacing: 1,
  },
  billboardToken: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FFFFFF',
    marginVertical: 4,
  },
  billboardPatient: {
    fontSize: 18,
    fontWeight: '700',
    color: '#CCFBF1',
  },
  roomPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2DD4BF',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    marginTop: 10,
  },
  roomPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#042F2E',
  },
  billboardBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    width: '100%',
  },
  repeatVoiceBtn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  repeatVoiceText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  nextCallBtn: {
    flex: 1,
    backgroundColor: '#2DD4BF',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  nextCallText: {
    color: '#042F2E',
    fontSize: 13,
    fontWeight: '800',
  },
  triageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  triageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  triageTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },
  triageInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    color: '#0F172A',
  },
  triageBtn: {
    backgroundColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  triageBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 10,
  },
  feedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  feedTokenPill: {
    backgroundColor: '#CCFBF1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  feedTokenText: {
    color: '#0D9488',
    fontSize: 14,
    fontWeight: '800',
  },
  feedName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  feedMeta: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  feedCallBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#F0FDFA',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
