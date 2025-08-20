'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import {
  LunarswapIntegration,
  type ContractStatusInfo,
  type ContractStatus,
} from './lunarswap-integration';
import { useRuntimeConfiguration } from './runtime-configuration';
import { useMidnightWallet } from './wallet-context';
import type { Pair } from '@midnight-dapps/lunarswap-v1';

interface LunarswapContextType {
  lunarswap: LunarswapIntegration | null;
  status: ContractStatus;
  statusInfo: ContractStatusInfo;
  isLoading: boolean;
  error: string | null;
  refreshContract: () => Promise<void>;
  publicState: unknown | null;
  allPairs: Array<Pool>;
  refreshPublicState: () => Promise<void>;
  pauseRefresh: () => void;
  resumeRefresh: () => void;
}

const LunarswapContext = createContext<LunarswapContextType | null>(null);

export const useLunarswapContext = () => {
  const context = useContext(LunarswapContext);
  if (!context) {
    throw new Error(
      'useLunarswapContext must be used within a LunarswapContext',
    );
  }
  return context;
};

interface LunarswapProviderProps {
  children: ReactNode;
}

export type Pool = {
  pairId: string;
  pair: Pair;
};

export type Token = {
  symbol: string;
  name: string;
  address: string;
  type: string;
};

export const LunarswapProvider = ({ children }: LunarswapProviderProps) => {
  const runtimeConfig = useRuntimeConfiguration();
  const midnightWallet = useMidnightWallet();
  const [lunarswap, setLunarswap] = useState<LunarswapIntegration | null>(null);
  const [status, setStatus] = useState<ContractStatus>('not-configured');
  const [statusInfo, setStatusInfo] = useState<ContractStatusInfo>({
    status: 'not-configured',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [publicState, setPublicState] = useState<unknown | null>(null);
  const [allPairs, setAllPairs] = useState<Array<Pool>>([]);
  const [allTokens, setAllTokens] = useState<Array<Token>>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isRefreshPaused, setIsRefreshPaused] = useState(false);

  // Initialize or update contract integration
  const initializeLunarswap = useCallback(async () => {
    if (!runtimeConfig?.LUNARSWAP_ADDRESS) {
      setStatus('not-configured');
      setStatusInfo({
        status: 'not-configured',
        message: 'No contract address configured',
      });
      setLunarswap(null);
      return;
    }

    // TODO: Question: why is it required to have connected wallet to join contract?
    if (!midnightWallet.isConnected || !midnightWallet.walletAPI) {
      setStatus('not-configured');
      setStatusInfo({
        status: 'not-configured',
        message: 'Please connect your wallet first',
      });
      setLunarswap(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('[LunarswapContext] Creating contract integration...');
      const lunarswap = new LunarswapIntegration(
        midnightWallet.providers,
        midnightWallet.walletAPI,
        midnightWallet.callback,
        runtimeConfig.LUNARSWAP_ADDRESS,
      );

      if (!lunarswap) {
        setStatus('not-configured');
        setStatusInfo({
          status: 'not-configured',
          message: 'Failed to create contract integration',
        });
        setLunarswap(null);
        return;
      }

      setLunarswap(lunarswap);

      console.log('[LunarswapContext] Joining contract...');
      const result = await lunarswap.joinContract();

      setStatus(result.status);
      setStatusInfo(result);

      console.log('[LunarswapContext] Contract join result:', result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('[LunarswapContext] Failed to initialize contract:', err);
      setError(errorMessage);
      setStatus('error');
      setStatusInfo({
        status: 'error',
        error: errorMessage,
        message: 'Failed to initialize contract',
      });
    } finally {
      setIsLoading(false);
    }
  }, [
    runtimeConfig,
    midnightWallet.isConnected,
    midnightWallet.walletAPI,
    midnightWallet.callback,
    midnightWallet.providers,
  ]);

  // Refresh contract integration
  const refreshContract = useCallback(async () => {
    await initializeLunarswap();
  }, [initializeLunarswap]);

  // Refresh public state
  const refreshPublicState = useCallback(async () => {
    if (!lunarswap || status !== 'connected' || isRefreshing) {
      console.log('[LunarswapContext] Refresh blocked:', {
        hasLunarswap: !!lunarswap,
        status,
        isRefreshing
      });
      setPublicState(null);
      setAllPairs([]);
      return;
    }

    // Prevent multiple simultaneous refreshes
    if (isRefreshing) {
      console.log('[LunarswapContext] Refresh already in progress, skipping...');
      return;
    }

    // Add additional guard to prevent refresh during component transitions
    if (isRefreshPaused) {
      console.log('[LunarswapContext] Refresh paused, skipping...');
      return;
    }

    setIsRefreshing(true);
    setRetryCount(0);

    try {
      console.log('[LunarswapContext] Fetching public state...');

      // Add a small delay to ensure contract is fully initialized
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const state = await lunarswap.getPublicState();
      setPublicState(state);

      if (state) {
        console.log('[LunarswapContext] Fetching all pairs...');
        const pairs = lunarswap.getAllPairs();
        setAllPairs(pairs);
        console.log('[LunarswapContext] Fetched pairs:', pairs.length);
      } else {
        setAllPairs([]);
      }
    } catch (err) {
      console.error('[LunarswapContext] Failed to fetch public state:', err);

      // If contract is not initialized, try again after a longer delay (but limit retries)
      if (
        err instanceof Error &&
        err.message.includes('Contract not initialized') &&
        retryCount < 3
      ) {
        console.log(
          `[LunarswapContext] Contract not initialized, retrying after delay... (attempt ${retryCount + 1}/3)`,
        );
        setRetryCount(prev => prev + 1);
        setTimeout(() => {
          if (status === 'connected' && lunarswap && !isRefreshing && !isRefreshPaused) {
            refreshPublicState();
          }
        }, 3000);
      } else if (retryCount >= 3) {
        console.log('[LunarswapContext] Max retries reached, stopping refresh attempts');
      }

      setPublicState(null);
      setAllPairs([]);
    } finally {
      setIsRefreshing(false);
    }
  }, [lunarswap, status, isRefreshing, retryCount, isRefreshPaused]);

  // Initialize contract when dependencies change
  useEffect(() => {
    console.log(
      '[LunarswapContext] Dependencies changed, reinitializing contract...',
      {
        isConnected: midnightWallet.isConnected,
        hasWalletAPI: !!midnightWallet.walletAPI,
        hasProviders: !!midnightWallet.providers,
        providers: midnightWallet.providers
          ? Object.keys(midnightWallet.providers)
          : [],
      },
    );
    initializeLunarswap();
  }, [
    initializeLunarswap,
    midnightWallet.isConnected,
    midnightWallet.walletAPI,
    midnightWallet.providers,
  ]);

  // Fetch public state when contract is connected and refresh every 5 seconds
  useEffect(() => {
    console.log('[LunarswapContext] Public state refresh effect triggered:', {
      status,
      hasLunarswap: !!lunarswap,
      isRefreshPaused,
      isRefreshing
    });
    
    if (status === 'connected' && lunarswap && !isRefreshPaused && !isRefreshing) {
      console.log('[LunarswapContext] Setting up refresh timers');
      
      // Add a longer delay to prevent immediate refresh when components mount
      const initialTimer = setTimeout(() => {
        if (!isRefreshPaused && !isRefreshing) {
          console.log('[LunarswapContext] Initial refresh timer fired');
          refreshPublicState();
        }
      }, 5000); // Increased from 2000ms to 5000ms

      // Set up 10-second interval for continuous updates (increased from 5s)
      const intervalTimer = setInterval(() => {
        if (!isRefreshPaused && !isRefreshing) {
          console.log(
            '[LunarswapContext] Refreshing public state (10s interval)...',
          );
          refreshPublicState();
        }
      }, 10000); // Increased from 5000ms to 10000ms

      return () => {
        console.log('[LunarswapContext] Cleaning up refresh timers');
        clearTimeout(initialTimer);
        clearInterval(intervalTimer);
      };
    }

    // Only clear public state, keep pairs data for better UX
    setPublicState(null);
  }, [status, lunarswap, refreshPublicState, isRefreshPaused, isRefreshing]);

  // Pause/resume refresh functions
  const pauseRefresh = useCallback(() => {
    console.log('[LunarswapContext] Pausing refresh...');
    setIsRefreshPaused(true);
  }, []);

  const resumeRefresh = useCallback(() => {
    console.log('[LunarswapContext] Resuming refresh...');
    setIsRefreshPaused(false);
  }, []);

  const contextValue: LunarswapContextType = {
    lunarswap,
    status,
    statusInfo,
    isLoading,
    error,
    refreshContract,
    publicState,
    allPairs,
    refreshPublicState,
    pauseRefresh,
    resumeRefresh,
  };

  return (
    <LunarswapContext.Provider value={contextValue}>
      {children}
    </LunarswapContext.Provider>
  );
};
