'use client';

import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useWallet } from '@/hooks/use-wallet';
import { useRuntimeConfiguration } from '@/lib/runtime-configuration';
import type { NetworkConfig } from '@/utils/config';
import { detectWalletNetwork, type Network } from '../utils/wallet-utils';

export type NetworkContextType = {
  currentNetwork: Network;
  setCurrentNetwork: (network: Network) => void;
  availableNetworks: Network[];
  isNetworkSynced: boolean;
  syncWithWallet: () => Promise<void>;
};

function buildNetworksFromConfig(
  networks: Record<string, NetworkConfig>,
): Network[] {
  return Object.entries(networks).map(([id, net]) => ({
    id,
    name: net.name,
    rpcUrl: net.RPC_URL ?? '',
    explorerUrl: net.EXPLORER_URL ?? '',
    available: net.available,
  }));
}

export const NetworkContext = createContext<NetworkContextType | undefined>(
  undefined,
);

export interface NetworkProviderProps extends PropsWithChildren {
  // Add any additional props if needed
}

export const NetworkProvider: React.FC<Readonly<NetworkProviderProps>> = ({
  children,
}) => {
  const config = useRuntimeConfiguration();
  const { walletAPI, isConnected } = useWallet();

  const availableNetworks = useMemo(
    () => buildNetworksFromConfig(config.NETWORKS ?? {}),
    [config.NETWORKS],
  );

  const defaultNetwork =
    availableNetworks.find((n) => n.id === config.DEFAULT_NETWORK) ??
    availableNetworks[0];

  const [currentNetwork, setCurrentNetwork] = useState<Network>(defaultNetwork);
  const [isNetworkSynced, setIsNetworkSynced] = useState(false);

  // Initialize/sync current network when config or availableNetworks change
  useEffect(() => {
    const next =
      availableNetworks.find((n) => n.id === config.DEFAULT_NETWORK) ??
      availableNetworks[0];
    setCurrentNetwork((prev) => (prev.id !== next.id ? next : prev));
  }, [config.DEFAULT_NETWORK, availableNetworks]);

  // Sync network with wallet
  const syncWithWallet = useCallback(async () => {
    if (!isConnected || !walletAPI) {
      setIsNetworkSynced(false);
      return;
    }

    try {
      const addressInfo = await walletAPI.wallet.getShieldedAddresses();
      const isWalletWorking = !!addressInfo;

      if (isWalletWorking) {
        setIsNetworkSynced(true);
        const walletNetwork = await detectWalletNetwork(
          walletAPI.wallet,
          availableNetworks,
        );
        if (walletNetwork) {
          setCurrentNetwork(walletNetwork);
        }
      } else {
        setIsNetworkSynced(false);
      }
    } catch (error) {
      console.error(
        '[NetworkProvider] Failed to sync network with wallet:',
        error,
      );
      setIsNetworkSynced(false);
    }
  }, [isConnected, walletAPI, availableNetworks]);

  useEffect(() => {
    if (isConnected) {
      syncWithWallet();
    } else {
      setIsNetworkSynced(false);
    }
  }, [isConnected, syncWithWallet]);

  const contextValue: NetworkContextType = useMemo(
    () => ({
      currentNetwork,
      setCurrentNetwork,
      availableNetworks,
      isNetworkSynced,
      syncWithWallet,
    }),
    [currentNetwork, availableNetworks, isNetworkSynced, syncWithWallet],
  );

  return (
    <NetworkContext.Provider value={contextValue}>
      {children}
    </NetworkContext.Provider>
  );
};
