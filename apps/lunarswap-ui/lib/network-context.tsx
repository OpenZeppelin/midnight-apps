'use client';

import { useWallet } from '@/hooks/use-wallet';
import {
  type PropsWithChildren,
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

export type Network = {
  id: string;
  name: string;
  type: 'mainnet' | 'testnet';
  chainId?: string;
  rpcUrl?: string;
};

export type NetworkContextType = {
  currentNetwork: Network;
  setCurrentNetwork: (network: Network) => void;
  availableNetworks: Network[];
  isNetworkSynced: boolean;
  syncWithWallet: () => Promise<void>;
};

const availableNetworks: Network[] = [
  {
    id: 'midnight-testnet',
    name: 'testnet',
    type: 'testnet',
    chainId: 'testnet',
    rpcUrl: 'https://testnet.midnight.org',
  },
  {
    id: 'midnight-mainnet',
    name: 'mainnet',
    type: 'mainnet',
    chainId: 'mainnet',
    rpcUrl: 'https://mainnet.midnight.org',
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
  const { wallet, isWalletConnected } = useWallet();
  const [currentNetwork, setCurrentNetwork] = useState<Network>(
    availableNetworks[0],
  ); // Default to testnet
  const [isNetworkSynced, setIsNetworkSynced] = useState(false);

  // Function to detect wallet's current network
  const detectWalletNetwork = useCallback(async (): Promise<Network | null> => {
    if (!wallet || !isWalletConnected) {
      return null;
    }

    try {
      // Try to get network information from the wallet
      const walletState = await wallet.state();

      // Try to get service URI config which might contain network information
      const midnight = window.midnight;
      if (midnight?.mnLace) {
        try {
          const serviceUriConfig = await midnight.mnLace.serviceUriConfig();

          // Parse the service URI to determine network
          if (serviceUriConfig) {
            // Convert to string if it's not already a string
            const serviceUriString =
              typeof serviceUriConfig === 'string'
                ? serviceUriConfig
                : JSON.stringify(serviceUriConfig);

            if (
              serviceUriString.includes('testnet') ||
              serviceUriString.includes('test')
            ) {
              return (
                availableNetworks.find((n) => n.type === 'testnet') ||
                availableNetworks[0]
              );
            }
            if (
              serviceUriString.includes('mainnet') ||
              serviceUriString.includes('main')
            ) {
              return (
                availableNetworks.find((n) => n.type === 'mainnet') ||
                availableNetworks[1]
              );
            }
          }
        } catch (error) {
          console.warn('Failed to get service URI config:', error);
        }
      }

      // Try to detect based on wallet address format or other indicators
      if (walletState.address) {
        // You might be able to detect network based on address format
        // This is a placeholder - implement based on actual address format

        // For now, we'll assume testnet if we can't detect
        // This should be replaced with actual network detection logic
        return availableNetworks[0]; // Default to testnet
      }

      return null;
    } catch (error) {
      console.warn('Failed to detect wallet network:', error);
      return null;
    }
  }, [wallet, isWalletConnected]);

  // Sync network with wallet
  const syncWithWallet = useCallback(async () => {
    if (!isWalletConnected) {
      setIsNetworkSynced(false);
      return;
    }

    try {
      const walletNetwork = await detectWalletNetwork();
      if (walletNetwork) {
        setCurrentNetwork(walletNetwork);
        setIsNetworkSynced(true);
      } else {
        setIsNetworkSynced(false);
      }
    } catch (error) {
      console.error('Failed to sync network with wallet:', error);
      setIsNetworkSynced(false);
    }
  }, [isWalletConnected, detectWalletNetwork]);

  // Auto-sync when wallet connects/disconnects
  useEffect(() => {
    if (isWalletConnected) {
      syncWithWallet();
    } else {
      setIsNetworkSynced(false);
    }
  }, [isWalletConnected, syncWithWallet]);

  const contextValue: NetworkContextType = useMemo(
    () => ({
      currentNetwork,
      setCurrentNetwork,
      availableNetworks,
      isNetworkSynced,
      syncWithWallet,
    }),
    [currentNetwork, isNetworkSynced, syncWithWallet],
  );

  return (
    <NetworkContext.Provider value={contextValue}>
      {children}
    </NetworkContext.Provider>
  );
};
