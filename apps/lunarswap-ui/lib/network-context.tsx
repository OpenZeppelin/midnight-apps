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
import { detectWalletNetwork, type Network } from './wallet-utils';

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
    rpcUrl: 'https://testnet.midnight.org',
    explorerUrl: 'https://testnet.midnight.org/explorer',
  },
  {
    id: 'midnight-mainnet',
    name: 'mainnet',
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
  const { wallet, isWalletConnected } = useWallet();
  const [currentNetwork, setCurrentNetwork] = useState<Network>(
    availableNetworks[0],
  ); // Default to testnet
  const [isNetworkSynced, setIsNetworkSynced] = useState(false);

  // Sync network with wallet
  const syncWithWallet = useCallback(async () => {
    if (!isWalletConnected) {
      setIsNetworkSynced(false);
      return;
    }

    try {
      const walletNetwork = await detectWalletNetwork(
        wallet,
        availableNetworks,
      );
      if (walletNetwork) {
        setCurrentNetwork(walletNetwork);
        setIsNetworkSynced(true);
      } else {
        // Network detection is not currently supported, keep current network
        console.warn(
          'Network detection not supported. Using current network setting.',
        );
        setIsNetworkSynced(false);
      }
    } catch (error) {
      console.error('Failed to sync network with wallet:', error);
      setIsNetworkSynced(false);
    }
  }, [isWalletConnected, wallet]);

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
