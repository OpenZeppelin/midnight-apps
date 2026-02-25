'use client';

import type {
  Ledger,
  Pair,
} from '@openzeppelin/midnight-apps-contracts/dist/artifacts/lunarswap/Lunarswap/contract';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useLogger } from '@/hooks/use-logger';
import {
  type ContractStatus,
  type ContractStatusInfo,
  LunarswapIntegration,
} from './lunarswap-integration';
import { useActiveNetworkConfig } from './runtime-configuration';
import { useMidnightWallet } from './wallet-context';

interface LunarswapContextType {
  lunarswap: LunarswapIntegration | null;
  status: ContractStatus;
  statusInfo: ContractStatusInfo;
  isLoading: boolean;
  isLoadingPublicState: boolean; // Add new loading state for public state
  hasLoadedDataOnce: boolean; // Track if we've ever loaded data
  error: string | null;
  refreshContract: () => Promise<void>;
  publicState: Ledger | null;
  allPairs: Pool[];
  totalSupply: Ledger['totalSupply'] | null;
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

export const LunarswapProvider = ({ children }: LunarswapProviderProps) => {
  const _logger = useLogger();
  const activeNetwork = useActiveNetworkConfig();
  const midnightWallet = useMidnightWallet();
  const [lunarswap, setLunarswap] = useState<LunarswapIntegration | null>(null);
  const [status, setStatus] = useState<ContractStatus>('not-configured');
  const [statusInfo, setStatusInfo] = useState<ContractStatusInfo>({
    status: 'not-configured',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [publicState, setPublicState] = useState<Ledger | null>(null);
  const [allPairs, setAllPairs] = useState<Pool[]>([]);
  const [totalSupply, setLpTotalSupply] = useState<
    Ledger['totalSupply'] | null
  >(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isRefreshPaused, setIsRefreshPaused] = useState(false);
  const [hasLoadedDataOnce, setHasLoadedDataOnce] = useState(false); // Track if we've ever loaded data successfully

  // Initialize or update contract integration
  const initializeLunarswap = useCallback(async () => {
    if (!activeNetwork.LUNARSWAP_ADDRESS) {
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
      const zkConfigPath =
        typeof window !== 'undefined'
          ? `${window.location.origin}/zkir`
          : undefined;
      const lunarswap = new LunarswapIntegration(
        midnightWallet.providers,
        midnightWallet.walletAPI,
        midnightWallet.callback,
        activeNetwork.LUNARSWAP_ADDRESS,
        _logger,
        zkConfigPath,
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

      const result = await lunarswap.joinContract();

      setStatus(result.status);
      setStatusInfo(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      _logger?.error(
        { error: err },
        `[LunarswapContext] Failed to initialize contract: ${errorMessage}`,
      );
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
    activeNetwork.LUNARSWAP_ADDRESS,
    midnightWallet.isConnected,
    midnightWallet.walletAPI,
    midnightWallet.callback,
    midnightWallet.providers,
    _logger,
  ]);

  // Refresh contract integration
  const refreshContract = useCallback(async () => {
    await initializeLunarswap();
  }, [initializeLunarswap]);

  // Refresh public state
  const refreshPublicState = useCallback(async () => {
    if (!lunarswap || status !== 'connected' || isRefreshing) {
      setPublicState(null);
      setAllPairs([]);
      setLpTotalSupply(null);
      return;
    }

    // Prevent multiple simultaneous refreshes
    if (isRefreshing) {
      return;
    }

    // Add additional guard to prevent refresh during component transitions
    if (isRefreshPaused) {
      return;
    }

    setIsRefreshing(true);
    setRetryCount(0);

    try {
      // Add a small delay to ensure contract is fully initialized
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const state = await lunarswap.getPublicState();
      setPublicState(state);

      if (state) {
        const pairs = lunarswap.getAllPairs();
        setAllPairs(pairs);
        const lpSupply = state.totalSupply;
        setLpTotalSupply(lpSupply);
        setHasLoadedDataOnce(true); // Mark that we've successfully loaded data
      } else {
        setAllPairs([]);
      }
    } catch (err) {
      _logger?.error(
        { error: err },
        `[LunarswapContext] Failed to fetch public state: ${err instanceof Error ? err.message : String(err)}`,
      );

      // If contract is not initialized, try again after a longer delay (but limit retries)
      if (
        err instanceof Error &&
        err.message.includes('Contract not initialized') &&
        retryCount < 3
      ) {
        _logger?.info(
          `[LunarswapContext] Contract not initialized, retrying after delay... (attempt ${retryCount + 1}/3)`,
        );
        setRetryCount((prev) => prev + 1);
        setTimeout(() => {
          if (
            status === 'connected' &&
            lunarswap &&
            !isRefreshing &&
            !isRefreshPaused
          ) {
            refreshPublicState();
          }
        }, 3000);
      } else if (retryCount >= 3) {
        _logger?.warn(
          '[LunarswapContext] Max retries reached, stopping refresh attempts',
        );
      }

      setPublicState(null);
      setAllPairs([]);
    } finally {
      setIsRefreshing(false);
    }
  }, [lunarswap, status, isRefreshing, retryCount, isRefreshPaused, _logger]);

  // Initialize contract when dependencies change
  useEffect(() => {
    initializeLunarswap();
  }, [initializeLunarswap]);

  // Fetch public state when contract is connected and refresh every 5 seconds
  useEffect(() => {
    if (
      status === 'connected' &&
      lunarswap &&
      !isRefreshPaused &&
      !isRefreshing
    ) {
      // Add a longer delay to prevent immediate refresh when components mount
      const initialTimer = setTimeout(() => {
        if (!isRefreshPaused && !isRefreshing) {
          refreshPublicState();
        }
      }, 8000); // Increased from 5000ms to 8000ms for more reliable initial loading

      // Set up 10-second interval for continuous updates (increased from 5s)
      const intervalTimer = setInterval(() => {
        if (!isRefreshPaused && !isRefreshing) {
          refreshPublicState();
        }
      }, 10000); // Increased from 5000ms to 10000ms

      return () => {
        clearTimeout(initialTimer);
        clearInterval(intervalTimer);
      };
    }

    // Only clear public state, keep pairs data for better UX
    setPublicState(null);
  }, [status, lunarswap, refreshPublicState, isRefreshPaused, isRefreshing]);

  // Pause/resume refresh functions
  const pauseRefresh = useCallback(() => {
    setIsRefreshPaused(true);
  }, []);

  const resumeRefresh = useCallback(() => {
    setIsRefreshPaused(false);
  }, []);

  const contextValue: LunarswapContextType = {
    lunarswap,
    status,
    statusInfo,
    isLoading,
    isLoadingPublicState: isRefreshing && !hasLoadedDataOnce, // Only show loading if we haven't loaded data before
    hasLoadedDataOnce,
    error,
    refreshContract,
    publicState,
    allPairs,
    totalSupply,
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
