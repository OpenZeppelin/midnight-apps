'use client';

import type {
  DAppConnectorWalletAPI,
  DAppConnectorWalletState,
} from '@midnight-ntwrk/dapp-connector-api';
import {
  type PropsWithChildren,
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { connectToWallet, disconnectWallet } from '../utils/wallet-utils';

type WalletConnectionStatusType =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'error';

// Constants for localStorage keys
const WALLET_STORAGE_KEYS = {
  CONNECTION_STATUS: 'wallet_connection_status',
  WALLET_STATE: 'wallet_state',
  WALLET_ADDRESS: 'wallet_address',
} as const;

/**
 * Enhanced wallet context that stores both the manager AND the wallet instance
 */
export interface WalletContextType {
  // Direct access to wallet instance for transactions
  wallet: DAppConnectorWalletAPI | null;

  // Setters to save wallet when connected
  setWallet: (wallet: DAppConnectorWalletAPI | null) => void;

  // Convenience methods
  isWalletConnected: boolean;
  walletAddress: string | null;

  // Contains the wallet state, including the sync progress (coins, balances, etc.)
  walletState: DAppConnectorWalletState | null;
  setWalletState: (state: DAppConnectorWalletState | null) => void;

  // wallet connection status
  walletConnectionStatus: WalletConnectionStatusType;
  setWalletConnectionStatus: (status: WalletConnectionStatusType) => void;
}

export const WalletContext = createContext<WalletContextType | undefined>(
  undefined,
);

export interface WalletProviderProps extends PropsWithChildren {}

export const WalletProvider: React.FC<Readonly<WalletProviderProps>> = ({
  children,
}) => {
  // Add hydration state to prevent SSR issues
  const [isHydrated, setIsHydrated] = useState(false);

  // Add reconnection flag to prevent infinite loops
  const isReconnecting = useRef(false);

  // Initialize state from localStorage
  const [wallet, setWallet] = useState<DAppConnectorWalletAPI | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem(WALLET_STORAGE_KEYS.WALLET_ADDRESS);
      } catch {
        return null;
      }
    }
    return null;
  });
  const [walletState, setWalletState] =
    useState<DAppConnectorWalletState | null>(() => {
      if (typeof window !== 'undefined') {
        try {
          const savedState = localStorage.getItem(
            WALLET_STORAGE_KEYS.WALLET_STATE,
          );
          return savedState ? JSON.parse(savedState) : null;
        } catch {
          return null;
        }
      }
      return null;
    });
  const [walletConnectionStatus, setWalletConnectionStatus] =
    useState<WalletConnectionStatusType>(() => {
      if (typeof window !== 'undefined') {
        try {
          const savedStatus = localStorage.getItem(
            WALLET_STORAGE_KEYS.CONNECTION_STATUS,
          );
          return (savedStatus as WalletConnectionStatusType) || 'disconnected';
        } catch {
          return 'disconnected';
        }
      }
      return 'disconnected';
    });

  // Mark as hydrated after initial render
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Save wallet connection status to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(
          WALLET_STORAGE_KEYS.CONNECTION_STATUS,
          walletConnectionStatus,
        );
      } catch (error) {
        console.warn(
          'Failed to save wallet connection status to localStorage:',
          error,
        );
      }
    }
  }, [walletConnectionStatus]);

  // Save wallet state to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        if (walletState) {
          localStorage.setItem(
            WALLET_STORAGE_KEYS.WALLET_STATE,
            JSON.stringify(walletState),
          );
        } else {
          localStorage.removeItem(WALLET_STORAGE_KEYS.WALLET_STATE);
        }
      } catch (error) {
        console.warn('Failed to save wallet state to localStorage:', error);
      }
    }
  }, [walletState]);

  // Save wallet address to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        if (walletAddress) {
          localStorage.setItem(
            WALLET_STORAGE_KEYS.WALLET_ADDRESS,
            walletAddress,
          );
        } else {
          localStorage.removeItem(WALLET_STORAGE_KEYS.WALLET_ADDRESS);
        }
      } catch (error) {
        console.warn('Failed to save wallet address to localStorage:', error);
      }
    }
  }, [walletAddress]);

  // Attempt to reconnect wallet on app load (only after hydration)
  useEffect(() => {
    if (!isHydrated) return; // Don't attempt reconnection during SSR or initial hydration
    if (isReconnecting.current) return; // Prevent multiple simultaneous reconnection attempts

    const attemptReconnection = async () => {
      // Only attempt reconnection if we have a saved connected state and we're not already connected
      if (walletConnectionStatus === 'connected' && walletState && !wallet) {
        isReconnecting.current = true;
        setWalletConnectionStatus('connecting');

        try {
          // Use the shared connectToWallet utility
          const { wallet: reconnectedWallet, state: currentState } =
            await connectToWallet({
              checkExisting: true,
              enableTimeout: 15000,
              stateTimeout: 10000,
              isEnabledTimeout: 10000,
            });

          // Verify the wallet address matches what we saved
          if (currentState.address === walletState.address) {
            setWallet(reconnectedWallet);
            setWalletState(currentState);
            setWalletAddress(currentState.address || null);
            setWalletConnectionStatus('connected');
          } else {
            console.warn('Wallet address mismatch during reconnection');
            setWalletConnectionStatus('disconnected');
            setWalletState(null);
            setWalletAddress(null);
          }
        } catch (error) {
          console.error('Failed to reconnect wallet:', error);
          setWalletConnectionStatus('disconnected');
          setWalletState(null);
          setWalletAddress(null);
        } finally {
          isReconnecting.current = false;
        }
      }
    };

    // Small delay to ensure DOM is ready
    const timeoutId = setTimeout(attemptReconnection, 100);
    return () => clearTimeout(timeoutId);
  }, [isHydrated, walletConnectionStatus, walletState, wallet]);

  // Enhanced setters that clear localStorage when disconnecting
  const handleSetWalletState = useCallback(
    (state: DAppConnectorWalletState | null) => {
      setWalletState(state);
      if (!state) {
        setWalletAddress(null);
      } else {
        setWalletAddress(state.address || null);
      }
    },
    [],
  );

  const handleSetWalletConnectionStatus = useCallback(
    (status: WalletConnectionStatusType) => {
      setWalletConnectionStatus(status);

      // Clear all wallet data when disconnecting
      if (status === 'disconnected') {
        setWallet(null);
        setWalletState(null);
        setWalletAddress(null);

        // Use the shared disconnect utility
        disconnectWallet();
      }
    },
    [],
  );

  // Computed values
  const isWalletConnected = walletConnectionStatus === 'connected';

  const contextValue: WalletContextType = useMemo(
    () => ({
      wallet,
      setWallet: setWallet,
      isWalletConnected,
      walletAddress,
      walletState,
      setWalletState: handleSetWalletState,
      walletConnectionStatus,
      setWalletConnectionStatus: handleSetWalletConnectionStatus,
    }),
    [
      wallet,
      isWalletConnected,
      walletAddress,
      walletState,
      handleSetWalletState,
      walletConnectionStatus,
      handleSetWalletConnectionStatus,
    ],
  );

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
};
