import type {
  DAppConnectorWalletAPI,
  DAppConnectorWalletState,
  ServiceUriConfig,
} from '@midnight-ntwrk/dapp-connector-api';

// Helper function to add timeout to promises
export const withTimeout = (
  promise: Promise<unknown>,
  timeoutMs: number,
  errorMessage: string,
): Promise<unknown> => {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs),
    ),
  ]);
};

export interface WalletConnectionResult {
  wallet: DAppConnectorWalletAPI;
  state: DAppConnectorWalletState;
  serviceUriConfig: ServiceUriConfig;
}

export interface WalletConnectionOptions {
  checkExisting?: boolean;
  enableTimeout?: number;
  stateTimeout?: number;
  isEnabledTimeout?: number;
  serviceUriTimeout?: number;
}

export interface Network {
  id: string;
  name: string;
  type: 'testnet' | 'mainnet';
  rpcUrl: string;
  explorerUrl: string;
}

/**
 * Detect the wallet's current network based on service URI config and other indicators
 * Note: Network detection from wallet state is not currently supported
 */
export const detectWalletNetwork = async (
  wallet: DAppConnectorWalletAPI | null,
  _availableNetworks: Network[],
): Promise<Network | null> => {
  if (!wallet) {
    return null;
  }
  return null;
};

/**
 * Connect to the Midnight Lace wallet with proper error handling and timeouts
 */
export const connectToWallet = async (
  options: WalletConnectionOptions = {},
): Promise<WalletConnectionResult> => {
  const {
    checkExisting = true,
    enableTimeout = 15000,
    stateTimeout = 10000,
    isEnabledTimeout = 10000,
    serviceUriTimeout = 5000,
  } = options;

  // Check if Midnight Lace wallet is available
  const midnight = window.midnight;
  if (!midnight?.mnLace) {
    throw new Error(
      'Midnight Lace wallet not found. Please install the extension.',
    );
  }

  const connector = midnight.mnLace;

  // Check if already enabled (optional)
  if (checkExisting) {
    try {
      const isEnabled = await withTimeout(
        connector.isEnabled(),
        isEnabledTimeout,
        'Timeout checking if wallet is enabled',
      );

      if (isEnabled) {
        // If already enabled, just get the current state and service URI config
        const existingWallet = await connector.enable();
        const existingState = await existingWallet.state();
        const serviceUriConfig = (await withTimeout(
          connector.serviceUriConfig(),
          serviceUriTimeout,
          'Timeout getting service URI config',
        )) as ServiceUriConfig;

        if (existingState?.address) {
          return {
            wallet: existingWallet,
            state: existingState,
            serviceUriConfig,
          };
        }
      }
    } catch (_error) {}
  }

  // Enable the wallet with timeout
  const wallet: DAppConnectorWalletAPI = (await withTimeout(
    connector.enable(),
    enableTimeout,
    'Timeout enabling wallet',
  )) as DAppConnectorWalletAPI;

  // Get wallet state with timeout
  const state: DAppConnectorWalletState = (await withTimeout(
    wallet.state(),
    stateTimeout,
    'Timeout getting wallet state',
  )) as DAppConnectorWalletState;

  // Get service URI config with timeout
  const serviceUriConfig: ServiceUriConfig = (await withTimeout(
    connector.serviceUriConfig(),
    serviceUriTimeout,
    'Timeout getting service URI config',
  )) as ServiceUriConfig;

  if (!state?.address) {
    throw new Error('Could not get wallet address');
  }

  return { wallet, state, serviceUriConfig };
};

/**
 * Disconnect wallet and clear all stored data
 */
export const disconnectWallet = () => {
  // Clear localStorage
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('wallet_connection_status');
      localStorage.removeItem('wallet_state');
      localStorage.removeItem('wallet_address');
    } catch (_error) {}
  }
};

/**
 * Format wallet address to extract coin and encryption public keys
 */
export const formatAddress = (address: string | undefined) => {
  if (!address) return { coinPublicKey: '', encryptionPublicKey: '' };
  const parts = address.split('|');
  if (parts.length >= 2) {
    return {
      coinPublicKey: parts[0],
      encryptionPublicKey: parts[1],
    };
  }
  return {
    coinPublicKey: address,
    encryptionPublicKey: '',
  };
};
