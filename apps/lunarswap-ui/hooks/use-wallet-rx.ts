import { useEffect, useState, useCallback, useRef } from 'react';
import { nativeToken } from '@/lib/utils';
import { useWallet } from './use-wallet';
import type { WalletState, SyncProgress } from '@/lib/types';
import { serializeBigInts } from '@/lib/utils';

interface WalletRxState {
  state: WalletState | null;
  isSynced: boolean;
  syncProgress: SyncProgress | null;
  nativeBalance: bigint | null;
  allBalances: Record<string, bigint> | null;
  transactionCount: number;
  error: string | null;
}

interface WalletRxActions {
  waitForSync: () => Promise<WalletState>;
  waitForFunds: () => Promise<bigint>;
  waitForSyncProgress: () => Promise<WalletState>;
  refresh: () => Promise<void>;
}

export function useWalletRx(): WalletRxState & WalletRxActions {
  const { wallet, isWalletConnected } = useWallet();
  const [state, setState] = useState<WalletState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Computed values
  const isSynced = state?.syncProgress?.synced ?? false;
  const syncProgress = state?.syncProgress ?? null;
  const nativeBalance = state?.balances?.[nativeToken()] ?? null;
  const allBalances = state?.balances ?? null;
  const transactionCount = state?.transactionHistory?.length ?? 0;

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
        
        // Log balance information like the example script
        if (walletState.balances) {
          const nativeBalance = walletState.balances[nativeToken()];
          console.log(`Native balance: ${nativeBalance}, balances: ${JSON.stringify(serializeBigInts(walletState.balances))}`);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch wallet state');
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

  // Wait for sync (similar to RxJS waitForSync)
  const waitForSync = useCallback(async (): Promise<WalletState> => {
    if (!wallet) {
      throw new Error('Wallet not connected');
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout waiting for wallet sync'));
      }, 60000);

      const checkSync = async () => {
        try {
          const walletState = await wallet.state();
          if (walletState.syncProgress?.synced) {
            clearTimeout(timeout);
            setState(walletState);
            resolve(walletState);
          } else {
            // Check again in 5 seconds
            setTimeout(checkSync, 5000);
          }
        } catch (error) {
          clearTimeout(timeout);
          reject(error);
        }
      };

      checkSync();
    });
  }, [wallet]);

  // Wait for funds (similar to RxJS waitForFunds)
  const waitForFunds = useCallback(async (): Promise<bigint> => {
    if (!wallet) {
      throw new Error('Wallet not connected');
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout waiting for funds'));
      }, 300000);

      const checkFunds = async () => {
        try {
          const walletState = await wallet.state();
          if (walletState.syncProgress?.synced) {
            const balance = walletState.balances;
            const nativeBalance = balance[nativeToken()];
            
            // Log balance information like the example script
            console.log(`Native balance: ${nativeBalance}, balances: ${JSON.stringify(serializeBigInts(balance))}`);
            
            if (nativeBalance === undefined || nativeBalance === BigInt(0)) {
              // Check again in 10 seconds
              setTimeout(checkFunds, 10000);
            } else {
              clearTimeout(timeout);
              setState(walletState);
              resolve(nativeBalance);
            }
          } else {
            // Check again in 5 seconds
            setTimeout(checkFunds, 5000);
          }
        } catch (error) {
          clearTimeout(timeout);
          reject(error);
        }
      };

      checkFunds();
    });
  }, [wallet]);

  // Wait for sync progress (similar to RxJS waitForSyncProgress)
  const waitForSyncProgress = useCallback(async (): Promise<WalletState> => {
    if (!wallet) {
      throw new Error('Wallet not connected');
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout waiting for sync progress'));
      }, 30000);

      const checkProgress = async () => {
        try {
          const walletState = await wallet.state();
          if (walletState.syncProgress !== undefined) {
            clearTimeout(timeout);
            setState(walletState);
            resolve(walletState);
          } else {
            // Check again in 5 seconds
            setTimeout(checkProgress, 5000);
          }
        } catch (error) {
          clearTimeout(timeout);
          reject(error);
        }
      };

      checkProgress();
    });
  }, [wallet]);

  // Manual refresh
  const refresh = useCallback(async (): Promise<void> => {
    if (!wallet) {
      throw new Error('Wallet not connected');
    }

    try {
      const walletState = await wallet.state();
      setState(walletState);
      setError(null);
      
      // Log balance information like the example script
      if (walletState.balances) {
        const nativeBalance = walletState.balances[nativeToken()];
        console.log(`Native balance: ${nativeBalance}, balances: ${JSON.stringify(serializeBigInts(walletState.balances))}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh wallet state');
      throw err;
    }
  }, [wallet]);

  return {
    // State
    state,
    isSynced,
    syncProgress,
    nativeBalance,
    allBalances,
    transactionCount,
    error,
    
    // Actions
    waitForSync,
    waitForFunds,
    waitForSyncProgress,
    refresh,
  };
} 