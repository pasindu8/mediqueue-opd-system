import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
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
import {
  getPatientAppointmentDetails,
  updateAppointment,
  deleteAppointment,
} from '../../services/appointmentsService';

const PRIMARY_GREEN = '#0E6649';
const MINT_BG = '#E6F4EA';
const SCREEN_BG = '#EDF5FA';

export default function AppointmentsScreen() {
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' | 'history'
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Reschedule Modal State
  const [rescheduleModalVisible, setRescheduleModalVisible] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const storedUserId = await AsyncStorage.getItem('userId');

      const res = await getPatientAppointmentDetails(storedUserId ? storedUserId.trim() : 'demo_user');
      if (res.ok && res.data) {
        const fetched = res.data.appointments || (res.data.appointment ? [res.data.appointment] : []);
        if (Array.isArray(fetched)) {
          const normalized = fetched.map((item, idx) => ({
            _id: item._id || `appt_${idx}`,
            appointmentDate: item.appointmentDate
              ? String(item.appointmentDate).split('T')[0]
              : new Date().toISOString().split('T')[0],
            appointmentTime: item.appointmentTime || '10:00 AM',
            doctorName: item.doctorName || 'Dr. Wijesinghe',
            clinicName: item.clinicName || 'Dental',
            tokenNumber: item.tokenNumber || `A 00${idx + 1}`,
            status: item.status || 'scheduled',
          }));
          setAppointments(normalized);
        }
      }
    } catch (err) {
      console.log('Error fetching appointments from database:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAppointments();
  };

  // Filter based on active tab
  const displayedAppointments = appointments.filter((item) => {
    if (activeTab === 'upcoming') {
      return item.status === 'scheduled';
    } else {
      return item.status === 'completed' || item.status === 'cancelled';
    }
  });

  // Cancel Appointment handler
  const handleCancelAppointment = (item) => {
    Alert.alert(
      'Cancel Appointment',
      `Are you sure you want to cancel your appointment on ${item.appointmentDate}?`,
      [
        { text: 'Keep Appointment', style: 'cancel' },
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              // Update status to 'cancelled' so it moves to History
              const updated = appointments.map((a) =>
                a._id === item._id ? { ...a, status: 'cancelled' } : a
              );
              setAppointments(updated);
              await AsyncStorage.setItem('mediqueue_local_appointments', JSON.stringify(updated));

              // Call backend API to delete from MongoDB
              if (item._id) {
                deleteAppointment(item._id).catch(() => {});
              }

              Alert.alert('Appointment Cancelled', 'This appointment has been moved to your History.');
            } catch (err) {
              Alert.alert('Error', 'Unable to cancel appointment at this time.');
            }
          },
        },
      ]
    );
  };

  // Open Reschedule Modal
  const openRescheduleModal = (item) => {
    setSelectedAppointment(item);
    setNewDate(item.appointmentDate || '2026-09-10');
    setNewTime(item.appointmentTime || '10:00 AM');
    setRescheduleModalVisible(true);
  };

  // Save Reschedule changes
  const handleSaveReschedule = async () => {
    if (!newDate.trim() || !newTime.trim()) {
      Alert.alert('Required', 'Please enter a valid appointment date and time.');
      return;
    }

    try {
      setUpdating(true);
      const updated = appointments.map((a) => {
        if (a._id === selectedAppointment._id) {
          return {
            ...a,
            appointmentDate: newDate.trim(),
            appointmentTime: newTime.trim(),
          };
        }
        return a;
      });

      setAppointments(updated);
      await AsyncStorage.setItem('mediqueue_local_appointments', JSON.stringify(updated));

      // Call backend API if real ID
      if (selectedAppointment._id && !selectedAppointment._id.startsWith('default_')) {
        updateAppointment(selectedAppointment._id, newDate.trim(), newTime.trim()).catch(() => {});
      }

      setRescheduleModalVisible(false);
      Alert.alert('Rescheduled', `Appointment has been rescheduled to ${newDate.trim()} at ${newTime.trim()}.`);
    } catch (err) {
      Alert.alert('Error', 'Unable to reschedule appointment.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY_GREEN} />

      {/* ============================================================== */}
      {/* 1. GREEN CURVED HERO HEADER (WhatsApp Image 2026-09-17)        */}
      {/* ============================================================== */}
      <View style={styles.heroHeader}>
        <Text style={styles.heroHeaderTitle}>Appointments</Text>
      </View>

      {/* ============================================================== */}
      {/* 2. TAB SELECTOR: Upcoming | History                            */}
      {/* ============================================================== */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={styles.tabButton}
          onPress={() => setActiveTab('upcoming')}
          activeOpacity={0.75}
        >
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.tabTextActive]}>
            Upcoming
          </Text>
          {activeTab === 'upcoming' && <View style={styles.activeTabIndicator} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabButton}
          onPress={() => setActiveTab('history')}
          activeOpacity={0.75}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
            History
          </Text>
          {activeTab === 'history' && <View style={styles.activeTabIndicator} />}
        </TouchableOpacity>
      </View>

      {/* ============================================================== */}
      {/* 3. APPOINTMENTS LIST                                           */}
      {/* ============================================================== */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={PRIMARY_GREEN}
          />
        }
      >
        {displayedAppointments.length > 0 ? (
          displayedAppointments.map((item) => (
            <View key={item._id} style={styles.appointmentCard}>
              {/* Top Mint Date Banner (Screenshot: 2026-08-30) */}
              <View style={styles.dateBanner}>
                <Ionicons name="calendar-outline" size={18} color={PRIMARY_GREEN} style={styles.dateIcon} />
                <Text style={styles.dateText}>{item.appointmentDate}</Text>
                {item.status === 'cancelled' && (
                  <View style={styles.cancelledBadge}>
                    <Text style={styles.cancelledBadgeText}>Cancelled</Text>
                  </View>
                )}
              </View>

              {/* Card Body: Time, Doctor, Clinic */}
              <View style={styles.cardBody}>
                <View style={styles.infoRow}>
                  <Ionicons name="time-outline" size={17} color="#64748B" style={styles.infoIcon} />
                  <Text style={styles.infoLabel}>Time: </Text>
                  <Text style={styles.infoValue}>{item.appointmentTime}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Ionicons name="person-outline" size={17} color="#64748B" style={styles.infoIcon} />
                  <Text style={styles.infoLabel}>Doctor: </Text>
                  <Text style={styles.infoValue}>{item.doctorName || 'Dr. Wijesinghe'}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Ionicons name="business-outline" size={17} color="#64748B" style={styles.infoIcon} />
                  <Text style={styles.infoLabel}>Clinic: </Text>
                  <Text style={styles.infoValue}>{item.clinicName || 'Dental'}</Text>
                </View>
              </View>

              {/* Thin Divider Line */}
              <View style={styles.cardDivider} />

              {/* Card Actions: Reschedule | Cancel */}
              <View style={styles.actionsRow}>
                {activeTab === 'upcoming' ? (
                  <>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      activeOpacity={0.7}
                      onPress={() => openRescheduleModal(item)}
                    >
                      <Text style={styles.rescheduleText}>Reschedule</Text>
                    </TouchableOpacity>

                    <View style={styles.actionDivider} />

                    <TouchableOpacity
                      style={styles.actionBtn}
                      activeOpacity={0.7}
                      onPress={() => handleCancelAppointment(item)}
                    >
                      <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <View style={styles.historyActionRow}>
                    <Text style={styles.historyStatusText}>
                      {item.status === 'cancelled' ? 'Appointment Cancelled' : 'Completed Consultation'}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ))
        ) : (
          /* Empty State */
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={54} color="#94A3B8" />
            <Text style={styles.emptyStateText}>
              {activeTab === 'upcoming'
                ? 'No upcoming appointments found'
                : 'No appointment history found'}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* ============================================================== */}
      {/* 4. FLOATING ACTION BUTTON: + New Token (Screenshot)            */}
      {/* ============================================================== */}
      <TouchableOpacity
        style={styles.fabBtn}
        activeOpacity={0.85}
        onPress={() => router.push('/appointments/NewToken')}
      >
        <Ionicons name="add" size={22} color="#FFFFFF" style={{ marginRight: 6 }} />
        <Text style={styles.fabBtnText}>New Token</Text>
      </TouchableOpacity>

      {/* ============================================================== */}
      {/* 5. RESCHEDULE MODAL                                            */}
      {/* ============================================================== */}
      <Modal
        visible={rescheduleModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setRescheduleModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Reschedule Appointment</Text>
                <Text style={styles.modalSubtitle}>
                  Clinic: {selectedAppointment?.clinicName || 'Dental'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setRescheduleModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>New Date (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.inputBox}
                value={newDate}
                onChangeText={setNewDate}
                placeholder="2026-09-15"
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.inputLabel}>Preferred Time Slot</Text>
              <TextInput
                style={styles.inputBox}
                value={newTime}
                onChangeText={setNewTime}
                placeholder="10:00 AM"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setRescheduleModalVisible(false)}
                disabled={updating}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handleSaveReschedule}
                disabled={updating}
              >
                {updating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalConfirmBtnText}>Save Changes</Text>
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
    backgroundColor: SCREEN_BG,
  },

  /* Hero Header (Green Curved Banner) */
  heroHeader: {
    backgroundColor: PRIMARY_GREEN,
    paddingTop: Platform.OS === 'ios' ? 14 : 20,
    paddingBottom: 22,
    paddingHorizontal: 22,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroHeaderTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },

  /* Tabs Bar */
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    position: 'relative',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: PRIMARY_GREEN,
    fontWeight: '700',
  },
  activeTabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 20,
    right: 20,
    height: 3,
    backgroundColor: PRIMARY_GREEN,
    borderRadius: 2,
  },

  /* Scrollable List */
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 110,
  },

  /* Appointment Card */
  appointmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  dateBanner: {
    backgroundColor: MINT_BG,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateIcon: {
    marginRight: 8,
  },
  dateText: {
    fontSize: 15,
    fontWeight: '800',
    color: PRIMARY_GREEN,
    flex: 1,
  },
  cancelledBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  cancelledBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },

  /* Card Body */
  cardBody: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    marginRight: 8,
    width: 20,
  },
  infoLabel: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '600',
    marginRight: 4,
  },
  infoValue: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '700',
  },

  /* Divider */
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },

  /* Actions Row */
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 12,
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  rescheduleText: {
    fontSize: 14,
    fontWeight: '700',
    color: PRIMARY_GREEN,
  },
  actionDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#E2E8F0',
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
  },
  historyActionRow: {
    paddingVertical: 4,
    alignItems: 'center',
  },
  historyStatusText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },

  /* Empty State */
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 12,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
  },

  /* Floating Action Button (+ New Token) */
  fabBtn: {
    position: 'absolute',
    bottom: 24,
    right: 18,
    backgroundColor: PRIMARY_GREEN,
    borderRadius: 24,
    paddingVertical: 13,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    zIndex: 999,
  },
  fabBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },

  /* Reschedule Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 22,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 13,
    color: PRIMARY_GREEN,
    fontWeight: '700',
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  modalBody: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
    marginTop: 10,
  },
  inputBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: '#0F172A',
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
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
    borderRadius: 12,
    backgroundColor: PRIMARY_GREEN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});