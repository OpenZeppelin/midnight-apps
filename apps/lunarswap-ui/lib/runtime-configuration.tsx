'use client';

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';

export interface RuntimeConfiguration {
  LOGGING_LEVEL: string;
  NETWORK_ID: string;
  PUBLIC_URL: string;
  INDEXER_URI: string;
  INDEXER_WS_URI: string;
  LUNARSWAP_ADDRESS: string;
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

interface RuntimeConfigurationProviderProps {
  children: ReactNode;
}

/**
 * Loads runtime configuration from static file (in /public folder).
 */
export const loadRuntimeConfiguration =
  async (): Promise<RuntimeConfiguration> => {
    const response = await fetch(`/config.json?t=${Date.now()}`);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const value: Record<string, string> = await response.json();

    return {
      LOGGING_LEVEL: value.LOGGING_LEVEL,
      NETWORK_ID: value.NETWORK_ID,
      PUBLIC_URL: value.PUBLIC_URL,
      INDEXER_URI: value.INDEXER_URI,
      INDEXER_WS_URI: value.INDEXER_WS_URI,
      LUNARSWAP_ADDRESS: value.LUNARSWAP_ADDRESS,
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
