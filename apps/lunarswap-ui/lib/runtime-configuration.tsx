'use client';

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import { getActiveNetworkConfig, type NetworkConfig } from '@/utils/config';

export interface RuntimeConfiguration {
  LOGGING_LEVEL: string;
  DEFAULT_NETWORK: string;
  NETWORKS: Record<string, NetworkConfig>;
}

const RuntimeConfigurationContext = createContext<RuntimeConfiguration | null>(
  null,
);

export const useRuntimeConfiguration = (): RuntimeConfiguration => {
  const configuration = useContext(RuntimeConfigurationContext);
  if (!configuration) {
    throw new Error('Configuration not loaded');
  }
  return configuration;
};

/**
 * Returns the active network config (from DEFAULT_NETWORK).
 * Use this instead of reading config.INDEXER_URI etc. directly.
 */
export const useActiveNetworkConfig = (): NetworkConfig => {
  const config = useRuntimeConfiguration();
  return getActiveNetworkConfig(config);
};

interface RuntimeConfigurationProviderProps {
  children: ReactNode;
}

interface LoadedConfigJson {
  LOGGING_LEVEL?: string;
  DEFAULT_NETWORK?: string;
  NETWORKS?: Record<string, NetworkConfig>;
}

/**
 * Loads runtime configuration from static file (in /public folder).
 */
export const loadRuntimeConfiguration =
  async (): Promise<RuntimeConfiguration> => {
    const response = await fetch(`/config.json?t=${Date.now()}`);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const value: LoadedConfigJson = await response.json();

    const networks = value.NETWORKS ?? {};
    const defaultNetwork = value.DEFAULT_NETWORK ?? 'preprod';

    return {
      LOGGING_LEVEL: value.LOGGING_LEVEL ?? 'silent',
      DEFAULT_NETWORK: defaultNetwork,
      NETWORKS: networks,
    };
  };

export const RuntimeConfigurationProvider = ({
  children,
}: RuntimeConfigurationProviderProps) => {
  const [runtimeConfig, setRuntimeConfig] =
    useState<RuntimeConfiguration | null>(null);

  useEffect(() => {
    const loadConfig = async (): Promise<void> => {
      const loadedConfig = await loadRuntimeConfiguration();
      setRuntimeConfig(loadedConfig);
    };
    void loadConfig();
  }, []);

  return (
    <RuntimeConfigurationContext.Provider value={runtimeConfig}>
      {runtimeConfig ? children : <div>Loading configuration...</div>}
    </RuntimeConfigurationContext.Provider>
  );
};
