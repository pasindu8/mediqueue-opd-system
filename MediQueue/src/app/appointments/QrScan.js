import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, CameraView } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getPatientDetails, createAppointment } from '../../services/appointmentsService';
import { router } from 'expo-router';

const PRIMARY_GREEN = '#0B5338';
const BG_COLOR = '#EDF5FA';

export default function ScanQRScreen() {
  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const [hasMediaLibraryPermission, setHasMediaLibraryPermission] = useState(null);
  
  // Boolean state for torch toggle (true / false)
  const [torch, setTorch] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [scannedData, setScannedData] = useState(null);

  // Request camera and media library permissions
  useEffect(() => {
    (async () => {
      const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
      setHasCameraPermission(cameraStatus === 'granted');

      const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      setHasMediaLibraryPermission(mediaStatus === 'granted');
    })();
  }, []);

  // Toggle camera torch on / off
  const toggleTorch = () => {
    setTorch((prev) => !prev);
  };

  // Callback triggered when QR code is scanned
  const handleBarCodeScanned = ({ data }) => {
    setScanned(true);
    setScannedData(data);

    // 1. Parse QR JSON and extract appointment details
    let parsed = null;
    try {
      parsed = typeof data === 'string' ? JSON.parse(data) : data;
    } catch (e) {
      parsed = null;
    }

    const doctorName = parsed?.doctorName || 'Medical Officer';
    const clinicName = parsed?.clinicName || 'General OPD Clinic';
    const roomNumber = parsed?.roomNumber || 'Room 01';
    const hospitalId = parsed?.hospitalId || (parsed?.type === 'MEDIQUEUE_DESK' ? parsed?.hospitalId : null);

    if (!parsed || !hospitalId) {
      Alert.alert(
        'Invalid QR Code',
        'Please scan the official MediQueue QR code displayed on the doctor desk monitor.',
        [{ text: 'Scan Again', onPress: () => setScanned(false) }]
      );
      return;
    }

    // Clean, professional Alert instead of raw JSON string
    Alert.alert(
      `👨‍⚕️ ${doctorName}`,
      `Clinic: ${clinicName}\nRoom: ${roomNumber}\n\nDo you want to connect to this doctor and transmit your medical profile?`,
      [
        {
          text: 'Connect to Desk',
          onPress: async () => {
            try {
              // 2. AsyncStorage eken userId gananava
              let userId = await AsyncStorage.getItem('userId');
              if (!userId) {
                userId = await AsyncStorage.getItem('patientId');
              }

              if (!userId) {
                Alert.alert(
                  'Login Required',
                  'Please sign in to your MediQueue account to connect with the clinic desk.',
                  [
                    { text: 'Cancel', onPress: () => setScanned(false), style: 'cancel' },
                    { text: 'Sign In', onPress: () => { setScanned(false); router.push('/LoginPhone'); } }
                  ]
                );
                return;
              }

              // 3. Resolve patientId (supports both direct userId and patient._id)
              let targetPatientId = userId.trim();
              try {
                const patientRes = await getPatientDetails(userId.trim());
                if (patientRes?.data?._id) {
                  targetPatientId = patientRes.data._id;
                }
              } catch (e) {
                // If patient fetch has warning, still use targetPatientId = userId
              }

              // 4. Backend ekata appointment create karanava
              const today = new Date();
              const appointmentDate = today.toISOString();
              const appointmentTime = today.toTimeString().split(' ')[0]; // HH:MM:SS

              const result = await createAppointment(
                targetPatientId,
                hospitalId,
                appointmentDate,
                appointmentTime,
                {
                  clinicName,
                  roomNumber,
                  doctorName,
                  isWalkIn: true,
                }
              );

              if (result.ok || result.status === 201 || result.data?.success) {
                const token = result.data?.appointment?.tokenNumber || result.data?.tokenNumber || 'A 001';
                
                // Store active token in AsyncStorage
                const tokenPayload = {
                  appointmentId: result.data?.appointment?._id,
                  tokenNumber: token,
                  hospitalId: hospitalId,
                  doctorName: doctorName,
                  roomNumber: roomNumber,
                  clinicName: clinicName,
                  appointmentDate: appointmentDate,
                  status: 'scheduled'
                };
                await AsyncStorage.setItem('activeToken', JSON.stringify(tokenPayload));

                Alert.alert(
                  '✅ Connected to Doctor Desk!',
                  `Your Token: ${token}\nRoom: ${roomNumber}\nDoctor: ${doctorName}\n\nYour medical record has been transmitted to the doctor dashboard!`,
                  [
                    {
                      text: 'View Queue',
                      onPress: () => router.push('/(tabs)/queue'),
                    }
                  ]
                );
              } else {
                const msg = result.data?.message || 'Failed to connect. Please try again.';
                Alert.alert('Notice', msg, [{ text: 'OK', onPress: () => setScanned(false) }]);
              }
            } catch (err) {
              console.error('Queue join error:', err);
              Alert.alert('Error', 'Connection error. Please try again.', [{ text: 'OK', onPress: () => setScanned(false) }]);
            }
          },
        },
        {
          text: 'Scan Again',
          onPress: () => setScanned(false),
          style: 'cancel',
        },
      ]
    );
  };


  // Select QR image from gallery
  const pickImage = async () => {
    if (hasMediaLibraryPermission === false) {
      Alert.alert('Permission Required', 'Please allow gallery access to pick QR codes.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      Alert.alert('Image Selected', 'QR Code decoding from gallery image requires additional processing.');
    }
  };

  if (hasCameraPermission === null) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={PRIMARY_GREEN} />
      </View>
    );
  }

  if (hasCameraPermission === false) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Camera access has not been granted.</Text>
        <TouchableOpacity
          style={styles.permissionBtn}
          onPress={() => Camera.requestCameraPermissionsAsync()}
        >
          <Text style={styles.permissionBtnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* 1. Header Banner */}
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
            <Text style={styles.headerTitle}>Scan QR Code</Text>
            <Text style={styles.headerSubtitle}>
              Frame the clinic QR code to proceed
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. Main QR Scanner Card */}
        <View style={styles.scanCardWrapper}>
          <View style={styles.scanCard}>
            
            {/* Camera Viewfinder */}
            <View style={styles.cameraContainer}>
              <CameraView
                style={styles.camera}
                enableTorch={torch}
                barcodeScannerSettings={{
                  barcodeTypes: ['qr'],
                }}
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
              >
                {/* Visual Viewfinder Frame Mask */}
                <View style={styles.maskContainer}>
                  <View style={styles.maskUnfocused} />
                  <View style={styles.maskMiddleRow}>
                    <View style={styles.maskUnfocused} />
                    <View style={styles.maskFocused}>
                      <View style={[styles.corner, styles.tl]} />
                      <View style={[styles.corner, styles.tr]} />
                      <View style={[styles.corner, styles.bl]} />
                      <View style={[styles.corner, styles.br]} />
                    </View>
                    <View style={styles.maskUnfocused} />
                  </View>
                  <View style={styles.maskUnfocused} />
                </View>
              </CameraView>
            </View>

            {/* Control Bar: QR Badge & Action Buttons */}
            <View style={styles.controlsSection}>
              <View style={styles.sectionLabel}>
                <MaterialCommunityIcons
                  name="qrcode-scan"
                  size={18}
                  color={PRIMARY_GREEN}
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.scanLabelText}>Scan QR</Text>
              </View>

              <View style={styles.pillsRow}>
                {/* Torch / Flash Button */}
                <TouchableOpacity
                  style={[
                    styles.actionPill,
                    torch && styles.actionPillActive,
                  ]}
                  onPress={toggleTorch}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={torch ? 'flash' : 'flash-off'}
                    size={22}
                    color={torch ? '#15803D' : PRIMARY_GREEN}
                  />
                </TouchableOpacity>

                {/* Gallery Button */}
                <TouchableOpacity
                  style={styles.actionPill}
                  onPress={pickImage}
                  activeOpacity={0.7}
                >
                  <Ionicons name="image-outline" size={22} color={PRIMARY_GREEN} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Instructions */}
            <Text style={styles.noticeText}>
              Center the clinic code within the frame.{'\n'}Ensure proper lighting.
            </Text>
          </View>
        </View>
        
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG_COLOR,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: BG_COLOR,
    padding: 20,
  },
  errorText: {
    fontSize: 14,
    color: '#334155',
    marginBottom: 16,
    textAlign: 'center',
  },
  permissionBtn: {
    backgroundColor: PRIMARY_GREEN,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  permissionBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
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
  scanCardWrapper: {
    marginHorizontal: 20,
    marginTop: 56,
  },
  scanCard: {
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
  cameraContainer: {
    height: 290,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: '#000000',
  },
  camera: {
    flex: 1,
  },
  maskContainer: {
    flex: 1,
  },
  maskMiddleRow: {
    flexDirection: 'row',
    height: 190,
  },
  maskUnfocused: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  maskFocused: {
    width: 190,
    height: 190,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    borderColor: '#FFFFFF',
    borderWidth: 3.5,
    borderRadius: 4,
  },
  tl: {
    top: 0,
    left: 0,
    width: 28,
    height: 28,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  tr: {
    top: 0,
    right: 0,
    width: 28,
    height: 28,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bl: {
    bottom: 0,
    left: 0,
    width: 28,
    height: 28,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  br: {
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  controlsSection: {
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#CCFBF1',
    marginBottom: 14,
  },
  scanLabelText: {
    color: PRIMARY_GREEN,
    fontSize: 13,
    fontWeight: '700',
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionPill: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionPillActive: {
    backgroundColor: '#DCFCE7',
    borderColor: '#16A34A',
  },
  noticeText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
    marginTop: 10,
    textAlign: 'center',
  },
  availabilityCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
  },
  availabilityTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 10,
  },
});