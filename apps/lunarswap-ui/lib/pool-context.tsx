'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import {
  createContractIntegration,
  DEMO_TOKENS,
  LunarswapContractIntegration,
} from './contract-integration';
import { useWallet } from '../hooks/use-wallet';
import { useRuntimeConfiguration } from './runtime-configuration';
import type { Ledger, Pair } from '@midnight-dapps/lunarswap-v1';

interface PoolData {
  isLoading: boolean;
  ledger: Ledger | null;
  allPairs: Array<{ identity: string; pair: Pair }>;
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
  children: React.ReactNode;
}

export const PoolProvider: React.FC<PoolProviderProps> = ({ children }) => {
  const { isConnected, providers, walletAPI } = useWallet();
  const runtimeConfig = useRuntimeConfiguration();
  const [isLoading, setIsLoading] = useState(false);
  const [ledger, setLedger] = useState<Ledger | null>(null);
  const [allPairs, setAllPairs] = useState<
    Array<{ identity: string; pair: Pair }>
  >([]);
  const [contractIntegration, setContractIntegration] =
    useState<LunarswapContractIntegration | null>(null);

  // Initialize contract integration
  useEffect(() => {
    const initializeContract = async () => {
      if (!isConnected || !walletAPI || !runtimeConfig) {
        setContractIntegration(null);
        return;
      }

      try {
        const integration = createContractIntegration(
          providers,
          walletAPI.wallet,
          runtimeConfig.LUNARSWAP_ADDRESS,
        );
        await integration.initialize();
        setContractIntegration(integration);
      } catch (error) {
        console.error('Failed to initialize contract integration:', error);
        setContractIntegration(null);
      }
    };

    initializeContract();
  }, [isConnected, walletAPI, providers, runtimeConfig]);

  // Fetch pool data when contract is ready
  const refreshPoolData = useCallback(async () => {
    if (!contractIntegration) {
      return;
    }

    setIsLoading(true);
    try {
      const poolLedger = await contractIntegration.fetchPoolData();
      setLedger(poolLedger);

      if (poolLedger) {
        const pairs = contractIntegration.getAllPairs();
        setAllPairs(pairs);
        console.log('Pool data refreshed:', {
          poolSize: poolLedger.pool.size(),
          pairsCount: pairs.length,
        });
      }
    } catch (error) {
      console.error('Failed to refresh pool data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [contractIntegration]);

  // Auto-refresh pool data when contract is initialized
  useEffect(() => {
    if (contractIntegration) {
      refreshPoolData();
    }
  }, [contractIntegration, refreshPoolData]);

  // Check if a pair exists
  const checkPairExists = useCallback(
    async (tokenA: string, tokenB: string): Promise<boolean> => {
      if (!contractIntegration) {
        return false;
      }
      return contractIntegration.isPairExists(tokenA, tokenB);
    },
    [contractIntegration],
  );

  // Get pair reserves
  const getPairReserves = useCallback(
    async (
      tokenA: string,
      tokenB: string,
    ): Promise<[bigint, bigint] | null> => {
      if (!contractIntegration) {
        return null;
      }
      return contractIntegration.getPairReserves(tokenA, tokenB);
    },
    [contractIntegration],
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
  const tokens = Object.values(DEMO_TOKENS);
  const pairs: Array<{ tokenA: string; tokenB: string; name: string }> = [];

  for (let i = 0; i < tokens.length; i++) {
    for (let j = i + 1; j < tokens.length; j++) {
      pairs.push({
        tokenA: tokens[i].symbol,
        tokenB: tokens[j].symbol,
        name: `${tokens[i].symbol}/${tokens[j].symbol}`,
      });
    }
  }

  return pairs;
};
