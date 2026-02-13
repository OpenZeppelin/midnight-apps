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
import { getNetworkId } from '../utils/config';
import { detectWalletNetwork, type Network } from '../utils/wallet-utils';

export type NetworkContextType = {
  currentNetwork: Network;
  setCurrentNetwork: (network: Network) => void;
  availableNetworks: Network[];
  isNetworkSynced: boolean;
  syncWithWallet: () => Promise<void>;
  isMainnetEnabled: boolean;
};

const availableNetworks: Network[] = [
  {
    id: 'midnight-testnet',
    name: 'Testnet',
    type: 'testnet',
    rpcUrl: 'https://testnet.midnight.org',
    explorerUrl: 'https://testnet.midnight.org/explorer',
  },
  {
    id: 'midnight-mainnet',
    name: 'Mainnet (Coming Soon)',
    type: 'mainnet',
    rpcUrl: 'https://mainnet.midnight.org',
    explorerUrl: 'https://mainnet.midnight.org/explorer',
  },
];

export const NetworkContext = createContext<NetworkContextType | undefined>(
  undefined,
);

export interface NetworkProviderProps extends PropsWithChildren {
  // Add any additional props if needed
}

export const NetworkProvider: React.FC<Readonly<NetworkProviderProps>> = ({
  children,
}) => {
  const { walletAPI, isConnected } = useWallet();
  const [currentNetwork, setCurrentNetwork] = useState<Network>(
    availableNetworks[0], // Default to testnet
  );
  const [isNetworkSynced, setIsNetworkSynced] = useState(false);
  const [isMainnetEnabled] = useState(false); // Mainnet is disabled for now

  // Initialize network from config
  useEffect(() => {
    const configNetwork = getNetworkId();
    if (configNetwork === 'TestNet') {
      setCurrentNetwork(availableNetworks[0]); // Testnet
    } else if (configNetwork === 'MainNet' && isMainnetEnabled) {
      setCurrentNetwork(availableNetworks[1]); // Mainnet (if enabled)
    }
  }, [isMainnetEnabled]);

  // Sync network with wallet
  const syncWithWallet = useCallback(async () => {
    if (!isConnected || !walletAPI) {
      setIsNetworkSynced(false);
      return;
    }

    try {
      // Get wallet state to check if wallet is working
      const addressInfo = await walletAPI.wallet.getShieldedAddresses();

      // If we can get wallet state, consider it synced
      // In a real implementation, you would check actual sync status
      const isWalletWorking = !!addressInfo;

      if (isWalletWorking) {
        setIsNetworkSynced(true);

        // Try to detect network from wallet (if supported)
        const walletNetwork = await detectWalletNetwork(
          walletAPI.wallet,
          availableNetworks,
        );

        if (walletNetwork) {
          setCurrentNetwork(walletNetwork);
        } else {
          // Network detection not supported, using config network
          // Keep current network from config
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
  }, [isConnected, walletAPI]);

  // Auto-sync when wallet connects/disconnects
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
      isMainnetEnabled,
    }),
    [currentNetwork, isNetworkSynced, syncWithWallet, isMainnetEnabled],
  );

  return (
    <NetworkContext.Provider value={contextValue}>
      {children}
    </NetworkContext.Provider>
  );
};
