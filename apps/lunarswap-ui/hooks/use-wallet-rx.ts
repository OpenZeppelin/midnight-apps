import type { DAppConnectorWalletState } from '@midnight-ntwrk/dapp-connector-api';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useWallet } from './use-wallet';

interface WalletRxState {
  state: DAppConnectorWalletState | null;
  error: string | null;
}

interface WalletRxActions {
  refresh: () => Promise<void>;
}

export function useWalletRx(): WalletRxState & WalletRxActions {
  const { wallet, isWalletConnected } = useWallet();
  const [state, setState] = useState<DAppConnectorWalletState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Start polling when wallet connects
  useEffect(() => {
    if (!wallet || !isWalletConnected) {
      setState(null);
      setError(null);
      return;
    }

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Create new abort controller for this session
    abortControllerRef.current = new AbortController();

    // Initial state fetch
    const fetchState = async () => {
      try {
        const walletState = await wallet.state();
        setState(walletState);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to fetch wallet state',
        );
      }
    };

    // Fetch initial state
    fetchState();

    // Set up polling interval (similar to RxJS throttleTime)
    intervalRef.current = setInterval(fetchState, 5000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [wallet, isWalletConnected]);

  // Manual refresh
  const refresh = useCallback(async (): Promise<void> => {
    if (!wallet) {
      throw new Error('Wallet not connected');
    }

    try {
      const walletState = await wallet.state();
      setState(walletState);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to refresh wallet state',
      );
      throw err;
    }
  }, [wallet]);

  return {
    // State
    state,
    error,

    // Actions
    refresh,
  };
}
