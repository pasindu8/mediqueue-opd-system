import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// Tab Icons and Titles configuration
const TAB_CONFIG: Record<
  string,
  { label: string; icon: keyof typeof Ionicons.glyphMap; iconActive: keyof typeof Ionicons.glyphMap }
> = {
  dashboard: { label: 'Home', icon: 'home-outline', iconActive: 'home' },
  queue: { label: 'Queue', icon: 'people-outline', iconActive: 'people' },
  appointments: { label: 'Bookings', icon: 'calendar-outline', iconActive: 'calendar' },
  pharmacy: { label: 'Pharmacy', icon: 'medkit-outline', iconActive: 'medkit' },
  profile: { label: 'Profile', icon: 'person-outline', iconActive: 'person' },
};

// 1. Dynamic Custom TabBar Component
function CustomTabBar({ state, navigation }: any) {
  return (
    <View style={styles.tabBarContainer}>
      <View style={styles.floatingBar}>
        {state.routes.map((route: any, index: number) => {
          const isFocused = state.index === index;
          const config = TAB_CONFIG[route.name] || {
            label: route.name,
            icon: 'ellipse-outline',
            iconActive: 'ellipse',
          };

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              onPress={onPress}
              activeOpacity={0.8}
              style={styles.tabItem}
            >
              {isFocused ? (
                // Active tab: elevated circular button + label underneath
                <View style={styles.activeTabContainer}>
                  <View style={styles.elevatedCircle}>
                    <Ionicons name={config.iconActive} size={24} color="#FFFFFF" />
                  </View>
                  <Text style={styles.activeLabel}>{config.label}</Text>
                </View>
              ) : (
                // Inactive tab: standard icon only
                <View style={styles.inactiveTabContainer}>
                  <Ionicons name={config.icon} size={22} color="#64748B" />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// 2. Main Tabs Layout
export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="dashboard" options={{ title: 'Home' }} />
      <Tabs.Screen name="queue" options={{ title: 'Queue' }} />
      <Tabs.Screen name="appointments" options={{ title: 'Bookings' }} />
      <Tabs.Screen name="pharmacy" options={{ title: 'Pharmacy' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 14,
    left: 14,
    right: 14,
    backgroundColor: 'transparent',
  },
  floatingBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 36,
    height: 64,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 6,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  inactiveTabContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTabContainer: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
    paddingBottom: 7,
    width: '100%',
  },
  elevatedCircle: {
    position: 'absolute',
    top: -24,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#0D9488', // Active Teal Color
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#EDF5FA',     // Cut-out notch effect Background
    elevation: 8,
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
  activeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0D9488',
  },
});