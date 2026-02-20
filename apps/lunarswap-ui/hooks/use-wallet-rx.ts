// DAppConnectorWalletState no longer exists in new API
import { useCallback, useEffect, useRef, useState } from 'react';
import { useWallet } from './use-wallet';

interface WalletState {
  // Shielded addresses and keys
  shieldedAddress: string;
  shieldedCoinPublicKey: string;
  shieldedEncryptionPublicKey: string;

  // Unshielded address
  unshieldedAddress?: string;

  // Dust address
  dustAddress?: string;

  // Balances
  shieldedBalances: Record<string, bigint>;
  unshieldedBalances?: Record<string, bigint>;
  dustBalance?: {
    balance: bigint;
    cap: bigint;
  };
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
        const [
          addressInfo,
          shieldedBalances,
          unshieldedAddressResult,
          dustAddressResult,
          unshieldedBalances,
          dustBalance,
        ] = await Promise.allSettled([
          walletAPI.wallet.getShieldedAddresses(),
          walletAPI.wallet.getShieldedBalances(),
          walletAPI.wallet.getUnshieldedAddress(),
          walletAPI.wallet.getDustAddress(),
          walletAPI.wallet.getUnshieldedBalances(),
          walletAPI.wallet.getDustBalance(),
        ]);

        setState({
          shieldedAddress:
            addressInfo.status === 'fulfilled'
              ? addressInfo.value.shieldedAddress
              : '',
          shieldedCoinPublicKey:
            addressInfo.status === 'fulfilled'
              ? addressInfo.value.shieldedCoinPublicKey
              : '',
          shieldedEncryptionPublicKey:
            addressInfo.status === 'fulfilled'
              ? addressInfo.value.shieldedEncryptionPublicKey
              : '',
          shieldedBalances:
            shieldedBalances.status === 'fulfilled'
              ? shieldedBalances.value
              : {},
          unshieldedAddress:
            unshieldedAddressResult.status === 'fulfilled'
              ? unshieldedAddressResult.value.unshieldedAddress
              : undefined,
          dustAddress:
            dustAddressResult.status === 'fulfilled'
              ? dustAddressResult.value.dustAddress
              : undefined,
          unshieldedBalances:
            unshieldedBalances.status === 'fulfilled'
              ? unshieldedBalances.value
              : undefined,
          dustBalance:
            dustBalance.status === 'fulfilled' ? dustBalance.value : undefined,
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
      const [
        addressInfo,
        shieldedBalances,
        unshieldedAddressResult,
        dustAddressResult,
        unshieldedBalances,
        dustBalance,
      ] = await Promise.allSettled([
        walletAPI.wallet.getShieldedAddresses(),
        walletAPI.wallet.getShieldedBalances(),
        walletAPI.wallet.getUnshieldedAddress(),
        walletAPI.wallet.getDustAddress(),
        walletAPI.wallet.getUnshieldedBalances(),
        walletAPI.wallet.getDustBalance(),
      ]);

      setState({
        shieldedAddress:
          addressInfo.status === 'fulfilled'
            ? addressInfo.value.shieldedAddress
            : '',
        shieldedCoinPublicKey:
          addressInfo.status === 'fulfilled'
            ? addressInfo.value.shieldedCoinPublicKey
            : '',
        shieldedEncryptionPublicKey:
          addressInfo.status === 'fulfilled'
            ? addressInfo.value.shieldedEncryptionPublicKey
            : '',
        shieldedBalances:
          shieldedBalances.status === 'fulfilled' ? shieldedBalances.value : {},
        unshieldedAddress:
          unshieldedAddressResult.status === 'fulfilled'
            ? unshieldedAddressResult.value.unshieldedAddress
            : undefined,
        dustAddress:
          dustAddressResult.status === 'fulfilled'
            ? dustAddressResult.value.dustAddress
            : undefined,
        unshieldedBalances:
          unshieldedBalances.status === 'fulfilled'
            ? unshieldedBalances.value
            : undefined,
        dustBalance:
          dustBalance.status === 'fulfilled' ? dustBalance.value : undefined,
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
