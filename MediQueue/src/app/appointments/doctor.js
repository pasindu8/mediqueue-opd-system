import React, { useState, useEffect, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getEnrichedDoctors, getAllDoctors } from '../../services/doctorService';

const PRIMARY_GREEN = '#0B5338';
const BUTTON_GREEN = '#1F7A4D';
const BG_COLOR = '#EDF5FA';

export default function DoctorsScreen() {
  const [selectedSpecialty, setSelectedSpecialty] = useState('All Specialties');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [fetchingDoctors, setFetchingDoctors] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Profile Modal State
  const [selectedDoctorForModal, setSelectedDoctorForModal] = useState(null);

  // 1. Fetch doctors data from backend
  const fetchDoctorsData = async (isPullToRefresh = false) => {
    if (!isPullToRefresh) {
      // First show cached data (Optimistic UI)
      try {
        const cached = await AsyncStorage.getItem('mediqueue_doctors_cache');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setDoctors(parsed);
          }
        }
      } catch (cacheErr) {
        console.warn('Cache reading error:', cacheErr);
      }
      setFetchingDoctors(true);
    } else {
      setRefreshing(true);
    }

    try {
      setErrorMessage(null);
      // Fetch enriched doctor, clinic, hospital and desk details from backend
      const result = await getEnrichedDoctors();

      if (result.ok && result.data && Array.isArray(result.data.doctors)) {
        const doctorList = result.data.doctors;
        setDoctors(doctorList);
        await AsyncStorage.setItem('mediqueue_doctors_cache', JSON.stringify(doctorList));
      } else {
        // Fallback: standard getAllDoctors
        const fallbackRes = await getAllDoctors();
        if (fallbackRes.ok && fallbackRes.data?.doctors) {
          const rawDocs = fallbackRes.data.doctors.map((d) => ({
            ...d,
            name: d.name || `Dr. ${d.specialty || 'Medical Officer'}`,
            clinicName: d.clinicName || 'General OPD Clinic',
            roomNumber: d.roomNumber || 'Room 01',
            status: d.status || 'Available',
          }));
          setDoctors(rawDocs);
        } else {
          setErrorMessage(result.data?.message || 'Failed to fetch doctors list from server.');
        }
      }
    } catch (error) {
      console.error('Error fetching doctors from backend:', error);
      setErrorMessage('Unable to connect to hospital server. Please verify your connection.');
    } finally {
      setFetchingDoctors(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDoctorsData();
  }, []);

  // 2. Dynamically build specialties list based on data
  const specialtyList = useMemo(() => {
    const set = new Set();
    doctors.forEach((doc) => {
      if (doc.specialty && typeof doc.specialty === 'string') {
        set.add(doc.specialty.trim());
      }
    });

    const dynamicList = Array.from(set);
    return ['All Specialties', ...dynamicList];
  }, [doctors]);

  // 3. Filter by specialty and search query
  const filteredDoctors = useMemo(() => {
    return doctors.filter((doc) => {
      const matchSpecialty =
        selectedSpecialty === 'All Specialties' ||
        doc.specialty?.toLowerCase() === selectedSpecialty.toLowerCase() ||
        doc.specialty?.toLowerCase().includes(selectedSpecialty.toLowerCase());

      const query = searchQuery.trim().toLowerCase();
      const matchSearch =
        !query ||
        doc.name?.toLowerCase().includes(query) ||
        doc.specialty?.toLowerCase().includes(query) ||
        doc.clinicName?.toLowerCase().includes(query) ||
        doc.hospitalName?.toLowerCase().includes(query) ||
        doc.slmc?.toLowerCase().includes(query);

      return matchSpecialty && matchSearch;
    });
  }, [doctors, selectedSpecialty, searchQuery]);

  // 4. Filter On-Call Doctors
  const onCallDoctors = useMemo(() => {
    return doctors.filter((doc) => doc.isOnCall === true);
  }, [doctors]);

  // Navigation to Token Booking
  const handleScheduleAppointment = (doc) => {
    router.push({
      pathname: '/appointments/NewToken',
      params: {
        doctorId: doc._id || doc.id,
        doctorName: doc.name,
        specialty: doc.specialty,
        clinicId: doc.clinicId,
        clinicName: doc.clinicName,
        roomNumber: doc.roomNumber,
        hospitalId: doc.hospitalId,
        hospitalName: doc.hospitalName,
      },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* 1. Header Banner */}
      <LinearGradient
        colors={['#0B5338', '#127C55', '#24A876']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerBanner}
      >
        <Text style={styles.welcomeText}>Welcome, Patient</Text>

        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.headerBackBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Meet Our Doctors</Text>

          <TouchableOpacity
            style={styles.headerFilterBtn}
            activeOpacity={0.7}
            onPress={() => setShowSearch((prev) => !prev)}
          >
            <Ionicons
              name={showSearch ? 'close' : 'search-outline'}
              size={24}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </View>

        {/* Optional Search Bar */}
        {showSearch && (
          <View style={styles.searchBarWrapper}>
            <Ionicons name="search" size={18} color="#64748B" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by doctor, specialty, or clinic..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>
        )}
      </LinearGradient>

      {/* 2. Main Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchDoctorsData(true)}
            colors={[PRIMARY_GREEN]}
            tintColor={PRIMARY_GREEN}
          />
        }
      >
        {/* Horizontal Category Filters */}
        <View style={styles.filterSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            {specialtyList.map((specialty) => {
              const isSelected = selectedSpecialty === specialty;
              return (
                <TouchableOpacity
                  key={specialty}
                  style={[
                    styles.filterChip,
                    isSelected && styles.filterChipSelected,
                  ]}
                  onPress={() => setSelectedSpecialty(specialty)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      isSelected && styles.filterChipTextSelected,
                    ]}
                  >
                    {specialty}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Error Banner with Retry */}
        {errorMessage && (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle-outline" size={24} color="#DC2626" />
            <View style={styles.errorTextCol}>
              <Text style={styles.errorTitle}>Connection Issue</Text>
              <Text style={styles.errorSubtitle}>{errorMessage}</Text>
            </View>
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => fetchDoctorsData(false)}
            >
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Loading Indicator */}
        {fetchingDoctors && doctors.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={PRIMARY_GREEN} />
            <Text style={styles.loadingText}>Connecting to hospital doctors...</Text>
          </View>
        ) : (
          <>
            {/* Doctors Cards List */}
            <View style={styles.doctorList}>
              {filteredDoctors.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="medical-outline" size={40} color="#94A3B8" />
                  <Text style={styles.emptyText}>
                    No doctors available for this category or search.
                  </Text>
                  {(selectedSpecialty !== 'All Specialties' || searchQuery.length > 0) && (
                    <TouchableOpacity
                      style={styles.resetFilterBtn}
                      onPress={() => {
                        setSelectedSpecialty('All Specialties');
                        setSearchQuery('');
                      }}
                    >
                      <Text style={styles.resetFilterText}>Show All Doctors</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                filteredDoctors.map((doc) => {
                  const isAvailable = doc.status === 'Available';
                  return (
                    <View key={doc._id || doc.id} style={styles.doctorCard}>
                      <View style={styles.cardHeaderRow}>
                        {/* Avatar */}
                        <View style={styles.avatarWrapper}>
                          <FontAwesome5
                            name="user-md"
                            size={28}
                            color="#367C6B"
                          />
                        </View>

                        {/* Middle Info */}
                        <View style={styles.doctorInfoCol}>
                          <Text style={styles.doctorName}>{doc.name}</Text>
                          <Text style={styles.doctorSpecialty}>
                            {doc.specialty}
                          </Text>
                          <Text style={styles.clinicInfo}>
                            <Text style={styles.clinicLabel}>Clinic: </Text>
                            {doc.clinicName || 'General OPD Clinic'}, {doc.roomNumber || 'Room 01'}
                          </Text>
                          {doc.hospitalName && (
                            <Text style={styles.hospitalInfo} numberOfLines={1}>
                              <Ionicons name="business-outline" size={12} color="#64748B" />{' '}
                              {doc.hospitalName}
                            </Text>
                          )}
                        </View>

                        {/* Status Badge */}
                        <View style={styles.statusCol}>
                          <Text style={styles.statusLabel}>Status:</Text>
                          <View style={styles.statusBadge}>
                            <View
                              style={[
                                styles.statusDot,
                                isAvailable
                                  ? styles.dotAvailable
                                  : styles.dotUnavailable,
                              ]}
                            />
                            <Text
                              style={[
                                styles.statusText,
                                isAvailable
                                  ? styles.textAvailable
                                  : styles.textUnavailable,
                              ]}
                            >
                              {doc.status || 'Available'}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* Action Buttons */}
                      <View style={styles.buttonRow}>
                        <TouchableOpacity
                          style={styles.scheduleBtn}
                          activeOpacity={0.85}
                          onPress={() => handleScheduleAppointment(doc)}
                        >
                          <Text style={styles.scheduleBtnText}>
                            Schedule Appointment
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.viewProfileBtn}
                          activeOpacity={0.85}
                          onPress={() => setSelectedDoctorForModal(doc)}
                        >
                          <Text style={styles.viewProfileBtnText}>
                            View Profile
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
              )}
            </View>

            {/* On-Call Doctors Section */}
            {onCallDoctors.length > 0 && (
              <View style={styles.onCallHeader}>
                <View style={styles.onCallTitleRow}>
                  <Text style={styles.onCallTitle}>On-Call Doctors</Text>
                  <View style={styles.livePulseBadge}>
                    <View style={styles.livePulseDot} />
                    <Text style={styles.livePulseText}>Hospital Active</Text>
                  </View>
                </View>

                <View style={styles.doctorList}>
                  {onCallDoctors.map((doc) => (
                    <View
                      key={`oncall-${doc._id || doc.id}`}
                      style={[styles.doctorCard, styles.onCallCardBorder]}
                    >
                      <View style={styles.cardHeaderRow}>
                        <View style={[styles.avatarWrapper, styles.onCallAvatarBg]}>
                          <FontAwesome5
                            name="stethoscope"
                            size={26}
                            color="#0B5338"
                          />
                        </View>
                        <View style={styles.doctorInfoCol}>
                          <Text style={styles.doctorName}>{doc.name}</Text>
                          <Text style={styles.doctorSpecialty}>
                            {doc.specialty}
                          </Text>
                          <Text style={styles.clinicInfo}>
                            <Text style={styles.onCallTag}>Duty Station: </Text>
                            {doc.clinicName || 'OPD Emergency'}, {doc.roomNumber || 'Room 01'}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={styles.onCallQuickBtn}
                          onPress={() => handleScheduleAppointment(doc)}
                        >
                          <Ionicons name="calendar-outline" size={16} color="#FFFFFF" />
                          <Text style={styles.onCallQuickBtnText}>Book</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* 3. Doctor Details / Profile Modal */}
      {selectedDoctorForModal && (
        <Modal
          visible={!!selectedDoctorForModal}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedDoctorForModal(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <View style={styles.modalAvatarWrapper}>
                  <FontAwesome5 name="user-md" size={32} color="#0B5338" />
                </View>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setSelectedDoctorForModal(null)}
                >
                  <Ionicons name="close" size={24} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Doctor Title */}
                <Text style={styles.modalDocName}>
                  {selectedDoctorForModal.name}
                </Text>
                <Text style={styles.modalDocSpecialty}>
                  {selectedDoctorForModal.specialty}
                </Text>

                {/* SLMC Badge */}
                {selectedDoctorForModal.slmc && (
                  <View style={styles.slmcBadge}>
                    <Ionicons name="shield-checkmark-outline" size={14} color="#1F7A4D" />
                    <Text style={styles.slmcText}>
                      SLMC / Staff ID: {selectedDoctorForModal.slmc}
                    </Text>
                  </View>
                )}

                <View style={styles.modalDivider} />

                {/* Details Section */}
                <View style={styles.modalDetailRow}>
                  <Ionicons name="business-outline" size={18} color="#0B5338" />
                  <View style={styles.modalDetailCol}>
                    <Text style={styles.modalDetailLabel}>Hospital</Text>
                    <Text style={styles.modalDetailValue}>
                      {selectedDoctorForModal.hospitalName || 'District General Hospital - Kalutara'}
                    </Text>
                  </View>
                </View>

                <View style={styles.modalDetailRow}>
                  <Ionicons name="medical-outline" size={18} color="#0B5338" />
                  <View style={styles.modalDetailCol}>
                    <Text style={styles.modalDetailLabel}>Assigned Clinic & Station</Text>
                    <Text style={styles.modalDetailValue}>
                      {selectedDoctorForModal.clinicName || 'General OPD Clinic'}, {selectedDoctorForModal.roomNumber || 'Room 01'}
                    </Text>
                  </View>
                </View>

                <View style={styles.modalDetailRow}>
                  <Ionicons name="time-outline" size={18} color="#0B5338" />
                  <View style={styles.modalDetailCol}>
                    <Text style={styles.modalDetailLabel}>Consultation Time Slots</Text>
                    {Array.isArray(selectedDoctorForModal.timeSlots) && selectedDoctorForModal.timeSlots.length > 0 ? (
                      selectedDoctorForModal.timeSlots.map((slot, sIdx) => (
                        <Text key={sIdx} style={styles.modalSlotText}>
                          • {slot}
                        </Text>
                      ))
                    ) : (
                      <Text style={styles.modalDetailValue}>Morning: 08:00 AM - 12:00 PM</Text>
                    )}
                  </View>
                </View>

                <View style={styles.modalDetailRow}>
                  <Ionicons name="list-outline" size={18} color="#0B5338" />
                  <View style={styles.modalDetailCol}>
                    <Text style={styles.modalDetailLabel}>Clinic Services</Text>
                    {Array.isArray(selectedDoctorForModal.services) && selectedDoctorForModal.services.length > 0 ? (
                      selectedDoctorForModal.services.map((srv, vIdx) => (
                        <Text key={vIdx} style={styles.modalSlotText}>
                          ✓ {srv}
                        </Text>
                      ))
                    ) : (
                      <Text style={styles.modalDetailValue}>General Consultation, Routine Checkup</Text>
                    )}
                  </View>
                </View>
              </ScrollView>

              {/* Modal CTA */}
              <TouchableOpacity
                style={styles.modalBookBtn}
                activeOpacity={0.85}
                onPress={() => {
                  const targetDoc = selectedDoctorForModal;
                  setSelectedDoctorForModal(null);
                  handleScheduleAppointment(targetDoc);
                }}
              >
                <Ionicons name="calendar" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.modalBookBtnText}>Book Appointment with Doctor</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG_COLOR,
  },
  headerBanner: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 22,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  welcomeText: {
    fontSize: 13,
    color: '#D1FAE5',
    fontWeight: '500',
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBackBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerFilterBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 14,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    paddingVertical: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  filterSection: {
    marginTop: 14,
    marginBottom: 10,
  },
  filterScroll: {
    paddingHorizontal: 20,
    gap: 10,
  },
  filterChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#0B5338',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  filterChipSelected: {
    backgroundColor: '#529E85',
    borderColor: '#529E85',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  filterChipTextSelected: {
    color: '#FFFFFF',
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderColor: '#F87171',
    borderWidth: 1,
    borderRadius: 14,
    marginHorizontal: 20,
    marginVertical: 10,
    padding: 12,
  },
  errorTextCol: {
    flex: 1,
    marginLeft: 10,
  },
  errorTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#991B1B',
  },
  errorSubtitle: {
    fontSize: 12,
    color: '#B91C1C',
    marginTop: 2,
  },
  retryBtn: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 8,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#64748B',
    fontSize: 13,
    fontWeight: '500',
  },
  emptyContainer: {
    backgroundColor: '#FFFFFF',
    padding: 28,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 10,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 13.5,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 10,
  },
  resetFilterBtn: {
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: BUTTON_GREEN,
  },
  resetFilterText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  doctorList: {
    paddingHorizontal: 20,
    marginTop: 6,
    gap: 14,
  },
  doctorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  onCallCardBorder: {
    borderColor: '#10B981',
    borderWidth: 1.5,
    backgroundColor: '#F0FDF4',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#CEE8DF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  onCallAvatarBg: {
    backgroundColor: '#D1FAE5',
  },
  doctorInfoCol: {
    flex: 1,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  doctorSpecialty: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
    marginBottom: 4,
  },
  clinicInfo: {
    fontSize: 12.5,
    color: '#0F172A',
    fontWeight: '600',
  },
  clinicLabel: {
    color: '#64748B',
    fontWeight: '500',
  },
  hospitalInfo: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 3,
    fontWeight: '500',
  },
  onCallTag: {
    color: '#059669',
    fontWeight: '700',
  },
  statusCol: {
    alignItems: 'flex-end',
    paddingLeft: 4,
  },
  statusLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotAvailable: {
    backgroundColor: '#16A34A',
  },
  dotUnavailable: {
    backgroundColor: '#DC2626',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  textAvailable: {
    color: '#15803D',
  },
  textUnavailable: {
    color: '#DC2626',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  scheduleBtn: {
    flex: 1.15,
    backgroundColor: BUTTON_GREEN,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduleBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  viewProfileBtn: {
    flex: 0.85,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: BUTTON_GREEN,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewProfileBtnText: {
    color: BUTTON_GREEN,
    fontSize: 13,
    fontWeight: '700',
  },
  onCallHeader: {
    paddingHorizontal: 20,
    marginTop: 22,
  },
  onCallTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  onCallTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  livePulseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 5,
  },
  livePulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10B981',
  },
  livePulseText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  onCallQuickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BUTTON_GREEN,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  onCallQuickBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    width: '100%',
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalAvatarWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalDocName: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 3,
  },
  modalDocSpecialty: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '600',
    marginBottom: 8,
  },
  slmcBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 5,
    marginBottom: 12,
  },
  slmcText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#065F46',
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 12,
  },
  modalDetailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
    gap: 12,
  },
  modalDetailCol: {
    flex: 1,
  },
  modalDetailLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 2,
  },
  modalDetailValue: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalSlotText: {
    fontSize: 12.5,
    color: '#1E293B',
    fontWeight: '500',
    marginTop: 2,
  },
  modalBookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BUTTON_GREEN,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 16,
  },
  modalBookBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});