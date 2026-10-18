import React, { useState, useEffect, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getPatientPrescriptionsAndLabs,
  createRefillRequest,
  updateRefillRequest,
  cancelRefillRequest,
} from '../../services/appointmentsService';
import { BASE_URL } from '../../services/api';

export default function PharmacyLabScreen() {
  const [activeTab, setActiveTab] = useState('pharmacy');
  const [prescriptions, setPrescriptions] = useState([]);
  const [labOrders, setLabOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Refill CRUD Modal States
  const [refillModalVisible, setRefillModalVisible] = useState(false);
  const [medicineName, setMedicineName] = useState('');
  const [dosage, setDosage] = useState('1 Tablet Daily');
  const [instructions, setInstructions] = useState('Take after meals');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editPrescriptionId, setEditPrescriptionId] = useState(null);
  const [editInstructions, setEditInstructions] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const handleDownloadLabReport = async (order) => {
    try {
      if (order.reportFile) {
        let downloadUrl = order.reportFile;
        if (!downloadUrl.startsWith('http')) {
          downloadUrl = `${BASE_URL}${downloadUrl.startsWith('/') ? '' : '/'}${downloadUrl}`;
        }
        await WebBrowser.openBrowserAsync(downloadUrl);
      } else {
        const endpointUrl = `${BASE_URL}/clinical/lab/download-report/${order._id || order.tokenNumber}`;
        const canOpen = await Linking.canOpenURL(endpointUrl);
        if (canOpen) {
          await Linking.openURL(endpointUrl);
        } else {
          await WebBrowser.openBrowserAsync(endpointUrl);
        }
      }
    } catch (e) {
      console.error('Error opening report:', e);
      Alert.alert(
        'Laboratory Report',
        order.reportFile
          ? 'Failed to open the report document on this device.'
          : 'The stamped PDF report has not been uploaded yet. Your verified findings are displayed on this screen.'
      );
    }
  };

  const fetchClinicalData = useCallback(async () => {
    try {
      const storedUserId = await AsyncStorage.getItem('userId');
      const storedPatientId = await AsyncStorage.getItem('patientId');

      if (!storedUserId && !storedPatientId) {
        setLoading(false);
        return;
      }

      const res = await getPatientPrescriptionsAndLabs(
        storedUserId ? storedUserId.trim() : null,
        storedPatientId ? storedPatientId.trim() : null
      );

      if (res.ok && res.data) {
        setPrescriptions(Array.isArray(res.data.prescriptions) ? res.data.prescriptions : []);
        setLabOrders(Array.isArray(res.data.labOrders) ? res.data.labOrders : []);
      }
    } catch (err) {
      console.error('Error fetching patient prescriptions and labs:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchClinicalData();
    // Auto-refresh every 5 seconds for live status updates
    const interval = setInterval(fetchClinicalData, 5000);
    return () => clearInterval(interval);
  }, [fetchClinicalData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchClinicalData();
  };

  const handleCreateRefill = async () => {
    if (!medicineName.trim()) {
      Alert.alert('Required Information', 'Please provide the name of the medicine requested.');
      return;
    }
    try {
      setIsSubmitting(true);
      const userId = await AsyncStorage.getItem('userId');
      const patientId = await AsyncStorage.getItem('patientId');
      const hospitalId = prescriptions[0]?.hospitalId || null;

      const res = await createRefillRequest(
        userId ? userId.trim() : null,
        patientId ? patientId.trim() : null,
        medicineName.trim(),
        dosage.trim(),
        instructions.trim(),
        notes.trim(),
        hospitalId
      );

      if (res.ok) {
        Alert.alert('Refill Requested', 'Your prescription refill request has been submitted to the dispensary.');
        setRefillModalVisible(false);
        setMedicineName('');
        setNotes('');
        fetchClinicalData();
      } else {
        Alert.alert('Error', res.data?.message || 'Failed to submit refill request.');
      }
    } catch (err) {
      console.error('Error creating refill request:', err);
      Alert.alert('Error', 'Unable to request medication refill.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditRefillModal = (prescription) => {
    setEditPrescriptionId(prescription._id);
    setEditInstructions(prescription.medicines?.[0]?.instructions || '');
    setEditNotes(prescription.notes || '');
    setEditModalVisible(true);
  };

  const handleUpdateRefill = async () => {
    try {
      setIsSubmitting(true);
      const res = await updateRefillRequest(
        editPrescriptionId,
        editInstructions.trim(),
        editNotes.trim()
      );

      if (res.ok) {
        Alert.alert('Updated', 'Refill instructions updated successfully.');
        setEditModalVisible(false);
        fetchClinicalData();
      } else {
        Alert.alert('Error', res.data?.message || 'Failed to update refill.');
      }
    } catch (err) {
      console.error('Error updating refill:', err);
      Alert.alert('Error', 'Unable to update refill details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelRefill = (prescription) => {
    Alert.alert(
      'Cancel Refill Request',
      `Are you sure you want to cancel refill token ${prescription.tokenNumber || ''}?`,
      [
        { text: 'Keep Request', style: 'cancel' },
        {
          text: 'Cancel Request',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const res = await cancelRefillRequest(prescription._id);
              if (res.ok) {
                Alert.alert('Cancelled', 'Prescription refill request cancelled successfully.');
                fetchClinicalData();
              } else {
                Alert.alert('Error', res.data?.message || 'Failed to cancel refill.');
              }
            } catch (err) {
              console.error('Error cancelling refill:', err);
              Alert.alert('Error', 'Unable to cancel refill request.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const activePrescription = prescriptions.length > 0 ? prescriptions[0] : null;


  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* 1. Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pharmacy & Lab Tracker</Text>
      </View>

      {/* 2. Segmented Top Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'pharmacy' && styles.tabButtonActive]}
          onPress={() => setActiveTab('pharmacy')}
          activeOpacity={0.7}
        >
          <Ionicons
            name="medkit-outline"
            size={18}
            color={activeTab === 'pharmacy' ? '#0E6649' : '#64748B'}
            style={styles.tabIcon}
          />
          <Text style={[styles.tabText, activeTab === 'pharmacy' && styles.tabTextActive]}>
            Pharmacy ({prescriptions.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'lab' && styles.tabButtonActive]}
          onPress={() => setActiveTab('lab')}
          activeOpacity={0.7}
        >
          <Ionicons
            name="flask-outline"
            size={18}
            color={activeTab === 'lab' ? '#0E6649' : '#64748B'}
            style={styles.tabIcon}
          />
          <Text style={[styles.tabText, activeTab === 'lab' && styles.tabTextActive]}>
            Lab Tests ({labOrders.length})
          </Text>
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0B5338" />
          <Text style={styles.loadingText}>Connecting to hospital dispensary...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0B5338']} />
          }
        >
          {activeTab === 'pharmacy' ? (
            activePrescription ? (
              <>
                {/* Active Prescription Token Card */}
                <View style={styles.mainCard}>
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.cardHeaderTitle}>Prescription Token</Text>
                    <View
                      style={
                        activePrescription.status === 'dispensed'
                          ? styles.badgeSuccess
                          : styles.badgeReady
                      }
                    >
                      <Text
                        style={
                          activePrescription.status === 'dispensed'
                            ? styles.badgeSuccessText
                            : styles.badgeReadyText
                        }
                      >
                        {activePrescription.status === 'dispensed' ? 'Dispensed' : 'Preparing'}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.tokenHighlight}>
                    {activePrescription.tokenNumber || 'A 001'}
                  </Text>

                  <View style={styles.detailGrid}>
                    <View style={styles.detailBlock}>
                      <Text style={styles.detailLabel}>Dispensary Counter</Text>
                      <Text style={styles.detailValue}>
                        {activePrescription.counter || 'Counter 01'}
                      </Text>
                    </View>
                    <View style={styles.detailBlock}>
                      <Text style={styles.detailLabel}>Prescribed By</Text>
                      <Text style={styles.detailValue} numberOfLines={1}>
                        {activePrescription.doctorName || 'Doctor'}
                      </Text>
                    </View>
                  </View>

                  {/* Step Progress */}
                  <View style={styles.stepProgressContainer}>
                    <View style={styles.stepItem}>
                      <View style={[styles.stepCircle, styles.stepDone]}>
                        <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                      </View>
                      <Text style={styles.stepLabel}>Doctor Sent</Text>
                    </View>
                    <View
                      style={[
                        styles.stepLine,
                        styles.stepLineActive,
                      ]}
                    />
                    <View style={styles.stepItem}>
                      <View
                        style={[
                          styles.stepCircle,
                          activePrescription.status === 'dispensed'
                            ? styles.stepDone
                            : styles.stepActive,
                        ]}
                      >
                        {activePrescription.status === 'dispensed' ? (
                          <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                        ) : (
                          <Ionicons name="time" size={14} color="#FFFFFF" />
                        )}
                      </View>
                      <Text style={styles.stepLabel}>Dispensing</Text>
                    </View>
                    <View
                      style={[
                        styles.stepLine,
                        activePrescription.status === 'dispensed' && styles.stepLineActive,
                      ]}
                    />
                    <View style={styles.stepItem}>
                      <View
                        style={[
                          styles.stepCircle,
                          activePrescription.status === 'dispensed' && styles.stepDone,
                        ]}
                      >
                        <Ionicons
                          name="cube-outline"
                          size={14}
                          color={
                            activePrescription.status === 'dispensed' ? '#FFFFFF' : '#94A3B8'
                          }
                        />
                      </View>
                      <Text style={styles.stepLabel}>
                        {activePrescription.status === 'dispensed' ? 'Dispensed' : 'Ready'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Prescribed Items Overview */}
                <View style={styles.sectionCard}>
                  <Text style={styles.sectionTitle}>
                    Prescribed Medicines ({activePrescription.medicines?.length || 0})
                  </Text>

                  {activePrescription.medicines?.map((med, index) => (
                    <View key={med.id || index}>
                      <View style={styles.itemRow}>
                        <View style={styles.itemBullet} />
                        <View style={styles.itemInfo}>
                          <Text style={styles.itemName}>{med.name}</Text>
                          <Text style={styles.itemSub}>
                            {med.dosage}
                            {med.duration ? ` • ${med.duration}` : ''}
                            {med.instructions ? ` • (${med.instructions})` : ''}
                          </Text>
                        </View>
                      </View>
                      {index < activePrescription.medicines.length - 1 && (
                        <View style={styles.itemDivider} />
                      )}
                    </View>
                  ))}
                </View>

                {/* Refill Action Buttons (Update & Delete) */}
                {activePrescription.status === 'pending' && (
                  <View style={styles.refillActionsRow}>
                    <TouchableOpacity
                      style={styles.refillActionBtnEdit}
                      onPress={() => openEditRefillModal(activePrescription)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="create-outline" size={16} color="#0E6649" style={{ marginRight: 6 }} />
                      <Text style={styles.refillActionTextEdit}>Edit Refill Note</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.refillActionBtnDelete}
                      onPress={() => handleCancelRefill(activePrescription)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="trash-outline" size={16} color="#DC2626" style={{ marginRight: 6 }} />
                      <Text style={styles.refillActionTextDelete}>Cancel Request</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Previous Prescriptions History (if any) */}
                {prescriptions.length > 1 && (
                  <View style={[styles.sectionCard, { marginTop: 14 }]}>
                    <Text style={styles.sectionTitle}>Previous Prescriptions</Text>
                    {prescriptions.slice(1).map((p, idx) => (
                      <View key={p._id || idx} style={styles.historyRow}>
                        <View>
                          <Text style={styles.historyToken}>Token {p.tokenNumber}</Text>
                          <Text style={styles.historyDoctor}>By {p.doctorName}</Text>
                        </View>
                        <View style={styles.badgeSuccess}>
                          <Text style={styles.badgeSuccessText}>{p.status}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </>
            ) : (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconCircle}>
                  <Ionicons name="medkit-outline" size={38} color="#0B5338" />
                </View>
                <Text style={styles.emptyTitle}>No Active Prescriptions</Text>
                <Text style={styles.emptySubtitle}>
                  Once your doctor prescribes medicines or you submit a refill request, your dispensary token and live status will appear here.
                </Text>
                <TouchableOpacity
                  style={styles.emptyActionBtn}
                  onPress={() => setRefillModalVisible(true)}
                  activeOpacity={0.85}
                >
                  <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.emptyActionBtnText}>Request Medication Refill</Text>
                </TouchableOpacity>
              </View>
            )
          ) : (
            /* ================= LAB TESTS TAB ================= */
            labOrders.length > 0 ? (
              labOrders.map((order, idx) => {
                const isVerified = order.status === 'verified';
                return (
                  <View key={order._id || idx} style={styles.mainCard}>
                    <View style={styles.cardHeaderRow}>
                      <Text style={styles.cardHeaderTitle}>{order.testName}</Text>
                      <View style={isVerified ? styles.badgeSuccess : styles.badgePending}>
                        <Text style={isVerified ? styles.badgeSuccessText : styles.badgePendingText}>
                          {isVerified ? 'Report Ready' : 'Processing'}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.labSampleText}>
                      Sample: {order.sampleType || 'Blood Specimen'}
                    </Text>
                    <Text style={styles.labDateText}>
                      Token: {order.tokenNumber} • Ordered by {order.doctorName || 'Doctor'}
                    </Text>

                    {isVerified ? (
                      <View style={styles.resultsContainer}>
                        <Text style={styles.resultsTitle}>Laboratory Findings</Text>
                        {order.results?.map((r, rIdx) => (
                          <View key={rIdx} style={styles.resultItemRow}>
                            <Text style={styles.resultParam}>{r.param}</Text>
                            <Text
                              style={[
                                styles.resultValue,
                                r.isCritical && styles.criticalValue,
                              ]}
                            >
                              {r.value} {r.unit}
                            </Text>
                          </View>
                        ))}

                        {order.isCriticalFlagged && order.criticalNote ? (
                          <View style={styles.criticalNotice}>
                            <Ionicons name="alert-circle" size={18} color="#BE123C" />
                            <Text style={styles.criticalText}>
                              {order.criticalNote}
                            </Text>
                          </View>
                        ) : null}

                        <View style={styles.verifiedByRow}>
                          <Ionicons name="checkmark-circle" size={16} color="#15803D" />
                          <Text style={styles.verifiedByText}>
                            Verified by {order.verifiedBy || 'MLT'}
                          </Text>
                        </View>

                        {/* Official Lab Report Document Download Card */}
                        <View style={styles.downloadCard}>
                          <View style={styles.downloadInfoRow}>
                            <View style={styles.pdfIconCircle}>
                              <Ionicons name="document-text" size={18} color="#0E6649" />
                            </View>
                            <View style={styles.downloadTextContainer}>
                              <Text style={styles.downloadDocTitle} numberOfLines={1}>
                                {order.reportFileName || `${order.testName} Official Report`}
                              </Text>
                              <Text style={styles.downloadDocSubtitle}>
                                {order.reportFileSize ? `${order.reportFileSize} • ` : ''}
                                {order.reportFile ? 'Official Signed Document' : 'Digital Verification Complete'}
                              </Text>
                            </View>
                          </View>

                          <TouchableOpacity
                            style={styles.downloadButton}
                            onPress={() => handleDownloadLabReport(order)}
                            activeOpacity={0.8}
                          >
                            <Ionicons name="cloud-download-outline" size={16} color="#FFFFFF" />
                            <Text style={styles.downloadButtonText}>
                              {order.reportFile ? 'Download Official Report' : 'Download Report'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.processingNotice}>
                        <Ionicons name="time-outline" size={18} color="#0284C7" />
                        <Text style={styles.processingText}>
                          Specimen received. Analysis in progress at Central Laboratory.
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyContainer}>
                <View style={[styles.emptyIconCircle, { backgroundColor: '#E0F2FE' }]}>
                  <Ionicons name="flask-outline" size={38} color="#0284C7" />
                </View>
                <Text style={styles.emptyTitle}>No Lab Tests Ordered</Text>
                <Text style={styles.emptySubtitle}>
                  When your doctor orders laboratory investigations during your consultation, live specimen processing and digital results will appear here.
                </Text>
              </View>
            )
          )}
        </ScrollView>
      )}

      {/* Floating Action Button for Refill (Create) */}
      {activeTab === 'pharmacy' && (
        <TouchableOpacity
          style={styles.fabRefillBtn}
          activeOpacity={0.85}
          onPress={() => setRefillModalVisible(true)}
        >
          <Ionicons name="add" size={22} color="#FFFFFF" />
          <Text style={styles.fabRefillText}>Request Refill</Text>
        </TouchableOpacity>
      )}

      {/* Modal 1: Request Refill (Create) */}
      <Modal
        visible={refillModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setRefillModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Request Medication Refill</Text>
              <TouchableOpacity onPress={() => setRefillModalVisible(false)}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalFieldLabel}>Medicine Name & Strength</Text>
            <TextInput
              style={styles.modalInput}
              value={medicineName}
              onChangeText={setMedicineName}
              placeholder="e.g. Paracetamol 500mg"
              placeholderTextColor="#94A3B8"
            />

            <Text style={styles.modalFieldLabel}>Dosage Frequency</Text>
            <TextInput
              style={styles.modalInput}
              value={dosage}
              onChangeText={setDosage}
              placeholder="e.g. 1 Tablet Twice Daily"
              placeholderTextColor="#94A3B8"
            />

            <Text style={styles.modalFieldLabel}>Instructions / Delivery Note</Text>
            <TextInput
              style={[styles.modalInput, { height: 75, textAlignVertical: 'top' }]}
              value={notes}
              onChangeText={setNotes}
              placeholder="e.g. Regular monthly repeat prescription"
              placeholderTextColor="#94A3B8"
              multiline
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setRefillModalVisible(false)}
                disabled={isSubmitting}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handleCreateRefill}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalConfirmBtnText}>Submit Refill</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal 2: Edit Refill Note (Update) */}
      <Modal
        visible={editModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Refill Instructions</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalFieldLabel}>Doctor / Dispensary Instructions</Text>
            <TextInput
              style={styles.modalInput}
              value={editInstructions}
              onChangeText={setEditInstructions}
              placeholder="e.g. Take after meals with plenty of water"
              placeholderTextColor="#94A3B8"
            />

            <Text style={styles.modalFieldLabel}>Patient Notes</Text>
            <TextInput
              style={[styles.modalInput, { height: 80, textAlignVertical: 'top' }]}
              value={editNotes}
              onChangeText={setEditNotes}
              placeholder="e.g. Patient requires repeat supply"
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
                onPress={handleUpdateRefill}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalConfirmBtnText}>Save Instructions</Text>
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
    backgroundColor: '#EDF5FA',
  },
  header: {
    backgroundColor: '#0B5338',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: '#0E6649',
  },
  tabIcon: {
    marginRight: 6,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#0E6649',
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: '#64748B',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 130,
  },
  mainCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  badgeReady: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeReadyText: {
    color: '#D97706',
    fontSize: 11.5,
    fontWeight: '700',
  },
  badgeSuccess: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeSuccessText: {
    color: '#15803D',
    fontSize: 11.5,
    fontWeight: '700',
  },
  badgePending: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgePendingText: {
    color: '#0284C7',
    fontSize: 11.5,
    fontWeight: '700',
  },
  tokenHighlight: {
    fontSize: 30,
    fontWeight: '800',
    color: '#0D9488',
    textAlign: 'center',
    marginVertical: 12,
  },
  detailGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  detailBlock: {
    alignItems: 'center',
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  stepProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginTop: 4,
  },
  stepItem: {
    alignItems: 'center',
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepDone: {
    backgroundColor: '#15803D',
  },
  stepActive: {
    backgroundColor: '#0D9488',
  },
  stepLine: {
    flex: 1,
    height: 3,
    backgroundColor: '#E2E8F0',
    marginBottom: 18,
  },
  stepLineActive: {
    backgroundColor: '#0D9488',
  },
  stepLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 6,
  },
  itemBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0E6649',
    marginTop: 6,
    marginRight: 10,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#0F172A',
  },
  itemSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  itemDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 4,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  historyToken: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  historyDoctor: {
    fontSize: 11,
    color: '#64748B',
  },
  labSampleText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#0F172A',
    marginTop: 8,
  },
  labDateText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 3,
    marginBottom: 12,
  },
  resultsContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginTop: 4,
  },
  resultsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  resultItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  resultParam: {
    fontSize: 12.5,
    color: '#475569',
  },
  resultValue: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  criticalValue: {
    color: '#DC2626',
    fontWeight: '800',
  },
  criticalNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE4E6',
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
    gap: 6,
  },
  criticalText: {
    fontSize: 11.5,
    color: '#9F1239',
    fontWeight: '700',
    flex: 1,
  },
  verifiedByRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 5,
  },
  verifiedByText: {
    fontSize: 11.5,
    color: '#15803D',
    fontWeight: '600',
  },
  processingNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    padding: 10,
    borderRadius: 8,
    gap: 8,
    marginTop: 4,
  },
  processingText: {
    fontSize: 12,
    color: '#0369A1',
    fontWeight: '500',
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  emptyIconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#E6F4EA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 280,
  },
  downloadCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#D1E7DD',
  },
  downloadInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  pdfIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#E6F4EA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  downloadTextContainer: {
    flex: 1,
  },
  downloadDocTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  downloadDocSubtitle: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 1,
  },
  downloadButton: {
    backgroundColor: '#0E6649',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  downloadButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  refillActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
    marginBottom: 6,
  },
  refillActionBtnEdit: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E6F4EA',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingVertical: 11,
    borderRadius: 10,
  },
  refillActionTextEdit: {
    color: '#0E6649',
    fontSize: 13,
    fontWeight: '700',
  },
  refillActionBtnDelete: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingVertical: 11,
    borderRadius: 10,
  },
  refillActionTextDelete: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyActionBtn: {
    backgroundColor: '#0E6649',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 18,
  },
  emptyActionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  fabRefillBtn: {
    position: 'absolute',
    bottom: 95,
    right: 20,
    backgroundColor: '#0E6649',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 30,
    elevation: 6,
    shadowColor: '#0E6649',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    gap: 6,
    zIndex: 999,
  },
  fabRefillText: {
    color: '#FFFFFF',
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
    backgroundColor: '#0E6649',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});