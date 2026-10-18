import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';


import Step1 from '../components/OnBoarding';
import Step2 from '../components/OnBoarding1';
import Step3 from '../components/OnBoarding2';

const PAGES = [<Step1 />, <Step2 />, <Step3 />];

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const savedAdmin = await AsyncStorage.getItem('adminUser');
        const adminRole = await AsyncStorage.getItem('adminRole');
        if (savedAdmin || adminRole) {
          router.replace('/admin/portal');
          return;
        }

        const savedId = await AsyncStorage.getItem('userId');
        const NIC = await AsyncStorage.getItem('NIC');
        if (savedId && NIC) {
          router.replace('/(tabs)/dashboard');
          return;
        }
      } catch (error) {
        console.error('Error checking auth:', error);
      }
    };

    checkAuth();
  }, []);

  const handleScroll = (event) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    setCurrentIndex(Math.round(scrollPosition / width));
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Skip Button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/LoginNIC')}>
          <Text style={styles.skipText}>{t('skip')}</Text>
        </TouchableOpacity>
      </View>

      {/* Swipeable Pages */}
      <FlatList
        data={PAGES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        renderItem={({ item }) => <View style={{ width }}>{item}</View>}
        keyExtractor={(_, index) => index.toString()}
      />

      {/* Dots Indicator */}
      <View style={styles.paginationContainer}>
        {PAGES.map((_, index) => (
          <View
            key={index}
            style={[styles.dot, currentIndex === index ? styles.activeDot : styles.inactiveDot]}
          />
        ))}
      </View>

      {/* Small blue link for hospital staff/admin login */}
      <TouchableOpacity
        style={styles.adminLinkContainer}
        onPress={() => router.push('/AdminLogin')}
        activeOpacity={0.7}
      >
        <Text style={styles.adminLinkText}>Hospital Staff / Admin Portal</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { alignItems: 'flex-end', padding: 20 },
  skipText: { color: '#64748B', fontWeight: '600', fontSize: 16 },
  paginationContainer: { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingBottom: 16 },
  dot: { height: 8, borderRadius: 4 },
  inactiveDot: { width: 8, backgroundColor: '#93C5FD' },
  activeDot: { width: 24, backgroundColor: '#0D9488' },
  adminLinkContainer: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingBottom: 24,
  },
  adminLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
    textDecorationLine: 'underline',
  },
});