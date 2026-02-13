// DAppConnectorWalletState no longer exists in new API
import { useCallback, useEffect, useRef, useState } from 'react';
import { useWallet } from './use-wallet';

interface WalletState {
  address: string;
  coinPublicKey: string;
  encryptionPublicKey: string;
  balances: Record<string, bigint>;
}

interface WalletRxState {
  state: WalletState | null;
  error: string | null;
}

interface WalletRxActions {
  refresh: () => Promise<void>;
}

export function useWalletRx(): WalletRxState & WalletRxActions {
  const { walletAPI, isConnected } = useWallet();
  const [state, setState] = useState<WalletState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Start polling when wallet connects
  useEffect(() => {
    if (!walletAPI || !isConnected) {
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
        const addressInfo = await walletAPI.wallet.getShieldedAddresses();
        const balances = await walletAPI.wallet.getShieldedBalances();

        setState({
          address: addressInfo.shieldedAddress,
          coinPublicKey: addressInfo.shieldedCoinPublicKey,
          encryptionPublicKey: addressInfo.shieldedEncryptionPublicKey,
          balances,
        });
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
  }, [walletAPI, isConnected]);

  // Manual refresh
  const refresh = useCallback(async (): Promise<void> => {
    if (!walletAPI) {
      throw new Error('Wallet not connected');
    }

    try {
      const addressInfo = await walletAPI.wallet.getShieldedAddresses();
      const balances = await walletAPI.wallet.getShieldedBalances();

      setState({
        address: addressInfo.shieldedAddress,
        coinPublicKey: addressInfo.shieldedCoinPublicKey,
        encryptionPublicKey: addressInfo.shieldedEncryptionPublicKey,
        balances,
      });
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to refresh wallet state',
      );
      throw err;
    }
  }, [walletAPI]);

  return {
    // State
    state,
    error,

    // Actions
    refresh,
  };
}
