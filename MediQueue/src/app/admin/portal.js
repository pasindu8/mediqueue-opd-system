import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AdminPortalHub() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [adminUser, setAdminUser] = useState(null);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const userStr = await AsyncStorage.getItem('adminUser');
      if (userStr) {
        setAdminUser(JSON.parse(userStr));
      }
    } catch (e) {
      console.log('Error reading adminUser in portal:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Log out of Hospital Admin Suite?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem('adminRole');
          await AsyncStorage.removeItem('adminUser');
          await AsyncStorage.removeItem('adminName');
          router.replace('/AdminLogin');
        },
      },
    ]);
  };

  const MODULES = [
    {
      path: '/admin/it-support',
      title: 'Hospital IT Desk',
      subtitle: 'Doctors roster, clinics allocation, pharmacy counters & lab stations setup.',
      badge: 'ROSTER & CONFIG',
      icon: 'server-outline',
      stats: '4 Units Configured',
    },
    {
      path: '/admin/super-admin',
      title: 'Hospital Grid',
      subtitle: 'Ministry of Health national directory, district OPDs & IT leads onboarding.',
      badge: 'NATIONAL GRID',
      icon: 'business-outline',
      stats: '11 Hospitals Online',
    },
    {
      path: '/admin/doctor',
      title: 'Doctors & Rooms',
      subtitle: 'Calling clinic tokens with voice broadcast, clinical diagnosis & prescriptions.',
      badge: 'CONSULTATION',
      icon: 'people-outline',
      stats: '5 Doctors Available',
    },
    {
      path: '/admin/pharmacy',
      title: 'Pharmacies & Dispensary',
      subtitle: 'Counter allocation, interactive medication checklist & prescription dispensing.',
      badge: 'DISPENSARY',
      icon: 'bandage-outline',
      stats: '3 Dispensary Counters',
    },
    {
      path: '/admin/lab',
      title: 'Diagnostic Laboratory',
      subtitle: 'Sample testing, assay result parameters entry & critical doctor alerts.',
      badge: 'LAB STATIONS',
      icon: 'flask-outline',
      stats: '3 Lab Stations',
    },
    {
      path: '/admin/queue',
      title: 'Central Queue Dispatcher',
      subtitle: 'Central now-calling token billboard, audio broadcast & emergency triage tickets.',
      badge: 'LIVE QUEUE',
      icon: 'megaphone-outline',
      stats: 'Real-Time Sync',
    },
  ];

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
              loadUserData();
            }}
            tintColor="#FFFFFF"
          />
        }
      >
        {/* Curved Green Hero Banner */}
        <View style={styles.heroBanner}>
          <View style={styles.heroTopRow}>
            <View>
              <Text style={styles.heroTitle}>MediQueue Admin</Text>
              <Text style={styles.heroSubtitle}>
                {adminUser?.hospital || 'District General Hospital - Kalutara'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={handleLogout}
              activeOpacity={0.8}
            >
              <Ionicons name="log-out-outline" size={19} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Online Pill Badge */}
          <View style={styles.onlineBadge}>
            <View style={styles.greenDot} />
            <Text style={styles.onlineBadgeText}>
              Logged In: {adminUser?.name || 'Hospital Administrator'}
            </Text>
          </View>
        </View>

        {/* Modules Section */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionHeading}>Hospital Governance Modules</Text>
          <Text style={styles.sectionSubtitle}>
            Select a module to view and manage hospital operations
          </Text>

          {MODULES.map((item, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.moduleCard}
              onPress={() => router.push(item.path)}
              activeOpacity={0.8}
            >
              <View style={styles.moduleHeaderRow}>
                <View style={styles.moduleIconCircle}>
                  <Ionicons name={item.icon} size={22} color="#2E7D52" />
                </View>
                <View style={styles.badgePill}>
                  <Text style={styles.badgePillText}>{item.badge}</Text>
                </View>
              </View>

              <Text style={styles.moduleTitle}>{item.title}</Text>
              <Text style={styles.moduleSub}>{item.subtitle}</Text>

              <View style={styles.moduleFooterRow}>
                <Text style={styles.moduleStats}>{item.stats}</Text>
                <View style={styles.openPill}>
                  <Text style={styles.openPillText}>Open Screen</Text>
                  <Ionicons name="arrow-forward" size={13} color="#2E7D52" style={{ marginLeft: 3 }} />
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
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
    paddingBottom: 40,
  },
  heroBanner: {
    backgroundColor: '#2E7D52',
    paddingTop: Platform.OS === 'ios' ? 16 : 24,
    paddingBottom: 32,
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
  logoutBtn: {
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
  sectionWrap: {
    paddingHorizontal: 18,
    marginTop: -14,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 14,
  },
  moduleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  moduleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  moduleIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E6F4EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgePill: {
    backgroundColor: '#E6F4EA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2E7D52',
  },
  moduleTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  moduleSub: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
    marginTop: 4,
  },
  moduleFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  moduleStats: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2E7D52',
  },
  openPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F4EA',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  openPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2E7D52',
  },
});
