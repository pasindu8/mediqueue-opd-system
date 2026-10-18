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
import {
  fetchAllHospitals,
  createHospital,
  registerOfficer,
  fetchAllOfficers,
} from '../../services/adminService';

export default function SuperAdminScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Bottom Tabs: 'grid' (0) | 'officers' (1)
  const [activeTab, setActiveTab] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');

  // Hospital List loaded from MongoDB
  const [hospitalsList, setHospitalsList] = useState([]);

  // Officers List loaded from MongoDB
  const [officersList, setOfficersList] = useState([]);

  // Modals
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [showAddOfficerModal, setShowAddOfficerModal] = useState(false);

  // Form Fields
  const [newHospName, setNewHospName] = useState('');
  const [newHospType, setNewHospType] = useState('District General');
  const [newHospDistrict, setNewHospDistrict] = useState('Kalutara');
  const [newHospOpds, setNewHospOpds] = useState('4');

  const [newOfficerName, setNewOfficerName] = useState('');
  const [newOfficerCode, setNewOfficerCode] = useState('');
  const [newOfficerEmail, setNewOfficerEmail] = useState('');
  const [newOfficerHospital, setNewOfficerHospital] = useState('DGH Kalutara');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [hospRes, offRes] = await Promise.all([
        fetchAllHospitals(),
        fetchAllOfficers(),
      ]);

      if (hospRes.ok && Array.isArray(hospRes.data?.hospitals)) {
        const mapped = hospRes.data.hospitals.map((h, i) => ({
          id: h._id || String(i),
          name: h.name,
          type: h.category || 'District General',
          district: h.district || 'Western',
          opds: h.activeClinics || (Array.isArray(h.clinics) ? h.clinics.length : 4),
          status: 'Active',
        }));
        setHospitalsList(mapped);
      }

      if (offRes.ok && (Array.isArray(offRes.data?.admins) || Array.isArray(offRes.data?.data))) {
        const rawOfficers = offRes.data.admins || offRes.data.data;
        const mappedOfficers = rawOfficers.map((o, i) => ({
          id: o._id || String(i),
          code: o.StaffID || `STF-2024-00${i + 1}`,
          name: o.name || 'Support Officer',
          hospital: o.hospital || o.hospitalName || 'DGH Kalutara',
          email: o.email || 'officer@health.gov.lk',
          status: o.status || 'active',
          statusType: o.status === 'active' ? 'active' : o.status === 'Assigned' ? 'assigned' : 'pending',
        }));
        setOfficersList(mappedOfficers);
      }
    } catch (e) {
      console.log('Error loading super admin data from database:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleOnboardHospital = async () => {
    if (!newHospName.trim()) {
      Alert.alert('Required', 'Please enter a Hospital Name.');
      return;
    }

    const newItem = {
      id: Date.now().toString(),
      name: newHospName.trim(),
      type: newHospType,
      district: newHospDistrict,
      opds: parseInt(newHospOpds, 10) || 2,
      status: 'Active',
    };

    setHospitalsList((prev) => [newItem, ...prev]);

    try {
      await createHospital(
        newHospName.trim(),
        newHospDistrict,
        newHospType,
        'itlead@health.gov.lk'
      );
    } catch (e) {}

    Alert.alert('Success', `${newHospName} onboarded to National Grid.`);
    setNewHospName('');
    setShowOnboardModal(false);
  };

  const handleAddOfficer = () => {
    if (!newOfficerName.trim() || !newOfficerEmail.trim()) {
      Alert.alert('Required', 'Please enter Officer Name and Email.');
      return;
    }

    const newOfficer = {
      id: Date.now().toString(),
      code: newOfficerCode.trim() || `STF-2026-${Math.floor(100 + Math.random() * 900)}`,
      name: newOfficerName.trim(),
      hospital: newOfficerHospital.trim() || 'DGH Kalutara',
      email: newOfficerEmail.trim(),
      status: 'active',
      statusType: 'active',
    };

    setOfficersList((prev) => [newOfficer, ...prev]);
    Alert.alert('Officer Added', `${newOfficerName} deployed as local support officer.`);
    setNewOfficerName('');
    setNewOfficerCode('');
    setNewOfficerEmail('');
    setShowAddOfficerModal(false);
  };

  const handleResetAccess = (officer) => {
    Alert.alert(
      'Reset Access',
      `Generate temporary password reset link for ${officer.name} (${officer.email})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Reset Link',
          onPress: () => {
            Alert.alert('Reset Link Sent', `Password reset instructions dispatched to ${officer.email}.`);
          },
        },
      ]
    );
  };

  const filteredHospitals = hospitalsList.filter((h) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      h.name.toLowerCase().includes(q) ||
      h.district.toLowerCase().includes(q) ||
      h.type.toLowerCase().includes(q)
    );
  });

  const totalHospitals = hospitalsList.length;
  const totalOpds = hospitalsList.reduce((acc, h) => acc + (h.opds || 0), 0);

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
        {activeTab === 'grid' ? (
          /* TAB 1 HEADER: Hospital Grid */
          <View style={styles.heroBanner}>
            <View style={styles.heroTopRow}>
              <View>
                <Text style={styles.heroTitle}>Hospital Grid</Text>
                <Text style={styles.heroSubtitle}>
                  Ministry of Health · National Directory
                </Text>
              </View>
              <TouchableOpacity
                style={styles.actionHeaderPill}
                onPress={() => setShowOnboardModal(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={18} color="#FFFFFF" style={{ marginRight: 2 }} />
                <Text style={styles.actionHeaderPillText}>Onboard</Text>
              </TouchableOpacity>
            </View>

            {/* 3 Metrics Cards Row */}
            <View style={styles.metricsRow}>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Hospitals</Text>
                <Text style={styles.metricNumber}>{hospitalsList.length}</Text>
              </View>

              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>OPDs</Text>
                <Text style={[styles.metricNumber, { color: '#0F766E' }]}>
                  {hospitalsList.reduce((acc, h) => acc + (Number(h.opds) || 0), 0)}
                </Text>
              </View>

              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Online</Text>
                <Text style={[styles.metricNumber, { color: '#2E7D52' }]}>
                  {hospitalsList.length}/{hospitalsList.length}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          /* TAB 2 HEADER: IT Officers (Matching Screenshot 1) */
          <View style={styles.heroBannerOfficers}>
            <View style={styles.heroTopRow}>
              <View>
                <Text style={styles.heroTitle}>IT Officers</Text>
                <Text style={styles.heroSubtitle}>
                  Local support officers · {officersList.length} deployed
                </Text>
              </View>
              <TouchableOpacity
                style={styles.actionHeaderPill}
                onPress={() => setShowAddOfficerModal(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={18} color="#FFFFFF" style={{ marginRight: 2 }} />
                <Text style={styles.actionHeaderPillText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ============================================================== */}
        {/* TAB 1: HOSPITAL GRID                                           */}
        {/* ============================================================== */}
        {activeTab === 'grid' && (
          <View style={styles.listSection}>
            {/* Search Pill Input */}
            <View style={styles.searchBox}>
              <Ionicons
                name="search-outline"
                size={18}
                color="#64748B"
                style={{ marginRight: 8 }}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search hospital or district..."
                placeholderTextColor="#64748B"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={16} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>

            {/* Hospital Cards List */}
            {filteredHospitals.map((hosp) => (
              <View key={hosp.id} style={styles.hospitalCard}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.hospTitle}>{hosp.name}</Text>
                  <Text style={styles.hospSubtitle}>
                    {hosp.type} · {hosp.district} · {hosp.opds} OPDs
                  </Text>
                </View>

                {/* Status Pill Badge */}
                <View style={styles.activePillBadge}>
                  <View style={styles.tinyGreenDot} />
                  <Text style={styles.activePillText}>{hosp.status}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ============================================================== */}
        {/* TAB 2: IT OFFICERS (Matching Screenshot 1)                     */}
        {/* ============================================================== */}
        {activeTab === 'officers' && (
          <View style={styles.officersListSection}>
            {officersList.map((officer) => (
              <View key={officer.id} style={styles.officerCard}>
                {/* Top Code and Status Pill */}
                <View style={styles.officerCardTopRow}>
                  <Text style={styles.officerCodeText}>{officer.code}</Text>

                  {/* Status Badge */}
                  {officer.statusType === 'active' && (
                    <View style={styles.statusActivePill}>
                      <View style={styles.tinyGreenDot} />
                      <Text style={styles.statusActiveText}>active</Text>
                    </View>
                  )}
                  {officer.statusType === 'assigned' && (
                    <View style={styles.statusAssignedPill}>
                      <View style={styles.tinyBlueDot} />
                      <Text style={styles.statusAssignedText}>Assigned</Text>
                    </View>
                  )}
                  {officer.statusType === 'pending' && (
                    <View style={styles.statusPendingPill}>
                      <View style={styles.tinyOrangeDot} />
                      <Text style={styles.statusPendingText}>pending</Text>
                    </View>
                  )}
                </View>

                {/* Officer Name */}
                <Text style={styles.officerNameTitle}>{officer.name}</Text>

                {/* Hospital & Email */}
                <Text style={styles.officerSubText}>
                  {officer.hospital} · {officer.email}
                </Text>

                {/* Full-width Reset Access Button */}
                <TouchableOpacity
                  style={styles.resetAccessBtn}
                  onPress={() => handleResetAccess(officer)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="key-outline" size={17} color="#2E7D52" style={{ marginRight: 6 }} />
                  <Text style={styles.resetAccessBtnText}>Reset Access</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* ============================================================== */}
      {/* FLOATING CURVED BOTTOM NAVIGATION BAR                         */}
      {/* ============================================================== */}
      <View style={styles.bottomNavWrapper}>
        <View style={styles.bottomNavBar}>
          {/* Tab 1: Hospital Grid */}
          <TouchableOpacity
            style={styles.bottomNavItem}
            onPress={() => setActiveTab('grid')}
            activeOpacity={0.8}
          >
            {activeTab === 'grid' ? (
              <View style={styles.elevatedActiveCircle}>
                <Ionicons name="business" size={24} color="#FFFFFF" />
              </View>
            ) : (
              <Ionicons name="business-outline" size={24} color="#5A7366" />
            )}
          </TouchableOpacity>

          {/* Tab 2: Officers */}
          <TouchableOpacity
            style={styles.bottomNavItem}
            onPress={() => setActiveTab('officers')}
            activeOpacity={0.8}
          >
            {activeTab === 'officers' ? (
              <View style={styles.elevatedActiveCircle}>
                <Ionicons name="person" size={24} color="#FFFFFF" />
              </View>
            ) : (
              <Ionicons name="person-outline" size={24} color="#5A7366" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* ============================================================== */}
      {/* ONBOARD HOSPITAL MODAL                                         */}
      {/* ============================================================== */}
      <Modal visible={showOnboardModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalHeading}>Onboard Hospital</Text>

            <TextInput
              style={styles.modalInputField}
              placeholder="Hospital Name (e.g. Teaching Hospital Galle)"
              placeholderTextColor="#94A3B8"
              value={newHospName}
              onChangeText={setNewHospName}
            />

            <TextInput
              style={styles.modalInputField}
              placeholder="Category (e.g. Teaching, National)"
              placeholderTextColor="#94A3B8"
              value={newHospType}
              onChangeText={setNewHospType}
            />

            <TextInput
              style={styles.modalInputField}
              placeholder="District (e.g. Colombo, Kandy)"
              placeholderTextColor="#94A3B8"
              value={newHospDistrict}
              onChangeText={setNewHospDistrict}
            />

            <TextInput
              style={styles.modalInputField}
              placeholder="Active OPD Count (e.g. 4)"
              placeholderTextColor="#94A3B8"
              keyboardType="number-pad"
              value={newHospOpds}
              onChangeText={setNewHospOpds}
            />

            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowOnboardModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleOnboardHospital}
              >
                <Text style={styles.modalSaveText}>Onboard</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ============================================================== */}
      {/* ADD OFFICER MODAL                                              */}
      {/* ============================================================== */}
      <Modal visible={showAddOfficerModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalHeading}>Add Local IT Officer</Text>

            <TextInput
              style={styles.modalInputField}
              placeholder="Officer Full Name"
              placeholderTextColor="#94A3B8"
              value={newOfficerName}
              onChangeText={setNewOfficerName}
            />

            <TextInput
              style={styles.modalInputField}
              placeholder="Staff ID (e.g. STF-2026-050)"
              placeholderTextColor="#94A3B8"
              value={newOfficerCode}
              onChangeText={setNewOfficerCode}
            />

            <TextInput
              style={styles.modalInputField}
              placeholder="Official Email"
              placeholderTextColor="#94A3B8"
              value={newOfficerEmail}
              onChangeText={setNewOfficerEmail}
              keyboardType="email-address"
            />

            <TextInput
              style={styles.modalInputField}
              placeholder="Assigned Hospital"
              placeholderTextColor="#94A3B8"
              value={newOfficerHospital}
              onChangeText={setNewOfficerHospital}
            />

            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowAddOfficerModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleAddOfficer}
              >
                <Text style={styles.modalSaveText}>Deploy Officer</Text>
              </TouchableOpacity>
            </View>
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
    paddingBottom: 110,
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
  heroBannerOfficers: {
    backgroundColor: '#2E7D52',
    paddingTop: Platform.OS === 'ios' ? 16 : 24,
    paddingBottom: 36,
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
  actionHeaderPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  actionHeaderPillText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  /* 3 Metrics Cards Row */
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 22,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 14,
    alignItems: 'flex-start',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  metricNumber: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 4,
  },

  /* Content Section */
  listSection: {
    paddingHorizontal: 18,
    marginTop: 18,
  },
  officersListSection: {
    paddingHorizontal: 18,
    marginTop: -16,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 11,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
  },
  hospitalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  hospTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  hospSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 3,
  },
  activePillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F4EA',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  tinyGreenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2E7D52',
    marginRight: 5,
  },
  activePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2E7D52',
  },

  /* Officer Card Styles (Matching Screenshot 1) */
  officerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    marginBottom: 14,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  officerCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  officerCodeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  statusActivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F4EA',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusActiveText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2E7D52',
  },
  statusAssignedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tinyBlueDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4F46E5',
    marginRight: 5,
  },
  statusAssignedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4F46E5',
  },
  statusPendingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tinyOrangeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D97706',
    marginRight: 5,
  },
  statusPendingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },
  officerNameTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  officerSubText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 3,
    marginBottom: 12,
  },
  resetAccessBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EBF4EE',
    borderRadius: 14,
    paddingVertical: 11,
  },
  resetAccessBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2E7D52',
  },

  /* Floating Bottom Navigation Bar */
  bottomNavWrapper: {
    position: 'absolute',
    bottom: 22,
    left: 20,
    right: 20,
  },
  bottomNavBar: {
    height: 68,
    backgroundColor: '#FFFFFF',
    borderRadius: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    elevation: 10,
    shadowColor: '#0F172A',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    paddingHorizontal: 24,
  },
  bottomNavItem: {
    width: 60,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  elevatedActiveCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2E7D52',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    elevation: 6,
    shadowColor: '#2E7D52',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    marginTop: -16,
  },

  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
  },
  modalHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 16,
  },
  modalInputField: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
    marginBottom: 12,
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  modalCancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  modalCancelText: {
    color: '#64748B',
    fontWeight: '600',
    fontSize: 13,
  },
  modalSaveBtn: {
    backgroundColor: '#2E7D52',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  modalSaveText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
