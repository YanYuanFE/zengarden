import { useEffect, useState } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppKit, useAccount } from '@reown/appkit-react-native';
import { useSignMessage } from 'wagmi';
import { useColorScheme } from '@/components/useColorScheme';
import { useUser } from '@/contexts/UserContext';
import { authApi } from '@/services/api';
import Colors from '@/constants/Colors';

// Format address display
function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Create sign message for EVM
function createSignMessage(address: string, nonce: string): string {
  const domain = 'zengarden.xyz';
  const now = new Date();

  return [
    `${domain} wants you to sign in with your Ethereum account:`,
    address,
    '',
    'Welcome to ZenGarden! Please sign to verify your wallet ownership.',
    '',
    `Nonce: ${nonce}`,
    `Issued At: ${now.toISOString()}`,
  ].join('\n');
}

export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { open, disconnect } = useAppKit();
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { user, login, isLoading, isInitialized } = useUser();
  const [isSigning, setIsSigning] = useState(false);

  // Redirect if logged in
  useEffect(() => {
    if (isInitialized && user) {
      router.replace('/(tabs)');
    }
  }, [isInitialized, user]);

  // Sign and Login
  const handleSign = async () => {
    if (!address || isSigning) return;

    setIsSigning(true);
    try {
      // Get nonce from backend
      const { nonce } = await authApi.getNonce(address);

      // Create sign message
      const message = createSignMessage(address, nonce);

      // EVM 签名 (personal_sign)
      const signature = await signMessageAsync({ message });

      // Verify with backend, get JWT token
      const result = await authApi.verify({
        address,
        message,
        signature,
      });

      // Login with token
      await login(result.token);
    } catch (error) {
      console.error('Sign error:', error);
    } finally {
      setIsSigning(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {/* Logo */}
        <View style={[styles.logoContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.logoText}>🌸</Text>
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: colors.text }]}>ZenGarden</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Zen Garden
        </Text>

        {/* Description */}
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          Focus to harvest beauty. Every focus session blooms a unique AI flower.
        </Text>
      </View>

      {/* Bottom Buttons */}
      <View style={styles.footer}>
        {!isConnected ? (
          <>
            <Pressable
              style={[styles.connectButton, { backgroundColor: colors.primary }]}
              onPress={() => open()}
            >
              <Text style={styles.connectButtonText}>Connect Wallet</Text>
            </Pressable>
            <Text style={[styles.hint, { color: colors.textSecondary }]}>
              Connect your wallet
            </Text>
          </>
        ) : (
          <>
            {/* Connected, show address */}
            <View style={[styles.addressCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.addressLabel, { color: colors.textSecondary }]}>Connected</Text>
              <Text style={[styles.addressText, { color: colors.text }]}>{formatAddress(address!)}</Text>
              <Pressable onPress={() => disconnect()}>
                <Text style={[styles.disconnectText, { color: colors.textSecondary }]}>Disconnect</Text>
              </Pressable>
            </View>

            <Pressable
              style={[styles.connectButton, { backgroundColor: colors.primary }]}
              onPress={handleSign}
              disabled={isSigning || isLoading}
            >
              <Text style={styles.connectButtonText}>
                {isSigning || isLoading ? 'Signing...' : 'Sign In'}
              </Text>
            </Pressable>
            <Text style={[styles.hint, { color: colors.textSecondary }]}>
              Sign to verify identity
            </Text>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  logoText: {
    fontSize: 48,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 24,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  addressCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 16,
  },
  addressLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  addressText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  disconnectText: {
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  connectButton: {
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  connectButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  hint: {
    fontSize: 14,
    textAlign: 'center',
  },
});
