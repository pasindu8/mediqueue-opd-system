import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { allHospitals } from '../../services/hospitalService';
import { createAppointment } from '../../services/appointmentsService';

export default function NewTokenScreen() {
  const params = useLocalSearchParams();
  const [userName, setUserName] = useState('Patient');
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingHospitals, setFetchingHospitals] = useState(true);

  // Full list of hospitals from backend
  const [hospitals, setHospitals] = useState([]);

  // Form Selections
  const [selectedHospitalObj, setSelectedHospitalObj] = useState(null);
  const [selectedClinicObj, setSelectedClinicObj] = useState(null);
  const [selectedService, setSelectedService] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');

  // Date Selection
  const [appointmentDate, setAppointmentDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Modal Control ('hospital' | 'clinic' | 'service' | null)
  const [activeModal, setActiveModal] = useState(null);

  // 1. Fetch Hospitals from Backend
  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        setFetchingHospitals(true);
        const response = await allHospitals();

        let hospitalList = [];
        if (response?.data?.data && Array.isArray(response.data.data)) {
          hospitalList = response.data.data;
        } else if (Array.isArray(response?.data)) {
          hospitalList = response.data;
        }

        setHospitals(hospitalList);

        // Helper to normalize clinic data
        const normalizeClinic = (c) => ({
          _id: c._id || `clinic-${c.name || 'opd'}`,
          name: c.name || c.clinicName || 'General OPD Clinic',
          clinicName: c.name || c.clinicName || 'General OPD Clinic',
          roomNumber: c.roomNumber || 'Room 01',
          status: c.status || 'active',
          services: Array.isArray(c.services) && c.services.length > 0
            ? c.services
            : ['General Consultation', 'Routine Health Checkup', 'Follow-up Consultation'],
          timeSlots: Array.isArray(c.timeSlots) && c.timeSlots.length > 0
            ? c.timeSlots
            : ['08:00 AM - 10:30 AM', '11:00 AM - 01:30 PM', '02:00 PM - 04:30 PM'],
        });

        const defaultClinics = [
          {
            name: 'General OPD Clinic',
            roomNumber: 'Room 01',
            status: 'active',
            services: ['General Consultation', 'Routine Health Checkup', 'Fever Screening', 'Blood Pressure Check'],
            timeSlots: ['08:00 AM - 10:30 AM', '11:00 AM - 01:30 PM', '02:00 PM - 04:30 PM'],
          },
          {
            name: 'Cardiology Clinic',
            roomNumber: 'Room 04',
            status: 'active',
            services: ['ECG & Heart Checkup', 'Hypertension Review', 'Cardiac Consultation'],
            timeSlots: ['08:30 AM - 11:00 AM', '01:00 PM - 03:30 PM'],
          },
          {
            name: 'Dental Clinic',
            roomNumber: 'Room 06',
            status: 'active',
            services: ['Dental Scaling', 'Tooth Extraction', 'Cavity Filling', 'Oral Examination'],
            timeSlots: ['08:00 AM - 11:00 AM', '01:00 PM - 03:00 PM'],
          },
          {
            name: 'Eye Clinic / Ophthalmology',
            roomNumber: 'Room 08',
            status: 'active',
            services: ['Vision Acuity Testing', 'Cataract Assessment', 'Glaucoma Screening'],
            timeSlots: ['08:30 AM - 11:30 AM', '01:00 PM - 03:30 PM'],
          },
          {
            name: 'Diabetic & Endocrinology Clinic',
            roomNumber: 'Room 10',
            status: 'active',
            services: ['Fasting Blood Sugar Test', 'Insulin Review', 'Diabetic Foot Checkup'],
            timeSlots: ['08:00 AM - 10:30 AM', '11:00 AM - 01:30 PM'],
          },
          {
            name: 'Pediatric Clinic',
            roomNumber: 'Room 02',
            status: 'active',
            services: ['Childhood Immunization', 'Pediatric Health Checkup', 'Growth Assessment'],
            timeSlots: ['08:30 AM - 11:00 AM', '01:00 PM - 03:00 PM'],
          },
        ];

        // Set default hospital and clinics based on parameters or first available
        if (hospitalList.length > 0) {
          const matchedHospital = params?.hospitalId
            ? hospitalList.find((h) => String(h._id) === String(params.hospitalId)) || hospitalList[0]
            : hospitalList[0];

          setSelectedHospitalObj(matchedHospital);

          const rawClinics = Array.isArray(matchedHospital.clinics) && matchedHospital.clinics.length > 0
            ? matchedHospital.clinics
            : defaultClinics;

          const clinics = rawClinics.map(normalizeClinic);

          if (clinics.length > 0) {
            const matchedClinic = params?.clinicName
              ? clinics.find(
                  (c) =>
                    (c.name || c.clinicName)?.toLowerCase().includes(params.clinicName.toLowerCase()) ||
                    params.clinicName.toLowerCase().includes((c.name || c.clinicName)?.toLowerCase())
                ) || clinics[0]
              : clinics[0];

            setSelectedClinicObj(matchedClinic);
            setSelectedService(matchedClinic.services?.[0] || 'General Consultation');
            setSelectedSlot(matchedClinic.timeSlots?.[0] || '08:00 AM - 10:30 AM');
          }
        }
      } catch (error) {
        console.error('Error fetching hospitals:', error);
        Alert.alert('Error', 'Unable to load hospitals from server.');
      } finally {
        setFetchingHospitals(false);
      }
    };

    fetchHospitals();
  }, []);

  // 2. Fetch User information from AsyncStorage (userId, fullName)
  useEffect(() => {
    const fetchUserData = async () => {
      const storedId = await AsyncStorage.getItem('userId');
      const storedName = await AsyncStorage.getItem('fullName');
      if (storedId) setUserId(storedId);
      if (storedName) setUserName(storedName);
    };
    fetchUserData();
  }, []);

  const getClinicsForCurrentHospital = (hospital) => {
    if (!hospital) return [];
    if (Array.isArray(hospital.clinics) && hospital.clinics.length > 0) {
      return hospital.clinics.map((c) => ({
        _id: c._id || `clinic-${c.name || 'opd'}`,
        name: c.name || c.clinicName || 'General OPD Clinic',
        clinicName: c.name || c.clinicName || 'General OPD Clinic',
        roomNumber: c.roomNumber || 'Room 01',
        status: c.status || 'active',
        services: Array.isArray(c.services) && c.services.length > 0
          ? c.services
          : ['General Consultation', 'Routine Health Checkup', 'Follow-up Consultation'],
        timeSlots: Array.isArray(c.timeSlots) && c.timeSlots.length > 0
          ? c.timeSlots
          : ['08:00 AM - 10:30 AM', '11:00 AM - 01:30 PM', '02:00 PM - 04:30 PM'],
      }));
    }
    return [
      {
        _id: `def-opd-${hospital._id}`,
        name: 'General OPD Clinic',
        clinicName: 'General OPD Clinic',
        roomNumber: 'Room 01',
        status: 'active',
        services: ['General Consultation', 'Routine Health Checkup', 'Fever Screening', 'Blood Pressure Check'],
        timeSlots: ['08:00 AM - 10:30 AM', '11:00 AM - 01:30 PM', '02:00 PM - 04:30 PM'],
      },
      {
        _id: `def-cardio-${hospital._id}`,
        name: 'Cardiology Clinic',
        clinicName: 'Cardiology Clinic',
        roomNumber: 'Room 04',
        status: 'active',
        services: ['ECG & Heart Checkup', 'Hypertension Review', 'Cardiac Consultation'],
        timeSlots: ['08:30 AM - 11:00 AM', '01:00 PM - 03:30 PM'],
      },
      {
        _id: `def-dental-${hospital._id}`,
        name: 'Dental Clinic',
        clinicName: 'Dental Clinic',
        roomNumber: 'Room 06',
        status: 'active',
        services: ['Dental Scaling', 'Tooth Extraction', 'Cavity Filling', 'Oral Examination'],
        timeSlots: ['08:00 AM - 11:00 AM', '01:00 PM - 03:00 PM'],
      },
      {
        _id: `def-eye-${hospital._id}`,
        name: 'Eye Clinic / Ophthalmology',
        clinicName: 'Eye Clinic / Ophthalmology',
        roomNumber: 'Room 08',
        status: 'active',
        services: ['Vision Acuity Testing', 'Cataract Assessment', 'Glaucoma Screening'],
        timeSlots: ['08:30 AM - 11:30 AM', '01:00 PM - 03:30 PM'],
      },
      {
        _id: `def-diab-${hospital._id}`,
        name: 'Diabetic & Endocrinology Clinic',
        clinicName: 'Diabetic & Endocrinology Clinic',
        roomNumber: 'Room 10',
        status: 'active',
        services: ['Fasting Blood Sugar Test', 'Insulin Review', 'Diabetic Foot Checkup'],
        timeSlots: ['08:00 AM - 10:30 AM', '11:00 AM - 01:30 PM'],
      },
      {
        _id: `def-ped-${hospital._id}`,
        name: 'Pediatric Clinic',
        clinicName: 'Pediatric Clinic',
        roomNumber: 'Room 02',
        status: 'active',
        services: ['Childhood Immunization', 'Pediatric Health Checkup', 'Growth Assessment'],
        timeSlots: ['08:30 AM - 11:00 AM', '01:00 PM - 03:00 PM'],
      },
    ];
  };

  // Update clinics when a hospital is selected
  const handleSelectHospital = (hospital) => {
    setSelectedHospitalObj(hospital);
    const clinics = getClinicsForCurrentHospital(hospital);

    if (clinics.length > 0) {
      const firstClinic = clinics[0];
      setSelectedClinicObj(firstClinic);
      setSelectedService(firstClinic.services?.[0] || 'General Consultation');
      setSelectedSlot(firstClinic.timeSlots?.[0] || '08:00 AM - 10:30 AM');
    } else {
      setSelectedClinicObj(null);
      setSelectedService('');
      setSelectedSlot('');
    }
    setActiveModal(null);
  };

  // Update services when a clinic is selected
  const handleSelectClinic = (clinic) => {
    setSelectedClinicObj(clinic);
    setSelectedService(clinic.services?.[0] || 'General Consultation');
    setSelectedSlot(clinic.timeSlots?.[0] || '08:00 AM - 10:30 AM');
    setActiveModal(null);
  };

  const onDateChange = (event, date) => {
    setShowDatePicker(false);
    if (event.type === 'set' && date) {
      setAppointmentDate(date);
    }
  };

  const formatDate = (date) => {
    const today = new Date();
    const isToday =
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();

    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    const dateString = date.toLocaleDateString('en-US', options);
    return isToday ? `Today - ${dateString}` : dateString;
  };

  // 3. Primary function to call createAppointment API
  const handleConfirmToken = async () => {
    if (!selectedHospitalObj || !selectedClinicObj) {
      Alert.alert('Incomplete Details', 'Please select a hospital and clinic.');
      return;
    }

    const currentUserId = userId || (await AsyncStorage.getItem('userId'));
    if (!currentUserId) {
      Alert.alert('Profile Incomplete', 'Please log in or register your patient profile first.');
      return;
    }

    if (!selectedSlot) {
      Alert.alert('Select Time Slot', 'Please select a time slot.');
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const chosenDate = new Date(appointmentDate);
    chosenDate.setHours(0, 0, 0, 0);
    if (chosenDate < today) {
      Alert.alert('Invalid Date', 'Appointment date cannot be in the past. Please choose today or an upcoming date.');
      return;
    }

    try {
      setLoading(true);

      const formattedDate = appointmentDate.toISOString().split('T')[0];

      const clinicName = selectedClinicObj.clinicName || selectedClinicObj.name || 'General OPD Clinic';
      const roomNumber = selectedClinicObj.roomNumber || '01';

      // Call createAppointment API
      const result = await createAppointment(
        currentUserId,
        selectedHospitalObj._id,
        formattedDate,
        selectedSlot,
        {
          clinicId: selectedClinicObj._id,
          clinicName: clinicName,
          roomNumber: roomNumber,
          service: selectedService,
        }
      );

      if (result.ok) {
        // Appointment data returned from backend
        const appointmentData = result.data?.data || result.data?.appointment || result.data;
        const assignedToken = result.data?.tokenNumber || appointmentData?.tokenNumber || 'A 001';

        // Store active token details in AsyncStorage for Queue Screen
        const tokenPayload = {
          appointmentId: appointmentData?._id || appointmentData?.appointment?._id,
          hospitalId: selectedHospitalObj._id,
          hospitalName: selectedHospitalObj.name,
          clinicName: clinicName,
          roomNumber: roomNumber,
          service: selectedService,
          appointmentDate: formattedDate,
          timeSlot: selectedSlot,
          tokenNumber: assignedToken,
          status: appointmentData?.status || 'scheduled',
        };

        await AsyncStorage.setItem('activeToken', JSON.stringify(tokenPayload));

        Alert.alert(
          'Token Confirmed!',
          `Token ${assignedToken} booked successfully for ${clinicName}.\nRoom: ${roomNumber}\nEstimated wait time: ~15 mins`,
          [
            {
              text: 'View Queue',
              onPress: () => router.push('/(tabs)/queue'),
            },
          ]
        );
      } else {
        Alert.alert('Booking Failed', result.data?.message || 'Unable to book token.');
      }
    } catch (error) {
      console.error('Error creating appointment token:', error);
      Alert.alert('Network Error', 'Check backend server connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const availableClinics = getClinicsForCurrentHospital(selectedHospitalObj);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <LinearGradient
          colors={['#0B5338', '#127C55', '#24A876']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerBanner}
        >
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.headerBackBtn}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Create New Token</Text>
              <Text style={styles.headerSubtitle}>
                {userName} (Requesting Token)
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Form Card */}
        <View style={styles.tokenCardWrapper}>
          <View style={styles.mainCard}>
            <Text style={styles.cardHeaderTitle}>Token Details</Text>
            <Text style={styles.sectionSubTitle}>Service Selection</Text>

            {/* 1. Hospital Dropdown */}
            <Text style={styles.inputLabel}>Hospital / Branch</Text>
            <TouchableOpacity
              style={styles.selectBox}
              onPress={() => setActiveModal('hospital')}
              activeOpacity={0.8}
            >
              {fetchingHospitals ? (
                <ActivityIndicator size="small" color="#0D9488" />
              ) : (
                <Text style={styles.selectBoxText} numberOfLines={1}>
                  {selectedHospitalObj ? selectedHospitalObj.name : 'Select Hospital'}
                </Text>
              )}
              <Ionicons name="chevron-down" size={18} color="#64748B" />
            </TouchableOpacity>

            {/* 2. Clinic Dropdown */}
            <Text style={styles.inputLabel}>Select Clinic</Text>
            <TouchableOpacity
              style={styles.selectBox}
              onPress={() => setActiveModal('clinic')}
              activeOpacity={0.8}
            >
              <Text style={styles.selectBoxText}>
                {selectedClinicObj
                  ? (selectedClinicObj.clinicName || selectedClinicObj.name)
                  : 'Select Clinic'}
              </Text>
              <Ionicons name="chevron-down" size={18} color="#64748B" />
            </TouchableOpacity>

            {/* 3. Specific Service Dropdown */}
            <Text style={styles.inputLabel}>Select Specific Service</Text>
            <TouchableOpacity
              style={styles.selectBox}
              onPress={() => setActiveModal('service')}
              activeOpacity={0.8}
            >
              <Text style={styles.selectBoxText}>
                {selectedService || 'General Consultation'}
              </Text>
              <Ionicons name="chevron-down" size={18} color="#64748B" />
            </TouchableOpacity>

            {/* 4. Appointment Date */}
            <Text style={styles.inputLabel}>Appointment Date</Text>
            <TouchableOpacity
              style={styles.selectBox}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.selectBoxText}>{formatDate(appointmentDate)}</Text>
              <Ionicons name="calendar-outline" size={19} color="#0D9488" />
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={appointmentDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                minimumDate={new Date()}
                onChange={onDateChange}
              />
            )}

            {/* 5. Time Slot Selection */}
            <Text style={styles.inputLabel}>Time Slot</Text>
            <View style={styles.slotContainer}>
              {selectedClinicObj?.timeSlots?.length > 0 ? (
                selectedClinicObj.timeSlots.map((slot) => (
                  <TouchableOpacity
                    key={slot}
                    style={[
                      styles.slotChip,
                      selectedSlot === slot && styles.slotChipSelected,
                    ]}
                    onPress={() => setSelectedSlot(slot)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.slotChipText,
                        selectedSlot === slot && styles.slotChipTextSelected,
                      ]}
                    >
                      {slot}
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={[styles.slotChip, styles.slotChipSelected]}>
                  <Text style={styles.slotChipTextSelected}>Morning Session</Text>
                </View>
              )}
            </View>

            {/* Projected Token Preview */}
            <View style={styles.projectedBox}>
              <Text style={styles.projectedTokenTitle}>Projected Token: - ---</Text>
              <Text style={styles.projectedWaitText}>Projected Wait Time: ~15 mins</Text>

              <View style={styles.projectedDetailRow}>
                <View style={styles.projectedCol}>
                  <Text style={styles.projectedLabel}>Clinic:</Text>
                  <Text style={styles.projectedValue}>
                    {selectedClinicObj?.clinicName || selectedClinicObj?.name || 'General OPD'}
                  </Text>
                </View>
                <View style={styles.projectedCol}>
                  <Text style={styles.projectedLabel}>Room:</Text>
                  <Text style={styles.projectedValue}>
                    {selectedClinicObj?.roomNumber || 'Room 01'}
                  </Text>
                </View>
              </View>

              <View style={styles.statusBadge}>
                <Text style={styles.statusBadgeText}>
                  {selectedClinicObj?.status === 'active' ? 'Available' : 'Pending'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Submit Button */}
        <View style={styles.buttonWrapper}>
          <TouchableOpacity
            style={[styles.confirmButton, loading && { opacity: 0.7 }]}
            onPress={handleConfirmToken}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Text style={styles.confirmButtonText}>Confirm Request</Text>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={20}
                  color="#FFFFFF"
                  style={{ marginLeft: 6 }}
                />
              </>
            )}
          </TouchableOpacity>
          <Text style={styles.noticeText}>
            <Text style={{ fontWeight: '700' }}>Important Notice:</Text> Please
            confirm your appointment details before requesting the token.
          </Text>
        </View>
      </ScrollView>

      {/* Selectors Modal */}
      <Modal
        visible={activeModal !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveModal(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setActiveModal(null)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Select {activeModal === 'hospital' ? 'Hospital' : activeModal === 'clinic' ? 'Clinic' : 'Service'}
            </Text>

            <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
              {/* Hospital Options */}
              {activeModal === 'hospital' &&
                hospitals.map((hosp) => (
                  <TouchableOpacity
                    key={hosp._id || hosp.name}
                    style={styles.modalOption}
                    onPress={() => handleSelectHospital(hosp)}
                  >
                    <Text
                      style={[
                        styles.modalOptionText,
                        selectedHospitalObj?._id === hosp._id && styles.modalOptionSelected,
                      ]}
                    >
                      {hosp.name}
                    </Text>
                  </TouchableOpacity>
                ))}

              {/* Clinic Options */}
              {activeModal === 'clinic' &&
                availableClinics.map((clinic, index) => {
                  const cName = clinic.clinicName || clinic.name;
                  const isSelected =
                    selectedClinicObj &&
                    (selectedClinicObj._id === clinic._id ||
                      (selectedClinicObj.clinicName || selectedClinicObj.name) === cName);

                  return (
                    <TouchableOpacity
                      key={clinic._id || index}
                      style={styles.modalOption}
                      onPress={() => handleSelectClinic(clinic)}
                    >
                      <Text
                        style={[
                          styles.modalOptionText,
                          isSelected && styles.modalOptionSelected,
                        ]}
                      >
                        {cName} ({clinic.roomNumber || 'Room 01'})
                      </Text>
                    </TouchableOpacity>
                  );
                })}

              {/* Service Options */}
              {activeModal === 'service' &&
                (selectedClinicObj?.services || ['General Consultation', 'Routine Health Checkup']).map((srv, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.modalOption}
                    onPress={() => {
                      setSelectedService(srv);
                      setActiveModal(null);
                    }}
                  >
                    <Text
                      style={[
                        styles.modalOptionText,
                        selectedService === srv && styles.modalOptionSelected,
                      ]}
                    >
                      {srv}
                    </Text>
                  </TouchableOpacity>
                ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EDF5FA',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  headerBanner: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 44,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  headerSubtitle: {
    fontSize: 13,
    color: '#D1FAE5',
    fontWeight: '500',
    marginTop: 2,
  },
  tokenCardWrapper: {
    marginHorizontal: 20,
    marginTop: -26,
  },
  mainCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 4,
  },
  cardHeaderTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  sectionSubTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0B5338',
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#475569',
    marginTop: 10,
    marginBottom: 5,
  },
  selectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.2,
    borderColor: '#0D9488',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  selectBoxText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
  },
  slotContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  slotChip: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  slotChipSelected: {
    backgroundColor: '#0D9488',
    borderColor: '#0D9488',
  },
  slotChipText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'center',
  },
  slotChipTextSelected: {
    color: '#FFFFFF',
  },
  projectedBox: {
    backgroundColor: '#F0FDFA',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginTop: 18,
    borderWidth: 1,
    borderColor: '#99F6E4',
  },
  projectedTokenTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0D9488',
    marginBottom: 4,
  },
  projectedWaitText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#134E4A',
    marginBottom: 12,
  },
  projectedDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  projectedCol: {
    alignItems: 'center',
  },
  projectedLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  projectedValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  statusBadge: {
    backgroundColor: '#DCFCE7',
    paddingVertical: 4,
    paddingHorizontal: 14,
    borderRadius: 16,
  },
  statusBadgeText: {
    color: '#15803D',
    fontSize: 12,
    fontWeight: '700',
  },
  buttonWrapper: {
    marginHorizontal: 20,
    marginTop: 16,
  },
  confirmButton: {
    backgroundColor: '#2E7D32',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    elevation: 3,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  noticeText: {
    fontSize: 11.5,
    color: '#475569',
    lineHeight: 16,
    marginTop: 10,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 8,
  },
  modalOption: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalOptionText: {
    fontSize: 14,
    color: '#334155',
  },
  modalOptionSelected: {
    color: '#0D9488',
    fontWeight: '700',
  },
});