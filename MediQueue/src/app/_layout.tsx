import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import {
  DMSerifDisplay_400Regular,
  DMSerifDisplay_400Regular_Italic,
} from '@expo-google-fonts/dm-serif-display';
import '../i18n';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  
  const [fontsLoaded, fontError] = useFonts({
    DMSerifDisplay_400Regular,
    DMSerifDisplay_400Regular_Italic,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="MainOnBoarding" />
      <Stack.Screen name="LoginNIC" />
      <Stack.Screen name="LoginPhone" />
      <Stack.Screen name="Register" />
      <Stack.Screen name="opt" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="AdminLogin" />
      <Stack.Screen name="admin/portal" />
      <Stack.Screen name="admin/doctor" />
      <Stack.Screen name="admin/pharmacy" />
      <Stack.Screen name="admin/lab" />
      <Stack.Screen name="admin/it-support" />
      <Stack.Screen name="admin/super-admin" />
      <Stack.Screen name="admin/queue" />
    </Stack>
  );
}