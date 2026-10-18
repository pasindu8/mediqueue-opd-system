import React, { useState, useEffect, useCallback } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  Modal,
  TextInput,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from 'expo-speech';
import {
  getPatientAppointmentDetails,
  joinLiveQueue,
  updateQueueSymptoms,
  cancelQueueToken,
  snoozeQueueToken,
} from '../../services/appointmentsService';

export default function LiveQueueScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeAppointment, setActiveAppointment] = useState(null);

  // Modals state for CRUD
  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [joinClinic, setJoinClinic] = useState('General OPD Clinic');
  const [joinSymptoms, setJoinSymptoms] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editSymptoms, setEditSymptoms] = useState('');

  // 1. Smart Queue Snooze / Turn Delay state (User Control & Freedom)
  const [snoozeLoading, setSnoozeLoading] = useState(false);

  // 2. Multi-Lingual Voice Paging state (Accessibility for Elderly)
  const [speechLang, setSpeechLang] = useState('en'); // 'en' | 'si'
  const [voiceAlertsEnabled, setVoiceAlertsEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const fetchLiveQueueData = useCallback(async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        setLoading(false);
        return;
      }

      const response = await getPatientAppointmentDetails(userId.trim());

      if (response.ok && response.data) {
        const appt = response.data.appointment || (Array.isArray(response.data) ? response.data[0] : null);
        setActiveAppointment(appt);
      } else {
        setActiveAppointment(null);
      }
    } catch (error) {
      console.error('Error fetching live queue:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveQueueData();
    const interval = setInterval(fetchLiveQueueData, 4000);
    return () => clearInterval(interval);
  }, [fetchLiveQueueData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLiveQueueData();
  };

  const handleJoinQueue = async () => {
    if (!joinSymptoms.trim()) {
      Alert.alert('Required Information', 'Please describe your main symptom or reason for OPD visit.');
      return;
    }
    try {
      setIsSubmitting(true);
      const userId = await AsyncStorage.getItem('userId');
      const patientId = await AsyncStorage.getItem('patientId');
      const hospitalId = activeAppointment?.hospitalId || null;

      const res = await joinLiveQueue(
        userId ? userId.trim() : null,
        patientId ? patientId.trim() : null,
        hospitalId,
        joinClinic.trim(),
        joinSymptoms.trim()
      );

      if (res.ok) {
        Alert.alert('Checked In Successfully', `Your Queue Token: ${res.data.tokenNumber || ''}`);
        setJoinModalVisible(false);
        setJoinSymptoms('');
        fetchLiveQueueData();
      } else {
        Alert.alert('Error', res.data?.message || 'Failed to check in to queue.');
      }
    } catch (err) {
      console.error('Error joining live queue:', err);
      Alert.alert('Error', 'Unable to check in to live queue.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditSymptomsModal = () => {
    const currentReason = activeAppointment?.service?.replace('Consultation: ', '') || '';
    setEditSymptoms(currentReason);
    setEditModalVisible(true);
  };

  const handleUpdateSymptoms = async () => {
    if (!editSymptoms.trim()) {
      Alert.alert('Validation Error', 'Please enter your updated symptoms.');
      return;
    }
    try {
      setIsSubmitting(true);
      const res = await updateQueueSymptoms(
        activeAppointment._id,
        activeAppointment.tokenNumber,
        editSymptoms.trim()
      );

      if (res.ok) {
        Alert.alert('Updated', 'Consultation symptoms updated for your queue ticket.');
        setEditModalVisible(false);
        fetchLiveQueueData();
      } else {
        Alert.alert('Error', res.data?.message || 'Failed to update symptoms.');
      }
    } catch (err) {
      console.error('Error updating symptoms:', err);
      Alert.alert('Error', 'Unable to update consultation symptoms.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLeaveQueue = () => {
    Alert.alert(
      'Leave Live Queue',
      `Are you sure you want to cancel token ${activeAppointment?.tokenNumber || ''} and exit the queue?`,
      [
        { text: 'No, Keep Place', style: 'cancel' },
        {
          text: 'Yes, Leave Queue',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const res = await cancelQueueToken(
                activeAppointment._id,
                activeAppointment.tokenNumber
              );
              if (res.ok) {
                Alert.alert('Queue Exited', 'You have successfully left the queue.');
                fetchLiveQueueData();
              } else {
                Alert.alert('Error', res.data?.message || 'Failed to cancel queue ticket.');
              }
            } catch (err) {
              console.error('Error leaving queue:', err);
              Alert.alert('Error', 'Unable to exit queue.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // 1. SMART QUEUE SNOOZE (User Control & Freedom - Nielsen Heuristic #3)
  const handleDelayQueue = async (positions = 2) => {
    if (!activeAppointment) return;

    Alert.alert(
      'Hold / Delay My Turn',
      `Move your token back by ${positions} spots in the queue? This gives you approx. ${positions * 7} extra minutes if you are delayed or need to step away.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: `Delay ${positions} Turns`,
          onPress: async () => {
            try {
              setSnoozeLoading(true);
              const res = await snoozeQueueToken(
                activeAppointment._id,
                activeAppointment.tokenNumber,
                positions
              );

              if (res.ok) {
                const addedMins = positions * 7;
                Alert.alert(
                  'Turn Delayed Successfully',
                  `Your token was moved back by ${positions} spots. You now have ~${addedMins} extra minutes before consultation.`
                );
                setActiveAppointment((prev) =>
                  prev
                    ? {
                        ...prev,
                        snoozeCount: (prev.snoozeCount || 0) + 1,
                        delayMinutes: (prev.delayMinutes || 0) + addedMins,
                        service: prev.service?.includes('[Delayed]')
                          ? prev.service
                          : `${prev.service || ''} [Delayed by ${positions} turns]`,
                      }
                    : prev
                );
                fetchLiveQueueData();
              } else {
                Alert.alert('Error', res.data?.message || 'Failed to delay queue turn.');
              }
            } catch (err) {
              console.error('Error delaying queue:', err);
              Alert.alert('Error', 'Unable to delay queue turn.');
            } finally {
              setSnoozeLoading(false);
            }
          },
        },
      ]
    );
  };

  // 2. MULTI-LINGUAL VOICE PAGING (Accessibility for Elderly & Illiterate)
  const handlePlayVoiceAnnouncement = async () => {
    if (!activeAppointment) return;
    const token = activeAppointment.tokenNumber || 'A 001';
    const room = activeAppointment.roomNumber || 'Room 03';

    const textToSpeak =
      speechLang === 'si'
        ? `ටෝකන් අංක ${token}, කරුණාකර ${room} වෙත පිවිසෙන්න.`
        : `Token number ${token}, please proceed to ${room}.`;

    try {
      setIsSpeaking(true);
      if (Speech && typeof Speech.speak === 'function') {
        Speech.stop();
        Speech.speak(textToSpeak, {
          language: speechLang === 'si' ? 'si-LK' : 'en-US',
          pitch: 1.0,
          rate: 0.85,
          onDone: () => setIsSpeaking(false),
          onError: () => setIsSpeaking(false),
        });
        return;
      }
    } catch (err) {
      console.log('Expo Speech error, trying browser speech:', err);
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.lang = speechLang === 'si' ? 'si-LK' : 'en-US';
        utterance.rate = 0.85;
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.log('Browser speech synthesis error:', e);
        setIsSpeaking(false);
      }
    } else {
      setIsSpeaking(false);
    }
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#0B5338" />
        <Text style={{ marginTop: 10, color: '#64748B' }}>Connecting to Live Hospital Queue...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* 1. Top Header */}
      <View style={styles.headerContainer}>
        <View>
          <Text style={styles.subHeaderTitle}>REAL-TIME OPD TRACKER</Text>
          <Text style={styles.mainHeaderTitle}>LIVE QUEUE</Text>
        </View>
        <TouchableOpacity
          style={styles.notificationButton}
          activeOpacity={0.8}
          onPress={() => router.push('/appointments/QrScan')}
        >
          <Ionicons name="qr-code-outline" size={20} color="#0B5338" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0B5338']} />
        }
      >
        {activeAppointment ? (
          <>
            {/* 2. Circular Queue Status Dial */}
            <View style={styles.dialContainer}>
              <View style={styles.outerRing}>
                <View style={styles.innerDial}>
                  <Text style={styles.dialTokenTitle}>YOUR ACTIVE TOKEN</Text>
                  <Text style={styles.dialTokenNumber}>
                    {activeAppointment.tokenNumber || 'A 001'}
                  </Text>

                  <View style={styles.dialStatusRow}>
                    <View
                      style={[
                        styles.greenDot,
                        activeAppointment.status === 'completed' && { backgroundColor: '#2563EB' },
                      ]}
                    />
                    <Text style={styles.dialWaitText}>
                      {activeAppointment.status === 'completed'
                        ? ' Consultation Completed'
                        : ' Waiting in Queue'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* 3. Now Calling & Destination Card */}
            <View style={styles.nowCallingCard}>
              <View>
                <View style={styles.rowCentered}>
                  <View style={styles.smallGreenDot} />
                  <Text style={styles.nowCallingCardLabel}>CLINIC & DOCTOR</Text>
                </View>
                <Text style={styles.nowCallingCardNumber}>
                  {activeAppointment.clinicName || 'General OPD Clinic'}
                </Text>
                <Text style={styles.hospitalSubText}>
                  {activeAppointment.hospitalName || 'District General Hospital - Kalutara'}
                </Text>
              </View>
              <View style={styles.roomContainerRight}>
                <Text style={styles.roomLabelText}>DESK / ROOM</Text>
                <Text style={styles.roomNumberText}>
                  {activeAppointment.roomNumber || 'Room 03'}
                </Text>
              </View>
            </View>

            {/* 4. Queue Progress Section */}
            <View style={styles.progressSectionCard}>
              <View style={styles.progressHeaderRow}>
                <Text style={styles.progressTitle}>Queue Status</Text>
                <Text style={styles.progressServedText}>
                  {activeAppointment.status === 'completed' ? 'Done' : 'Serving Today'}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Appointment Date</Text>
                <Text style={styles.infoValue}>
                  {activeAppointment.appointmentDate
                    ? new Date(activeAppointment.appointmentDate).toLocaleDateString('en-GB')
                    : 'Today'}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Check-in Time</Text>
                <Text style={styles.infoValue}>
                  {activeAppointment.appointmentTime || 'Morning OPD'}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Current Status</Text>
                <Text
                  style={[
                    styles.infoValue,
                    {
                      color:
                        activeAppointment.status === 'completed' ? '#2563EB' : '#0B5338',
                      fontWeight: '800',
                    },
                  ]}
                >
                  {activeAppointment.status === 'completed' ? 'Completed' : 'Scheduled & Active'}
                </Text>
              </View>
            </View>

            {/* 5. Next Steps Guidance */}
            <View style={styles.estimatedCard}>
              <View style={styles.clockIconContainer}>
                <Ionicons
                  name={activeAppointment.status === 'completed' ? 'checkmark-circle' : 'time-outline'}
                  size={24}
                  color="#2563EB"
                />
              </View>
              <View style={styles.estimatedTextContainer}>
                <Text style={styles.estWaitLabel}>Instructions</Text>
                <Text style={styles.estWaitTime}>
                  {activeAppointment.status === 'completed'
                    ? 'Check Pharmacy tab for your prescribed medications'
                    : 'Please wait near the clinic waiting area until your token is called'}
                </Text>
              </View>
            </View>

            {/* 6. Multi-Lingual Voice Paging Card (Accessibility for Elderly & Illiterate - NFR02) */}
            <View style={styles.voiceCard}>
              <View style={styles.voiceHeaderRow}>
                <View style={styles.rowCentered}>
                  <View style={styles.voiceIconCircle}>
                    <Ionicons name="volume-high" size={20} color="#0B5338" />
                  </View>
                  <View style={{ marginLeft: 10 }}>
                    <Text style={styles.voiceCardTitle}>Voice Desk Paging</Text>
                    <Text style={styles.voiceCardSubtitle}>Audio call for elderly & vision impaired</Text>
                  </View>
                </View>

                {/* Language Selector: EN / SI */}
                <View style={styles.langSelectorRow}>
                  <TouchableOpacity
                    style={[styles.langChip, speechLang === 'en' && styles.langChipActive]}
                    onPress={() => setSpeechLang('en')}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.langChipText, speechLang === 'en' && styles.langChipTextActive]}>
                      EN
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.langChip, speechLang === 'si' && styles.langChipActive]}
                    onPress={() => setSpeechLang('si')}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.langChipText, speechLang === 'si' && styles.langChipTextActive]}>
                      SI
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Announcement Preview Box */}
              <View style={styles.voicePreviewBox}>
                <Ionicons name="megaphone-outline" size={16} color="#0E6649" style={{ marginRight: 6 }} />
                <Text style={styles.voicePreviewText} numberOfLines={2}>
                  {speechLang === 'si'
                    ? `« ටෝකන් අංක ${activeAppointment.tokenNumber || 'A 001'}, කරුණාකර ${activeAppointment.roomNumber || 'Room 03'} වෙත පිවිසෙන්න. »`
                    : `« Token number ${activeAppointment.tokenNumber || 'A 001'}, please proceed to ${activeAppointment.roomNumber || 'Room 03'}. »`}
                </Text>
              </View>

              {/* Audio Controls */}
              <View style={styles.voiceControlsRow}>
                <TouchableOpacity
                  style={[styles.speakButton, isSpeaking && styles.speakButtonActive]}
                  onPress={handlePlayVoiceAnnouncement}
                  activeOpacity={0.85}
                  disabled={isSpeaking}
                >
                  <Ionicons
                    name={isSpeaking ? 'radio' : 'volume-medium'}
                    size={18}
                    color="#FFFFFF"
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.speakButtonText}>
                    {isSpeaking ? 'Announcing Now...' : 'Listen to Desk Call'}
                  </Text>
                </TouchableOpacity>

                <View style={styles.voiceToggleContainer}>
                  <Text style={styles.voiceToggleLabel}>Sound Alert</Text>
                  <Switch
                    value={voiceAlertsEnabled}
                    onValueChange={setVoiceAlertsEnabled}
                    trackColor={{ false: '#CBD5E1', true: '#A7F3D0' }}
                    thumbColor={voiceAlertsEnabled ? '#0E6649' : '#F1F5F9'}
                  />
                </View>
              </View>
            </View>

            {/* 7. Smart Queue Delay Status Banner (If Snoozed) */}
            {(activeAppointment.snoozeCount > 0 || activeAppointment.delayMinutes > 0) && (
              <View style={styles.delayedNoticeBanner}>
                <Ionicons name="time" size={18} color="#D97706" style={{ marginRight: 8 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.delayedNoticeTitle}>Turn Delayed by Patient Choice</Text>
                  <Text style={styles.delayedNoticeText}>
                    Moved back {activeAppointment.snoozeCount ? activeAppointment.snoozeCount * 2 : 2} turns (+{activeAppointment.delayMinutes || 14} mins buffer).
                  </Text>
                </View>
              </View>
            )}

            {/* 8. Live Queue Action Buttons (CRUD + User Control) */}
            <View style={styles.queueActionsContainer}>
              {/* Snooze Turn Button (User Control & Freedom - Nielsen Heuristic #3) */}
              <TouchableOpacity
                style={styles.queueActionBtnSnooze}
                activeOpacity={0.85}
                onPress={() => handleDelayQueue(2)}
                disabled={snoozeLoading}
              >
                <Ionicons name="pause-circle-outline" size={18} color="#0B5338" style={{ marginRight: 6 }} />
                <Text style={styles.queueActionBtnTextSnooze}>
                  {snoozeLoading ? 'Holding Turn...' : 'Delay 2 Turns (+14 Mins)'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.queueActionBtnPrimary}
                activeOpacity={0.8}
                onPress={openEditSymptomsModal}
              >
                <Ionicons name="create-outline" size={17} color="#0B5338" style={{ marginRight: 6 }} />
                <Text style={styles.queueActionBtnTextPrimary}>Update Symptoms / Notes</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.queueActionBtnDanger}
                activeOpacity={0.8}
                onPress={handleLeaveQueue}
              >
                <Ionicons name="exit-outline" size={17} color="#DC2626" style={{ marginRight: 6 }} />
                <Text style={styles.queueActionBtnTextDanger}>Leave Queue / Cancel Ticket</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          /* Empty State when no appointment in queue */
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="people-outline" size={44} color="#0B5338" />
            </View>
            <Text style={styles.emptyTitle}>No Active Appointments in Queue</Text>
            <Text style={styles.emptySubtitle}>
              You do not have any active appointments in the hospital queue today.
            </Text>

            {/* Join Queue Button (Create) */}
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#0D9488', marginBottom: 12 }]}
              activeOpacity={0.85}
              onPress={() => setJoinModalVisible(true)}
            >
              <Ionicons name="enter-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.actionBtnText}>Check-in to Live Queue Now</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              activeOpacity={0.85}
              onPress={() => router.push('/appointments/QrScan')}
            >
              <Ionicons name="qr-code-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.actionBtnText}>Scan Desk QR at Hospital</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.secondaryBtn]}
              activeOpacity={0.85}
              onPress={() => router.push('/appointments/NewToken')}
            >
              <Ionicons name="calendar-outline" size={20} color="#0B5338" style={{ marginRight: 8 }} />
              <Text style={styles.secondaryBtnText}>Book Appointment Token</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Modal 1: Join Live Queue (Create) */}
      <Modal
        visible={joinModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setJoinModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Join Live OPD Queue</Text>
              <TouchableOpacity onPress={() => setJoinModalVisible(false)}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalFieldLabel}>Clinic Department</Text>
            <TextInput
              style={styles.modalInput}
              value={joinClinic}
              onChangeText={setJoinClinic}
              placeholder="General OPD Clinic"
              placeholderTextColor="#94A3B8"
            />

            <Text style={styles.modalFieldLabel}>Reason for Visit / Symptoms</Text>
            <TextInput
              style={[styles.modalInput, { height: 75, textAlignVertical: 'top' }]}
              value={joinSymptoms}
              onChangeText={setJoinSymptoms}
              placeholder="e.g. Mild fever, dry cough, headache for 2 days"
              placeholderTextColor="#94A3B8"
              multiline
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setJoinModalVisible(false)}
                disabled={isSubmitting}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handleJoinQueue}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalConfirmBtnText}>Get Queue Token</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal 2: Edit Symptoms (Update) */}
      <Modal
        visible={editModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Symptoms / Notes</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalFieldLabel}>Current Symptoms for Doctor</Text>
            <TextInput
              style={[styles.modalInput, { height: 90, textAlignVertical: 'top' }]}
              value={editSymptoms}
              onChangeText={setEditSymptoms}
              placeholder="Update your symptoms or health complaint"
              placeholderTextColor="#94A3B8"
              multiline
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setEditModalVisible(false)}
                disabled={isSubmitting}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handleUpdateSymptoms}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalConfirmBtnText}>Save Updates</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  subHeaderTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#00C853',
    letterSpacing: 1,
  },
  mainHeaderTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  notificationButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 130,
  },
  dialContainer: {
    alignItems: 'center',
    marginVertical: 15,
  },
  outerRing: {
    width: 250,
    height: 250,
    borderRadius: 125,
    borderWidth: 6,
    borderColor: '#E2F8EE',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3FCF7',
  },
  innerDial: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialTokenTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
    letterSpacing: 0.5,
  },
  dialTokenNumber: {
    fontSize: 48,
    fontWeight: '900',
    color: '#0F172A',
    marginVertical: 2,
  },
  dialStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00C853',
  },
  dialWaitText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  nowCallingCard: {
    backgroundColor: '#0B5338',
    borderRadius: 18,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  rowCentered: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  smallGreenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00C853',
    marginRight: 6,
  },
  nowCallingCardLabel: {
    fontSize: 11,
    color: '#A7F3D0',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  nowCallingCardNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  hospitalSubText: {
    fontSize: 11.5,
    color: '#E2E8F0',
    marginTop: 2,
    maxWidth: 200,
  },
  roomContainerRight: {
    alignItems: 'flex-end',
  },
  roomLabelText: {
    fontSize: 11,
    color: '#A7F3D0',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  roomNumberText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  progressSectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  progressServedText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0B5338',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  infoLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  estimatedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clockIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  estimatedTextContainer: {
    flex: 1,
  },
  estWaitLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#2563EB',
    textTransform: 'uppercase',
  },
  estWaitTime: {
    fontSize: 13,
    color: '#475569',
    marginTop: 2,
    lineHeight: 18,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E6F4EA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13.5,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    maxWidth: 290,
  },
  actionBtn: {
    backgroundColor: '#0B5338',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    marginBottom: 12,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryBtn: {
    backgroundColor: '#E6F4EA',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  secondaryBtnText: {
    color: '#0B5338',
    fontSize: 14,
    fontWeight: '700',
  },
  voiceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  voiceHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  voiceIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E2F8EE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  voiceCardSubtitle: {
    fontSize: 11,
    color: '#64748B',
  },
  langSelectorRow: {
    flexDirection: 'row',
    gap: 6,
  },
  langChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  langChipActive: {
    backgroundColor: '#0E6649',
  },
  langChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  langChipTextActive: {
    color: '#FFFFFF',
  },
  voicePreviewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
    borderLeftWidth: 3,
    borderLeftColor: '#0D9488',
  },
  voicePreviewText: {
    flex: 1,
    fontSize: 12.5,
    color: '#334155',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  voiceControlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  speakButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0E6649',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    shadowColor: '#0E6649',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  speakButtonActive: {
    backgroundColor: '#0D9488',
  },
  speakButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  voiceToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  voiceToggleLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  delayedNoticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  delayedNoticeTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#92400E',
  },
  delayedNoticeText: {
    fontSize: 11.5,
    color: '#B45309',
    marginTop: 2,
  },
  queueActionsContainer: {
    marginTop: 14,
    gap: 10,
  },
  queueActionBtnSnooze: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E2F8EE',
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    borderRadius: 12,
    paddingVertical: 13,
  },
  queueActionBtnTextSnooze: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0B5338',
  },
  queueActionBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E6F4EA',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingVertical: 13,
    borderRadius: 12,
  },
  queueActionBtnTextPrimary: {
    color: '#0B5338',
    fontSize: 14,
    fontWeight: '700',
  },
  queueActionBtnDanger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingVertical: 13,
    borderRadius: 12,
  },
  queueActionBtnTextDanger: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalFieldLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
    marginTop: 10,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  modalConfirmBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 10,
    backgroundColor: '#0B5338',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});