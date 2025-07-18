'use client';

import { Button } from '@/components/ui/button';
import { useWallet } from '@/hooks/use-wallet';
import type { DAppConnectorWalletAPI, WalletState } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { AccountPanel } from './account-panel';
import { Identicon } from './identicon';

// Helper function to add timeout to promises
const withTimeout = (
  promise: Promise<unknown>,
  timeoutMs: number,
  errorMessage: string,
): Promise<unknown> => {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs),
    ),
  ]);
};

export function WalletConnect() {
  const {
    walletAddress,
    walletState,
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

      // Clear localStorage to prevent reconnection loops
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem('wallet_connection_status');
          localStorage.removeItem('wallet_state');
          localStorage.removeItem('wallet_address');
        } catch (error) {
          console.warn('Failed to clear localStorage:', error);
        }
      }
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

    // Add a timeout to prevent getting stuck in connecting state
    const connectionTimeout = setTimeout(() => {
      setWalletConnectionStatus('error');
      setIsConnecting(false);
      toast.error('Wallet connection timed out. Please try again.', {
        duration: 5000,
      });
    }, 30000); // 30 second timeout

    try {
      // Check if Midnight Lace wallet is available
      const midnight = window.midnight;
      if (!midnight?.mnLace) {
        const errorMsg =
          'Midnight Lace wallet not found. Please install the extension.';
        toast.error(errorMsg, {
          duration: 5000,
        });
        setWalletConnectionStatus('error');
        clearTimeout(connectionTimeout);
        setIsConnecting(false);
        return;
      }

      const connector = midnight.mnLace;

      // Check if already enabled with timeout
      const isEnabled = await withTimeout(
        connector.isEnabled(),
        10000, // 10 second timeout
        'Timeout checking if wallet is enabled',
      );

      if (isEnabled) {
        // If already enabled, just get the current state
        const existingWallet = await connector.enable();
        const existingState = await existingWallet.state();

        if (existingState?.address) {
          setWallet(existingWallet);
          setWalletState(existingState);
          setWalletConnectionStatus('connected');
          setIsConnecting(false);
          clearTimeout(connectionTimeout);
          return;
        }
      }

      // Enable the wallet with timeout
      const wallet: DAppConnectorWalletAPI = (await withTimeout(
        connector.enable(),
        15000, // 15 second timeout
        'Timeout enabling wallet',
      )) as DAppConnectorWalletAPI;
      setWallet(wallet);

      // Get wallet state with timeout
      const state: WalletState = (await withTimeout(
        wallet.state(),
        10000, // 10 second timeout
        'Timeout getting wallet state',
      )) as WalletState;

      if (state?.address) {
        setWalletState(state);
        setWalletConnectionStatus('connected');
        setIsConnecting(false);

        // Show success toast
        toast.success('Successfully connected to Midnight Lace wallet', {
          duration: 3000,
        });
      } else {
        setWalletConnectionStatus('disconnected');
        setIsConnecting(false);
        toast.error('Could not get wallet address', {
          duration: 5000,
        });
      }

      // Get service URI config with timeout (optional)
      try {
        const serviceUriConfig = await withTimeout(
          connector.serviceUriConfig(),
          5000, // 5 second timeout
          'Timeout getting service URI config',
        );
      } catch (error) {
        // Silently ignore service URI config errors as they're non-critical
      }

      clearTimeout(connectionTimeout);
      setIsConnecting(false);
    } catch (error) {
      // Simplified error handling
      let errorMsg = 'Failed to connect wallet';
      let isUserCancellation = false;

      // Check if this is a user cancellation (wallet extension returns 's' when user cancels)
      if (error instanceof Error) {
        errorMsg = error.message;
        if (
          errorMsg === 's' ||
          errorMsg.includes('cancel') ||
          errorMsg.includes('user')
        ) {
          isUserCancellation = true;
          errorMsg = 'Connection cancelled by user';
        }
      } else if (typeof error === 'string') {
        errorMsg = error;
        if (
          error === 's' ||
          error.includes('cancel') ||
          error.includes('user')
        ) {
          isUserCancellation = true;
          errorMsg = 'Connection cancelled by user';
        }
      }

      // Handle specific error types
      if (!isUserCancellation) {
        if (errorMsg.includes('timeout') || errorMsg.includes('Timeout')) {
          errorMsg = 'Wallet connection timed out. Please try again.';
        } else if (
          errorMsg.includes('not found') ||
          errorMsg.includes('not available')
        ) {
          errorMsg =
            'Midnight Lace wallet not found. Please install the extension.';
        } else if (
          errorMsg.includes('rejected') ||
          errorMsg.includes('denied')
        ) {
          errorMsg = 'Wallet connection was rejected. Please try again.';
        } else {
          errorMsg = `Failed to connect wallet: ${errorMsg}`;
        }

        console.error('Wallet connection failed:', errorMsg);
        toast.error(errorMsg, { duration: 5000 });
      } else {
        toast.error('Wallet connection was cancelled', { duration: 3000 });
      }

      setWalletConnectionStatus('disconnected');
      clearTimeout(connectionTimeout);
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setWalletConnectionStatus('disconnected');
    setWallet(null);
    setWalletState(null);
    setShowWalletInfo(false);

    // Clear localStorage manually to prevent reconnection loops
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('wallet_connection_status');
        localStorage.removeItem('wallet_state');
        localStorage.removeItem('wallet_address');
      } catch (error) {
        console.warn('Failed to clear localStorage:', error);
      }
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        toast.success(`${label} copied to clipboard`, {
          duration: 2000,
        });
      })
      .catch(() => {
        toast.error('Could not copy to clipboard', {
          duration: 2000,
        });
      });
  };

  const formatAddress = (address: string) => {
    if (!address) return '';
    const parts = address.split('|');
    if (parts.length >= 2) {
      return {
        coinPublicKey: parts[0],
        encryptionPublicKey: parts[1],
      };
    }
    return {
      coinPublicKey: address,
      encryptionPublicKey: '',
    };
  };

  const walletInfo = walletState?.address
    ? formatAddress(walletState.address)
    : null;

  const renderStatus = () => {
    // Don't render anything until hydrated to prevent hydration mismatch
    if (!isHydrated) {
      return (
        <Button
          disabled
          className="rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-sm font-medium text-white opacity-70"
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
            className="rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 dark:from-blue-600 dark:to-indigo-600 dark:hover:from-blue-700 dark:hover:to-indigo-700 text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isConnecting ? 'Connecting...' : 'Connect'}
          </Button>
        );

      case 'connecting':
        return (
          <Button
            disabled
            className="rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-sm font-medium text-white opacity-70"
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
            className="rounded-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-sm font-medium text-white"
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
        onDisconnect={disconnectWallet}
      />
    </>
  );
}
