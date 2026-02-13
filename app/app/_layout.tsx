import '@walletconnect/react-native-compat';

import 'react-native-get-random-values';
import 'text-encoding';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useSegments, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as Updates from 'expo-updates';
import { StatusBar } from 'expo-status-bar';
import { useEffect, type ReactNode } from 'react';
import { View, Alert } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';
import * as Clipboard from 'expo-clipboard';

import { AppKit, AppKitProvider, createAppKit } from '@reown/appkit-react-native';
import { WagmiAdapter } from '@reown/appkit-wagmi-react-native';
import { bsc } from '@reown/appkit/networks';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { useColorScheme } from '@/components/useColorScheme';
import { storage } from '@/utils/storage';
import { UserProvider, useUser } from '@/contexts/UserContext';

// Clipboard client for AppKit
const clipboardClient = {
  setString: async (value: string) => {
    await Clipboard.setStringAsync(value);
  },
};

import Config from '@/constants/Config';

// AppKit configuration
const queryClient = new QueryClient();
const projectId = Config.EXPO_PUBLIC_REOWN_PROJECT_ID;

const metadata = {
  name: 'ZenGarden',
  description: 'Zen Garden - Focus to harvest Flower NFTs',
  url: 'https://zengarden.pixstudio.art',
  icons: ['https://zengarden.pixstudio.art/icon.png'],
  redirect: {
    native: 'zengarden://',
  },
};

const networks = [bsc];
const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks,
});

const appkit = createAppKit({
  projectId,
  networks,
  adapters: [wagmiAdapter],
  metadata,
  clipboardClient,
  storage,
  defaultNetwork: bsc,
  enableAnalytics: true,
});

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'login',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Check for OTA updates
async function checkForUpdates() {
  if (__DEV__) return; // Skip in development

  try {
    const update = await Updates.checkForUpdateAsync();
    if (update.isAvailable) {
      await Updates.fetchUpdateAsync();
      Alert.alert(
        'Update Available',
        'A new version has been downloaded. Restart to apply.',
        [
          { text: 'Later', style: 'cancel' },
          { text: 'Restart', onPress: () => Updates.reloadAsync() },
        ]
      );
    }
  } catch (error) {
    console.log('Error checking for updates:', error);
  }
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
      checkForUpdates(); // Check for updates after app loads
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function AuthGuard({ children }: { children: ReactNode }) {
  const { user, isInitialized } = useUser();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isInitialized) return;

    const inAuthGroup = segments[0] === '(tabs)';
    const inPublicGroup = segments[0] === 'login';

    if (!user && !inPublicGroup) {
      router.replace('/login');
    } else if (user && inPublicGroup) {
      router.replace('/(tabs)');
    }
  }, [user, isInitialized, segments]);

  return <>{children}</>;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} translucent />
        <WagmiProvider config={wagmiAdapter.wagmiConfig}>
          <QueryClientProvider client={queryClient}>
            <AppKitProvider instance={appkit}>
              <UserProvider>
              <AuthGuard>
                <Stack>
                  <Stack.Screen name="login" options={{ headerShown: false }} />
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen name="focus-timer" options={{ headerShown: false, gestureEnabled: false }} />
                  <Stack.Screen name="leaderboard" options={{ headerShown: false }} />
                  <Stack.Screen name="user/[address]" options={{ headerShown: false }} />
                  <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
                </Stack>
                <View style={{ position: 'absolute', height: '100%', width: '100%' }}>
                  <AppKit />
                </View>
              </AuthGuard>
            </UserProvider>
          </AppKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
