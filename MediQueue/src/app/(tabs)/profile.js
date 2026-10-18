import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language;

  const [loading, setLoading] = useState(true);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [nic, setNic] = useState(''); 
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [userId, setUserId] = useState('');
  const [storedPatientId, setStoredPatientId] = useState('');

  
  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
    setIsDropdownVisible(false);
  };

 
  const languageOptions = [
    { label: 'English', value: 'en' },
    { label: 'සිංහල', value: 'si' },
    { label: 'தமிழ்', value: 'ta' },
  ];

  
  const getCurrentLanguageLabel = () => {
    const selected = languageOptions.find((opt) => opt.value === currentLang);
    return selected ? selected.label : 'English';
  };

  const handleLogout = async () => {
    try {
      setLoading(true);
      await AsyncStorage.multiRemove(['userId', 'token', 'name', 'NIC', 'phoneNumber', 'type']);
      router.replace('/LoginNIC');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchNIC = async () => {
      try {
        //userId, name, NIC, phoneNumber
        const storedUserId = await AsyncStorage.getItem('userId');
        const storedName = await AsyncStorage.getItem('name');
        const storedPhoneNumber = await AsyncStorage.getItem('phoneNumber');
        const storedNIC = await AsyncStorage.getItem('NIC');
        const storedPatientId = await AsyncStorage.getItem('patientId');
        if (storedNIC !== null && storedName !== null && storedPhoneNumber !== null && storedUserId !== null && storedPatientId !== null) {
          setNic(storedNIC);
          setName(storedName);
          setPhoneNumber(storedPhoneNumber);
          setUserId(storedUserId);
          setStoredPatientId(storedPatientId);
        }
      } catch (error) {
        console.error('Error fetching NIC from AsyncStorage:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNIC();
  }, []); 

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="small" color="#0D9488" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner */}
        <LinearGradient
          colors={['#0B5338', '#127C55', '#24A876']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerBanner}
        />

        {/* User Info */}
        <View style={styles.profileSection}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>N</Text>
          </View>
          <Text style={styles.userName}>{name}</Text>
          <Text style={styles.userSubtitle}>{nic}</Text>
          <Text style={styles.userId}>Patient ID: #{storedPatientId}</Text>
        </View>

        {/* Menu Items */}
        <View style={styles.menuCard}>
          {/* Account Details */}
          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => router.push('/profile/accountDetails')}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="person-circle" size={22} color="#0F3A5D" />
              <Text style={styles.menuTitle}>Account Details</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Language Dropdown Trigger */}
          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => setIsDropdownVisible(true)}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="language" size={22} color="#0F3A5D" />
              <Text style={styles.menuTitle}>Language</Text>
            </View>

            <View style={styles.languagePicker}>
              <Text style={styles.languageText}>{getCurrentLanguageLabel()}</Text>
              <Ionicons
                name={isDropdownVisible ? 'chevron-up' : 'chevron-down'}
                size={14}
                color="#64748B"
              />
            </View>
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Notifications */}
          <TouchableOpacity 
            style={styles.menuItem} 
            activeOpacity={0.7}
            onPress={() => router.push('/profile/notifications')}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="notifications" size={22} color="#0F3A5D" />
              <Text style={styles.menuTitle}>Notifications</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Help & Support */}
          <TouchableOpacity 
            style={styles.menuItem} 
            activeOpacity={0.7}
            onPress={() => router.push('/profile/helpSupport')}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="help-circle" size={22} color="#0F3A5D" />
              <Text style={styles.menuTitle}>Help & Support</Text>
            </View>
          </TouchableOpacity>

          {/* Log Out Button */}
          <TouchableOpacity
            style={[styles.logoutBtn, loading && { opacity: 0.7 }]}
            onPress={handleLogout}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Ionicons
                  name="log-out-outline"
                  size={20}
                  color="#FFFFFF"
                  style={styles.logoutIcon}
                />
                <Text style={styles.logoutText}>Log Out</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Language Selection Modal */}
      <Modal
        visible={isDropdownVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsDropdownVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setIsDropdownVisible(false)}
        >
          <View style={styles.dropdownDialog}>
            <Text style={styles.dropdownHeader}>Select Language</Text>

            {languageOptions.map((item) => {
              const isSelected = currentLang === item.value;
              return (
                <TouchableOpacity
                  key={item.value}
                  style={[
                    styles.optionItem,
                    isSelected && styles.selectedOptionItem,
                  ]}
                  activeOpacity={0.7}
                  onPress={() => changeLanguage(item.value)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      isSelected && styles.selectedOptionText,
                    ]}
                  >
                    {item.label}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={20} color="#0D9488" />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
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
    paddingBottom: 130,
  },
  headerBanner: {
    height: 110,
    width: '100%',
  },
  profileSection: {
    alignItems: 'center',
    marginTop: -45,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  avatarCircle: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: '#5C748C',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    elevation: 4,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    marginBottom: 10,
  },
  avatarText: {
    fontSize: 34,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  userSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 2,
  },
  userId: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '500',
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 16,
    elevation: 3,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuTitle: {
    fontSize: 14.5,
    fontWeight: '600',
    color: '#1E293B',
  },
  languagePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  languageText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  logoutBtn: {
    backgroundColor: '#C53030',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 12,
    marginBottom: 10,
  },
  logoutIcon: {
    marginRight: 6,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '700',
  },

  /* Dropdown Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  dropdownDialog: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  dropdownHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginVertical: 2,
  },
  selectedOptionItem: {
    backgroundColor: '#F0FDFA',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#334155',
  },
  selectedOptionText: {
    color: '#0D9488',
    fontWeight: '700',
  },
});