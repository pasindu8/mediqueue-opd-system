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
  fetchHospitalDoctors,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  fetchHospitalClinics,
  createClinic,
  updateClinic,
  deleteClinic,
  fetchHospitalPharmacies,
  createPharmacyCounter,
  updatePharmacyCounter,
  deletePharmacyCounter,
  fetchHospitalLabs,
  createLabUnit,
  updateLabUnit,
  deleteLabUnit,
} from '../../services/adminService';

export default function ITSupportScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [hospitalName, setHospitalName] = useState('District General Hospital - Kalutara');
  const [hospitalId, setHospitalId] = useState('');

  // Active Bottom Tab: 'overview' (0) | 'doctors' (1) | 'clinics' (2) | 'pharmacy_labs' (3)
  const [activeTab, setActiveTab] = useState('overview');

  // Lists loaded from MongoDB database
  const [doctorsList, setDoctorsList] = useState([]);
  const [clinicsList, setClinicsList] = useState([]);
  const [pharmaciesList, setPharmaciesList] = useState([]);
  const [labsList, setLabsList] = useState([]);

  // Modal State for Add & Edit
  const [modalType, setModalType] = useState(null); // 'doctor' | 'clinic' | 'counter' | 'lab'
  const [editingItem, setEditingItem] = useState(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formSub, setFormSub] = useState('');
  const [formExtra, setFormExtra] = useState('');
  const [formRoom, setFormRoom] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const storedUser = await AsyncStorage.getItem('adminUser');
      let currentHospId = null;
      if (storedUser) {
        const u = JSON.parse(storedUser);
        if (u.hospital) setHospitalName(u.hospital);
        if (u.hospitalId) {
          setHospitalId(u.hospitalId);
          currentHospId = u.hospitalId;
        }
      }

      // Fetch Doctors, Clinics, Pharmacies, Labs in parallel from DB
      const [docRes, clinicRes, pharmRes, labRes] = await Promise.all([
        getAllDoctors().catch(() => ({ ok: false })),
        getAllClinics().catch(() => ({ ok: false })),
        fetch(`${BASE_URL}/pharmacy/all`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ hospitalId: currentHospId }),
        }).then((r) => r.json()).catch(() => ({})),
        fetch(`${BASE_URL}/lab/all`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ hospitalId: currentHospId }),
        }).then((r) => r.json()).catch(() => ({})),
      ]);

      if (docRes.ok && Array.isArray(docRes.data?.doctors)) {
        setDoctorsList(
          docRes.data.doctors.map((d, i) => ({
            id: d._id || String(i),
            code: d.slmc || d.StaffID || `DOC-00${i + 1}`,
            name: d.name || 'Medical Officer',
            specialty: d.specialty || 'General Practitioner',
            clinic: d.clinicName || 'General OPD Clinic',
            status: d.status || 'Available',
          }))
        );
      }

      if (clinicRes.ok && (Array.isArray(clinicRes.data?.data) || Array.isArray(clinicRes.data?.clinics))) {
        const cList = clinicRes.data.data || clinicRes.data.clinics;
        setClinicsList(
          cList.map((c, i) => ({
            id: c._id || String(i),
            room: c.roomNumber || `Room 0${i + 1}`,
            name: c.name || c.clinicName || 'OPD Clinic',
            services: Array.isArray(c.services) ? c.services.join(' · ') : c.services || 'General Care',
            slots: Array.isArray(c.timeSlots) ? `${c.timeSlots.length} Slots` : '2 Slots',
            status: c.status || 'Operational',
          }))
        );
      }

      const pData = pharmRes.data || pharmRes.pharmacies || [];
      if (Array.isArray(pData)) {
        setPharmaciesList(
          pData.map((p, i) => ({
            id: p._id || String(i),
            name: p.name || `Dispensary Counter 0${i + 1}`,
            officer: p.officerName || p.pharmacistName || 'Registered Pharmacist',
            status: p.status || 'active',
          }))
        );
      }

      const lData = labRes.data || labRes.labs || [];
      if (Array.isArray(lData)) {
        setLabsList(
          lData.map((l, i) => ({
            id: l._id || String(i),
            name: l.name || `Laboratory Unit 0${i + 1}`,
            officer: l.officerName || l.technologistName || 'Medical Lab Technologist',
            status: l.status || 'active',
          }))
        );
      }
    } catch (e) {
      console.log('Error reading storage or fetching IT support data:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const openAddModal = (type) => {
    setEditingItem(null);
    setFormName('');
    setFormSub('');
    setFormExtra('');
    setFormRoom('');
    setModalType(type);
  };

  const openEditModal = (type, item) => {
    setEditingItem(item);
    if (type === 'doctor') {
      setFormName(item.name);
      setFormSub(item.clinic);
      setFormExtra(item.code || '');
    } else if (type === 'clinic') {
      setFormName(item.name);
      setFormSub(item.services);
      setFormRoom(item.room);
      setFormExtra(item.slots || '2 Slots');
    } else if (type === 'counter') {
      setFormName(item.name);
      setFormSub(item.officer);
    } else if (type === 'lab') {
      setFormName(item.name);
      setFormSub(item.officer);
    }
    setModalType(type);
  };

  const handleSave = () => {
    if (!formName.trim()) {
      Alert.alert('Required', 'Please enter a name or title.');
      return;
    }

    if (modalType === 'doctor') {
      if (editingItem) {
        setDoctorsList((prev) =>
          prev.map((d) =>
            d.id === editingItem.id
              ? { ...d, name: formName, clinic: formSub || d.clinic }
              : d
          )
        );
      } else {
        const randCode = `DOC-F${Math.floor(100 + Math.random() * 900)} · STF-2026-${Math.floor(10 + Math.random() * 80)}`;
        setDoctorsList((prev) => [
          {
            id: Date.now().toString(),
            code: randCode,
            name: formName,
            specialty: formName,
            clinic: formSub || 'General OPD Clinic',
            status: 'Available',
          },
          ...prev,
        ]);
      }
    } else if (modalType === 'clinic') {
      if (editingItem) {
        setClinicsList((prev) =>
          prev.map((c) =>
            c.id === editingItem.id
              ? { ...c, name: formName, services: formSub || c.services, room: formRoom || c.room }
              : c
          )
        );
      } else {
        setClinicsList((prev) => [
          {
            id: Date.now().toString(),
            room: formRoom || `Room 0${prev.length + 1}`,
            name: formName,
            services: formSub || 'Consultation & Diagnostics',
            slots: formExtra || '2 Slots',
            status: 'Operational',
          },
          ...prev,
        ]);
      }
    } else if (modalType === 'counter') {
      if (editingItem) {
        setPharmaciesList((prev) =>
          prev.map((p) =>
            p.id === editingItem.id
              ? { ...p, name: formName, officer: formSub || p.officer }
              : p
          )
        );
      } else {
        setPharmaciesList((prev) => [
          {
            id: Date.now().toString(),
            name: formName,
            officer: formSub || 'Staff Pharmacist · Token release',
            status: 'active',
          },
          ...prev,
        ]);
      }
    } else if (modalType === 'lab') {
      if (editingItem) {
        setLabsList((prev) =>
          prev.map((l) =>
            l.id === editingItem.id
              ? { ...l, name: formName, officer: formSub || l.officer }
              : l
          )
        );
      } else {
        setLabsList((prev) => [
          {
            id: Date.now().toString(),
            name: formName,
            officer: formSub || 'Medical Lab Technologist',
            status: 'active',
          },
          ...prev,
        ]);
      }
    }

    setModalType(null);
    setEditingItem(null);
  };

  const handleDeleteCurrent = () => {
    if (!editingItem) return;
    Alert.alert('Confirm Delete', 'Remove this entry permanently?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          if (modalType === 'doctor') {
            setDoctorsList((prev) => prev.filter((d) => d.id !== editingItem.id));
          } else if (modalType === 'clinic') {
            setClinicsList((prev) => prev.filter((c) => c.id !== editingItem.id));
          } else if (modalType === 'counter') {
            setPharmaciesList((prev) => prev.filter((p) => p.id !== editingItem.id));
          } else if (modalType === 'lab') {
            setLabsList((prev) => prev.filter((l) => l.id !== editingItem.id));
          }
          setModalType(null);
          setEditingItem(null);
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Scrollable Main Area */}
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
        {/* TAB 1: HOSPITAL IT DESK (OVERVIEW)                            */}
        {/* ============================================================== */}
        {activeTab === 'overview' && (
          <View>
            {/* Curved Green Hero Banner */}
            <View style={styles.heroBanner}>
              <View style={styles.heroTopRow}>
                <View>
                  <Text style={styles.heroTitle}>Hospital IT Desk</Text>
                  <Text style={styles.heroSubtitle}>{hospitalName}</Text>
                </View>
                <TouchableOpacity
                  style={styles.backHubBtn}
                  onPress={() => router.push('/admin/portal')}
                  activeOpacity={0.7}
                >
                  <Ionicons name="apps" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              {/* Online Pill Badge */}
              <View style={styles.onlineBadge}>
                <View style={styles.greenDot} />
                <Text style={styles.onlineBadgeText}>Online · Real-Time Sync</Text>
              </View>
            </View>

            {/* 2x2 Metric Cards Grid */}
            <View style={styles.metricsContainer}>
              <View style={styles.metricsRow}>
                {/* Doctors */}
                <TouchableOpacity
                  style={styles.metricCard}
                  onPress={() => setActiveTab('doctors')}
                  activeOpacity={0.8}
                >
                  <View style={styles.metricCardHeader}>
                    <Text style={styles.metricLabel}>Doctors</Text>
                    <View style={styles.metricIconCircle}>
                      <Ionicons name="people-outline" size={19} color="#2E7D52" />
                    </View>
                  </View>
                  <Text style={styles.metricNumber}>{doctorsList.length}</Text>
                  <Text style={styles.metricSub}>Consultation Staff</Text>
                </TouchableOpacity>

                {/* Clinics */}
                <TouchableOpacity
                  style={styles.metricCard}
                  onPress={() => setActiveTab('clinics')}
                  activeOpacity={0.8}
                >
                  <View style={styles.metricCardHeader}>
                    <Text style={styles.metricLabel}>Clinics</Text>
                    <View style={styles.metricIconCircle}>
                      <Ionicons name="business-outline" size={19} color="#2E7D52" />
                    </View>
                  </View>
                  <Text style={styles.metricNumber}>{clinicsList.length}</Text>
                  <Text style={styles.metricSub}>Active OPD</Text>
                </TouchableOpacity>
              </View>

              <View style={[styles.metricsRow, { marginTop: 14 }]}>
                {/* Pharmacy */}
                <TouchableOpacity
                  style={styles.metricCard}
                  onPress={() => setActiveTab('pharmacy_labs')}
                  activeOpacity={0.8}
                >
                  <View style={styles.metricCardHeader}>
                    <Text style={styles.metricLabel}>Pharmacy</Text>
                    <View style={styles.metricIconCircle}>
                      <Ionicons name="bandage-outline" size={19} color="#2E7D52" />
                    </View>
                  </View>
                  <Text style={styles.metricNumber}>{pharmaciesList.length}</Text>
                  <Text style={styles.metricSub}>Dispensaries</Text>
                </TouchableOpacity>

                {/* Diagnostics */}
                <TouchableOpacity
                  style={styles.metricCard}
                  onPress={() => setActiveTab('pharmacy_labs')}
                  activeOpacity={0.8}
                >
                  <View style={styles.metricCardHeader}>
                    <Text style={styles.metricLabel}>Diagnostics</Text>
                    <View style={styles.metricIconCircle}>
                      <Ionicons name="flask-outline" size={19} color="#2E7D52" />
                    </View>
                  </View>
                  <Text style={styles.metricNumber}>{labsList.length}</Text>
                  <Text style={styles.metricSub}>Lab Stations</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Quick Add Section Card */}
            <View style={styles.quickAddCard}>
              <Text style={styles.quickAddTitle}>Quick add</Text>
              <View style={styles.quickAddRow}>
                {/* Doctor */}
                <TouchableOpacity
                  style={styles.quickAddItem}
                  onPress={() => openAddModal('doctor')}
                  activeOpacity={0.7}
                >
                  <View style={styles.quickAddCircle}>
                    <Ionicons name="people-outline" size={24} color="#2E7D52" />
                  </View>
                  <Text style={styles.quickAddLabel}>Doctor</Text>
                </TouchableOpacity>

                {/* Clinic */}
                <TouchableOpacity
                  style={styles.quickAddItem}
                  onPress={() => openAddModal('clinic')}
                  activeOpacity={0.7}
                >
                  <View style={styles.quickAddCircle}>
                    <Ionicons name="business-outline" size={24} color="#2E7D52" />
                  </View>
                  <Text style={styles.quickAddLabel}>Clinic</Text>
                </TouchableOpacity>

                {/* Counter */}
                <TouchableOpacity
                  style={styles.quickAddItem}
                  onPress={() => openAddModal('counter')}
                  activeOpacity={0.7}
                >
                  <View style={styles.quickAddCircle}>
                    <Ionicons name="bandage-outline" size={24} color="#2E7D52" />
                  </View>
                  <Text style={styles.quickAddLabel}>Counter</Text>
                </TouchableOpacity>

                {/* Lab Unit */}
                <TouchableOpacity
                  style={styles.quickAddItem}
                  onPress={() => openAddModal('lab')}
                  activeOpacity={0.7}
                >
                  <View style={styles.quickAddCircle}>
                    <Ionicons name="flask-outline" size={24} color="#2E7D52" />
                  </View>
                  <Text style={styles.quickAddLabel}>Lab Unit</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* ============================================================== */}
        {/* TAB 2: DOCTORS & ROOMS                                        */}
        {/* ============================================================== */}
        {activeTab === 'doctors' && (
          <View>
            <View style={styles.heroBanner}>
              <View style={styles.heroTopRow}>
                <View>
                  <Text style={styles.heroTitle}>Doctors & Rooms</Text>
                  <Text style={styles.heroSubtitle}>Assign rooms for QR scan connections</Text>
                </View>
                <TouchableOpacity
                  style={styles.headerActionPill}
                  onPress={() => openAddModal('doctor')}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add" size={18} color="#FFFFFF" style={{ marginRight: 2 }} />
                  <Text style={styles.headerActionText}>New</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.listContainer}>
              {doctorsList.map((doc) => (
                <View key={doc.id} style={styles.itemCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.docCodeText}>{doc.code}</Text>
                    <Text style={styles.itemNameText}>{doc.name}</Text>
                    <Text style={styles.itemSubGreen}>{doc.clinic}</Text>
                  </View>
                  <View style={styles.itemRightRow}>
                    <View style={styles.availableBadge}>
                      <Text style={styles.availableBadgeText}>{doc.status}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.editCircleBtn}
                      onPress={() => openEditModal('doctor', doc)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="pencil" size={17} color="#2E7D52" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ============================================================== */}
        {/* TAB 3: CLINICS & OPDS                                         */}
        {/* ============================================================== */}
        {activeTab === 'clinics' && (
          <View>
            <View style={styles.heroBanner}>
              <View style={styles.heroTopRow}>
                <View>
                  <Text style={styles.heroTitle}>Clinics & OPDs</Text>
                  <Text style={styles.heroSubtitle}>Open for mobile token bookings</Text>
                </View>
                <TouchableOpacity
                  style={styles.headerActionPill}
                  onPress={() => openAddModal('clinic')}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add" size={18} color="#FFFFFF" style={{ marginRight: 2 }} />
                  <Text style={styles.headerActionText}>New</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.listContainer}>
              {clinicsList.map((clinic) => (
                <View key={clinic.id} style={styles.clinicCard}>
                  {/* Left Room Badge */}
                  <View style={styles.roomBox}>
                    <Text style={styles.roomBoxText}>{clinic.room}</Text>
                  </View>

                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.clinicTitle}>{clinic.name}</Text>
                    <Text style={styles.clinicServices}>{clinic.services}</Text>
                    <View style={styles.operationalRow}>
                      <View style={styles.tinyGreenDot} />
                      <Text style={styles.operationalText}>
                        Operational · {clinic.slots}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.editCircleBtn}
                    onPress={() => openEditModal('clinic', clinic)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="pencil" size={17} color="#2E7D52" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ============================================================== */}
        {/* TAB 4: PHARMACIES & LABS                                      */}
        {/* ============================================================== */}
        {activeTab === 'pharmacy_labs' && (
          <View>
            <View style={styles.heroBanner}>
              <View style={styles.heroTopRow}>
                <View>
                  <Text style={styles.heroTitle}>Pharmacies & Labs</Text>
                  <Text style={styles.heroSubtitle}>Dispensary counters and lab units</Text>
                </View>
                <TouchableOpacity
                  style={styles.headerActionPill}
                  onPress={() => openAddModal('counter')}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add" size={18} color="#FFFFFF" style={{ marginRight: 2 }} />
                  <Text style={styles.headerActionText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.listContainer}>
              {/* Section 1: Dispensary Counters */}
              <Text style={styles.sectionHeaderTitle}>Dispensary Counters</Text>
              {pharmaciesList.map((pharm) => (
                <View key={pharm.id} style={styles.itemCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemNameText}>{pharm.name}</Text>
                    <Text style={styles.itemSubGray}>{pharm.officer}</Text>
                  </View>
                  <View style={styles.itemRightRow}>
                    <View style={styles.activePillBadge}>
                      <Text style={styles.activePillText}>{pharm.status}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.editCircleBtn}
                      onPress={() => openEditModal('counter', pharm)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="pencil" size={17} color="#2E7D52" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              {/* Section 2: Diagnostic Lab Units */}
              <Text style={[styles.sectionHeaderTitle, { marginTop: 18 }]}>
                Diagnostic Lab Units
              </Text>
              {labsList.map((lab) => (
                <View key={lab.id} style={styles.itemCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemNameText}>{lab.name}</Text>
                    <Text style={styles.itemSubGray}>{lab.officer}</Text>
                  </View>
                  <View style={styles.itemRightRow}>
                    <View style={styles.activePillBadge}>
                      <Text style={styles.activePillText}>{lab.status}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.editCircleBtn}
                      onPress={() => openEditModal('lab', lab)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="pencil" size={17} color="#2E7D52" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* ============================================================== */}
      {/* FLOATING CURVED BOTTOM NAVIGATION BAR                         */}
      {/* ============================================================== */}
      <View style={styles.bottomNavWrapper}>
        <View style={styles.bottomNavBar}>
          {/* Tab 1: Overview */}
          <TouchableOpacity
            style={styles.bottomNavItem}
            onPress={() => setActiveTab('overview')}
            activeOpacity={0.8}
          >
            {activeTab === 'overview' ? (
              <View style={styles.elevatedActiveCircle}>
                <Ionicons name="apps" size={24} color="#FFFFFF" />
              </View>
            ) : (
              <Ionicons name="apps-outline" size={24} color="#5A7366" />
            )}
          </TouchableOpacity>

          {/* Tab 2: Doctors */}
          <TouchableOpacity
            style={styles.bottomNavItem}
            onPress={() => setActiveTab('doctors')}
            activeOpacity={0.8}
          >
            {activeTab === 'doctors' ? (
              <View style={styles.elevatedActiveCircle}>
                <Ionicons name="people" size={24} color="#FFFFFF" />
              </View>
            ) : (
              <Ionicons name="people-outline" size={24} color="#5A7366" />
            )}
          </TouchableOpacity>

          {/* Tab 3: Clinics */}
          <TouchableOpacity
            style={styles.bottomNavItem}
            onPress={() => setActiveTab('clinics')}
            activeOpacity={0.8}
          >
            {activeTab === 'clinics' ? (
              <View style={styles.elevatedActiveCircle}>
                <Ionicons name="business" size={24} color="#FFFFFF" />
              </View>
            ) : (
              <Ionicons name="business-outline" size={24} color="#5A7366" />
            )}
          </TouchableOpacity>

          {/* Tab 4: Pharmacies & Labs */}
          <TouchableOpacity
            style={styles.bottomNavItem}
            onPress={() => setActiveTab('pharmacy_labs')}
            activeOpacity={0.8}
          >
            {activeTab === 'pharmacy_labs' ? (
              <View style={styles.elevatedActiveCircle}>
                <Ionicons name="bandage" size={24} color="#FFFFFF" />
              </View>
            ) : (
              <Ionicons name="bandage-outline" size={24} color="#5A7366" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* ============================================================== */}
      {/* ADD / EDIT MODAL                                               */}
      {/* ============================================================== */}
      <Modal visible={modalType !== null} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalHeading}>
              {editingItem ? 'Edit ' : 'Add '}
              {modalType === 'doctor'
                ? 'Doctor'
                : modalType === 'clinic'
                ? 'Clinic'
                : modalType === 'counter'
                ? 'Dispensary Counter'
                : 'Lab Unit'}
            </Text>

            <TextInput
              style={styles.modalInputField}
              placeholder={
                modalType === 'doctor'
                  ? 'Doctor Designation / Name'
                  : modalType === 'clinic'
                  ? 'Clinic Name (e.g. Pediatric Clinic)'
                  : 'Name / Title'
              }
              placeholderTextColor="#94A3B8"
              value={formName}
              onChangeText={setFormName}
            />

            {modalType === 'clinic' && (
              <TextInput
                style={styles.modalInputField}
                placeholder="Room Number (e.g. Room 01)"
                placeholderTextColor="#94A3B8"
                value={formRoom}
                onChangeText={setFormRoom}
              />
            )}

            <TextInput
              style={styles.modalInputField}
              placeholder={
                modalType === 'doctor'
                  ? 'Assigned Clinic (e.g. General OPD)'
                  : modalType === 'clinic'
                  ? 'Services (e.g. Fever Screening · BP)'
                  : 'Assigned Staff / Officer'
              }
              placeholderTextColor="#94A3B8"
              value={formSub}
              onChangeText={setFormSub}
            />

            <View style={styles.modalButtonRow}>
              {editingItem && (
                <TouchableOpacity
                  style={styles.modalDeleteBtn}
                  onPress={handleDeleteCurrent}
                >
                  <Text style={styles.modalDeleteText}>Delete</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setModalType(null)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSave}>
                <Text style={styles.modalSaveText}>Save</Text>
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
    paddingBottom: 36,
    paddingHorizontal: 22,
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
  backHubBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F4EA',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    marginTop: 18,
  },
  greenDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#2E7D52',
    marginRight: 6,
  },
  onlineBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2E7D52',
  },
  headerActionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  headerActionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  /* 2x2 Metric Cards Grid */
  metricsContainer: {
    paddingHorizontal: 18,
    marginTop: -16,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 14,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  metricCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  metricIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#E6F4EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricNumber: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 6,
  },
  metricSub: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2E7D52',
    marginTop: 2,
  },

  /* Quick Add Card */
  quickAddCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 18,
    marginTop: 18,
    borderRadius: 22,
    padding: 18,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  quickAddTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 16,
  },
  quickAddRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  quickAddItem: {
    alignItems: 'center',
  },
  quickAddCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E6F4EA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickAddLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },

  /* General List Container */
  listContainer: {
    paddingHorizontal: 18,
    marginTop: -14,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  docCodeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  itemNameText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  itemSubGreen: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2E7D52',
    marginTop: 2,
  },
  itemSubGray: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  itemRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  availableBadge: {
    backgroundColor: '#E6F4EA',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  availableBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2E7D52',
  },
  activePillBadge: {
    backgroundColor: '#E6F4EA',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2E7D52',
  },
  editCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E6F4EA',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Clinics Card */
  clinicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  roomBox: {
    backgroundColor: '#E6F4EA',
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 64,
  },
  roomBoxText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2E7D52',
  },
  clinicTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  clinicServices: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  operationalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  tinyGreenDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#2E7D52',
    marginRight: 5,
  },
  operationalText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2E7D52',
  },

  /* Section Header */
  sectionHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
    marginTop: 6,
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
    paddingHorizontal: 12,
  },
  bottomNavItem: {
    width: 50,
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
  modalDeleteBtn: {
    marginRight: 'auto',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  modalDeleteText: {
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 13,
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
