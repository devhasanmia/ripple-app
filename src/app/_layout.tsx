import { DarkTheme, DefaultTheme, ThemeProvider, Slot } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AnimatedSplashOverlay } from '@/components/animated-icon';

// Prevent the native splash screen from auto-hiding before asset loading is complete
SplashScreen.preventAutoHideAsync().catch(() => {
  /* Ignore errors in environments that do not support this */
});

export default function TabLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    // Hide the native splash screen as soon as the app layout mounts,
    // which seamlessly reveals the custom AnimatedSplashOverlay logo animation.
    SplashScreen.hideAsync().catch(() => {
      /* Ignore errors */
    });
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AnimatedSplashOverlay />
        <Slot />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
