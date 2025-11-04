'use client';

import { Button } from '@/components/ui/button';
import { useWallet } from '@/hooks/use-wallet';
import { cn } from '@/lib/utils';
import { connectToWallet, disconnectWallet } from '@/lib/wallet-utils';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AccountPanel } from './account-panel';
import { Identicon } from './identicon';

export function WalletConnect() {
  const {
    walletAddress,
    setWallet,
    setWalletState,
    walletConnectionStatus,
    setWalletConnectionStatus,
  } = useWallet();

  const [isHydrated, setIsHydrated] = useState(false);
  const [showWalletInfo, setShowWalletInfo] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Mark as hydrated after initial render
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Reset stuck connecting state on mount
  useEffect(() => {
    if (isHydrated && walletConnectionStatus === 'connecting') {
      setWalletConnectionStatus('disconnected');
      setWallet(null);
      setWalletState(null);

      // Use the shared disconnect utility to clear localStorage
      disconnectWallet();
    }
  }, [
    isHydrated,
    walletConnectionStatus,
    setWallet,
    setWalletConnectionStatus,
    setWalletState,
  ]);

  const connectWallet = async () => {
    // Prevent multiple clicks
    if (isConnecting) {
      return;
    }

    setIsConnecting(true);
    setWalletConnectionStatus('connecting');

    try {
      const { wallet, state } = await connectToWallet();

      setWallet(wallet);
      setWalletState(state);
      setWalletConnectionStatus('connected');

      // Show success toast
      toast.success('Successfully connected to Midnight Lace wallet', {
        duration: 3000,
      });
    } catch (error) {
      // Simple error handling - show the error as it is
      const errorMsg = error instanceof Error ? error.message : String(error);

      console.error('Wallet connection failed:', errorMsg);
      toast.error(errorMsg, { duration: 5000 });

      setWalletConnectionStatus('disconnected');
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setWalletConnectionStatus('disconnected');
    setWallet(null);
    setWalletState(null);
    setShowWalletInfo(false);

    // Use the shared disconnect utility
    disconnectWallet();
  };

  const renderStatus = () => {
    // Don't render anything until hydrated to prevent hydration mismatch
    if (!isHydrated) {
      return (
        <Button
          disabled
          className="rounded-full bg-linear-to-r from-blue-500 to-indigo-500 text-sm font-medium text-white opacity-70"
        >
          Loading...
        </Button>
      );
    }

    switch (walletConnectionStatus) {
      case 'disconnected':
        return (
          <Button
            onClick={connectWallet}
            disabled={isConnecting}
            className="rounded-full bg-linear-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 dark:from-blue-600 dark:to-indigo-600 dark:hover:from-blue-700 dark:hover:to-indigo-700 text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isConnecting ? 'Connecting...' : 'Connect'}
          </Button>
        );

      case 'connecting':
        return (
          <Button
            disabled
            className="rounded-full bg-linear-to-r from-blue-500 to-indigo-500 text-sm font-medium text-white opacity-70"
          >
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Connecting...
            </div>
          </Button>
        );

      case 'connected':
        return (
          <button
            type="button"
            onClick={() => setShowWalletInfo(true)}
            className={cn(
              'flex items-center gap-2 p-1 pr-3 rounded-full hover:bg-muted transition-colors',
              showWalletInfo && 'invisible',
            )}
            aria-hidden={showWalletInfo}
          >
            <div className="w-8 h-8 rounded-full overflow-hidden">
              {walletAddress && <Identicon address={walletAddress} size={32} />}
            </div>
            <span className="font-medium text-sm text-muted-foreground">
              {walletAddress
                ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
                : '...'}
            </span>
          </button>
        );

      case 'error':
        return (
          <Button
            onClick={connectWallet}
            className="rounded-full bg-linear-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-sm font-medium text-white"
          >
            Retry
          </Button>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <div className="flex items-center">{renderStatus()}</div>

      <AccountPanel
        isVisible={showWalletInfo}
        onClose={() => setShowWalletInfo(false)}
        onDisconnect={handleDisconnect}
      />
    </>
  );
}
