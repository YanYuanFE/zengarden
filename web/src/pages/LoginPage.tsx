import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppKit } from '@reown/appkit/react';
import { useAccount, useSignMessage, useDisconnect } from 'wagmi';
import { useUser } from '@/contexts/UserContext';
import { authApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatAddress } from '@/lib/utils';

function createSiweMessage(address: string, chainId: number, nonce: string): string {
  const domain = 'zengarden.xyz';
  const uri = 'https://zengarden.xyz';
  const now = new Date();
  const expirationTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  return [
    `${domain} wants you to sign in with your Ethereum account:`,
    address,
    '',
    'Welcome to ZenGarden! Please sign to verify your wallet ownership.',
    '',
    `URI: ${uri}`,
    `Version: 1`,
    `Chain ID: ${chainId}`,
    `Nonce: ${nonce}`,
    `Issued At: ${now.toISOString()}`,
    `Expiration Time: ${expirationTime.toISOString()}`,
  ].join('\n');
}

export function LoginPage() {
  const navigate = useNavigate();
  const { open } = useAppKit();
  const { address, isConnected, chainId } = useAccount();
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();
  const { user, login, isLoading, isInitialized } = useUser();
  const [isSigning, setIsSigning] = useState(false);

  // Redirect if logged in
  if (isInitialized && user) {
    navigate('/', { replace: true });
    return null;
  }

  const handleSign = async () => {
    if (!address || !chainId || isSigning) return;

    setIsSigning(true);
    try {
      const { nonce } = await authApi.getNonce(address);
      const message = createSiweMessage(address, chainId, nonce);
      const signature = await signMessageAsync({ message });
      const result = await authApi.verify({ address, chainId, message, signature });
      await login(result.token);
    } catch (error) {
      console.error('Sign error:', error);
    } finally {
      setIsSigning(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-sage/10 rounded-full blur-3xl" />
        <div className="absolute bottom-40 right-10 w-40 h-40 bg-coral/10 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">
        {/* Logo */}
        <div className="animate-float mb-8">
          <div className="w-24 h-24 bg-sage rounded-3xl flex items-center justify-center shadow-lg">
            <span className="text-5xl">🌸</span>
          </div>
        </div>

        {/* Title */}
        <h1 className="font-display text-4xl font-bold text-charcoal mb-2">
          ZenGarden
        </h1>
        <p className="text-lg text-stone mb-4">Zen Garden</p>
        <p className="text-center text-stone max-w-xs mb-12">
          Focus to harvest beauty. Every focus session blooms a unique AI flower.
        </p>
      </div>

      {/* Footer */}
      <div className="px-6 pb-12 relative z-10">
        {!isConnected ? (
          <div className="space-y-4">
            <Button size="lg" className="w-full" onClick={() => open()}>
              Connect Wallet
            </Button>
            <p className="text-center text-sm text-stone">
              Step 1: Connect your wallet
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <Card className="text-center">
              <p className="text-xs text-stone mb-1">Connected</p>
              <p className="font-medium text-charcoal mb-2">
                {formatAddress(address!)}
              </p>
              <button
                onClick={() => disconnect()}
                className="text-sm text-stone underline hover:text-charcoal"
              >
                Disconnect
              </button>
            </Card>

            <Button
              size="lg"
              className="w-full"
              onClick={handleSign}
              disabled={isSigning || isLoading}
            >
              {isSigning || isLoading ? 'Signing...' : 'Sign In'}
            </Button>
            <p className="text-center text-sm text-stone">
              Step 2: Sign to verify identity
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
