import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function NotificationsScreen() {
  // Notification Toggle States
  const [tokenAlerts, setTokenAlerts] = useState(true);
  const [doctorUpdates, setDoctorUpdates] = useState(true);
  const [labReadyAlerts, setLabReadyAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);

  // List of recent notifications
  const recentNotifications = [
    {
      id: '1',
      title: 'Token Call Alert',
      message: 'Token A 028: You are 2 numbers away from Room 05.',
      time: '10 mins ago',
      icon: 'notifications',
      unread: true,
    },
    {
      id: '2',
      title: 'Doctor Status',
      message: 'Dr. Jayasinghe (OPD 01) has commenced consultations.',
      time: '1 hour ago',
      icon: 'medical',
      unread: false,
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Notification Preferences (Settings) */}
        <Text style={styles.sectionHeading}>Notification Preferences</Text>
        <View style={styles.settingsCard}>
          {/* Token Alerts */}
          <View style={styles.toggleRow}>
            <View style={styles.toggleTextWrap}>
              <Text style={styles.toggleTitle}>Queue & Token Alerts</Text>
              <Text style={styles.toggleSubtitle}>
                Get notified when your token is near or called
              </Text>
            </View>
            <Switch
              value={tokenAlerts}
              onValueChange={setTokenAlerts}
              trackColor={{ false: '#CBD5E1', true: '#99F6E4' }}
              thumbColor={tokenAlerts ? '#0D9488' : '#F1F5F9'}
            />
          </View>

          <View style={styles.divider} />

          {/* Doctor Updates */}
          <View style={styles.toggleRow}>
            <View style={styles.toggleTextWrap}>
              <Text style={styles.toggleTitle}>Doctor & Room Updates</Text>
              <Text style={styles.toggleSubtitle}>
                Delays, cancellations, or room changes
              </Text>
            </View>
            <Switch
              value={doctorUpdates}
              onValueChange={setDoctorUpdates}
              trackColor={{ false: '#CBD5E1', true: '#99F6E4' }}
              thumbColor={doctorUpdates ? '#0D9488' : '#F1F5F9'}
            />
          </View>

          <View style={styles.divider} />

          {/* Pharmacy & Lab */}
          <View style={styles.toggleRow}>
            <View style={styles.toggleTextWrap}>
              <Text style={styles.toggleTitle}>Pharmacy & Lab Reports</Text>
              <Text style={styles.toggleSubtitle}>
                Alerts when prescription is ready for pickup
              </Text>
            </View>
            <Switch
              value={labReadyAlerts}
              onValueChange={setLabReadyAlerts}
              trackColor={{ false: '#CBD5E1', true: '#99F6E4' }}
              thumbColor={labReadyAlerts ? '#0D9488' : '#F1F5F9'}
            />
          </View>

          <View style={styles.divider} />

          {/* SMS Reminders */}
          <View style={styles.toggleRow}>
            <View style={styles.toggleTextWrap}>
              <Text style={styles.toggleTitle}>SMS Backup Alerts</Text>
              <Text style={styles.toggleSubtitle}>
                Receive SMS if mobile data is disconnected
              </Text>
            </View>
            <Switch
              value={smsAlerts}
              onValueChange={setSmsAlerts}
              trackColor={{ false: '#CBD5E1', true: '#99F6E4' }}
              thumbColor={smsAlerts ? '#0D9488' : '#F1F5F9'}
            />
          </View>
        </View>

        {/* 2. Recent Messages / Activity Log */}
        <Text style={styles.sectionHeading}>Recent Messages</Text>
        <View style={styles.messagesContainer}>
          {recentNotifications.map((item) => (
            <View
              key={item.id}
              style={[
                styles.messageCard,
                item.unread && styles.unreadMessageCard,
              ]}
            >
              <View style={styles.msgIconWrap}>
                <Ionicons name={item.icon} size={20} color="#0D9488" />
              </View>
              <View style={styles.msgContentWrap}>
                <View style={styles.msgHeaderRow}>
                  <Text style={styles.msgTitle}>{item.title}</Text>
                  <Text style={styles.msgTime}>{item.time}</Text>
                </View>
                <Text style={styles.msgDesc}>{item.message}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EDF5FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 40,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 10,
    marginTop: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    marginBottom: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  toggleTextWrap: {
    flex: 1,
    paddingRight: 16,
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  toggleSubtitle: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  messagesContainer: {
    gap: 10,
  },
  messageCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  unreadMessageCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#0D9488',
    backgroundColor: '#F0FDFA',
  },
  msgIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#CCFBF1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  msgContentWrap: {
    flex: 1,
  },
  msgHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  msgTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  msgTime: {
    fontSize: 11,
    color: '#94A3B8',
  },
  msgDesc: {
    fontSize: 12.5,
    color: '#475569',
    lineHeight: 18,
  },
});