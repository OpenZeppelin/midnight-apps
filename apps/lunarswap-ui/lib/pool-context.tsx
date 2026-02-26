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
import { useLunarswapContext } from './lunarswap-context';

interface PoolData {
  isLoading: boolean;
  ledger: Ledger | null;
  allPairs: Array<{ pairId: string; pair: Pair }>;
  refreshPoolData: () => Promise<void>;
  checkPairExists: (tokenA: string, tokenB: string) => Promise<boolean>;
  getPairReserves: (
    tokenA: string,
    tokenB: string,
  ) => Promise<[bigint, bigint] | null>;
}

const PoolContext = createContext<PoolData | null>(null);

export const usePool = (): PoolData => {
  const context = useContext(PoolContext);
  if (!context) {
    throw new Error('usePool must be used within a PoolProvider');
  }
  return context;
};

interface PoolProviderProps {
  children: ReactNode;
}

export const PoolProvider = ({ children }: PoolProviderProps) => {
  const {
    lunarswap,
    publicState,
    allPairs: contextAllPairs,
  } = useLunarswapContext();
  const _logger = useLogger();
  const [isLoading, setIsLoading] = useState(false);
  const [ledger, setLedger] = useState<Ledger | null>(null);
  const [allPairs, setAllPairs] = useState<
    Array<{ pairId: string; pair: Pair }>
  >([]);

  // Fetch pool data when contract is ready
  const refreshPoolData = useCallback(async () => {
    if (!lunarswap) {
      return;
    }

    setIsLoading(true);
    try {
      setLedger(publicState);
      setAllPairs(contextAllPairs);
    } catch (error) {
      _logger?.error(
        `Failed to refresh pool data: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      setIsLoading(false);
    }
  }, [lunarswap, publicState, contextAllPairs, _logger]);

  // Auto-refresh pool data when contract is initialized
  useEffect(() => {
    if (lunarswap) {
      refreshPoolData();
    }
  }, [lunarswap, refreshPoolData]);

  // Check if a pair exists
  const checkPairExists = useCallback(
    async (_tokenA: string, _tokenB: string): Promise<boolean> => {
      if (!lunarswap) {
        return false;
      }
      // TODO: Implement pair existence check
      return false;
    },
    [lunarswap],
  );

  // Get pair reserves
  const getPairReserves = useCallback(
    async (
      _tokenA: string,
      _tokenB: string,
    ): Promise<[bigint, bigint] | null> => {
      if (!lunarswap) {
        return null;
      }
      // TODO: Implement get pair reserves
      return null;
    },
    [lunarswap],
  );

  const contextValue: PoolData = {
    isLoading,
    ledger,
    allPairs,
    refreshPoolData,
    checkPairExists,
    getPairReserves,
  };

  return (
    <PoolContext.Provider value={contextValue}>{children}</PoolContext.Provider>
  );
};

// Export available token pairs for the demo
export const getAvailableTokenPairs = () => {
  const pairs: Array<{ tokenA: string; tokenB: string; name: string }> = [];
  return pairs;
};
