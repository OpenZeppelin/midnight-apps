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
  /** Injection key under `window.midnight` for the connected provider. */
  walletKey: string;
  /** Reverse-DNS wallet id when the provider exposes `rdns` (v4). */
  walletRdns?: string;
}

export interface WalletConnectionOptions {
  checkExisting?: boolean;
  enableTimeout?: number;
  stateTimeout?: number;
  isEnabledTimeout?: number;
  serviceUriTimeout?: number;
  /** Preferred injection key (UUID or legacy alias) from a prior connection. */
  walletKey?: string | null;
  /** Preferred reverse-DNS id from a prior connection. */
  walletRdns?: string | null;
  /**
   * Network id for the v4 `connect(networkId)` flow.
   * Only `'mainnet'` is standardized; wallets define others (e.g. `'preprod'`).
   * @see https://docs.midnight.network/guides/react-wallet-connect
   */
  networkId?: string;
}

export interface Network {
  id: string;
  name: string;
  type: 'testnet' | 'mainnet';
  rpcUrl: string;
  explorerUrl: string;
}

/** LocalStorage keys for persisting the selected connector identity. */
export const WALLET_CONNECTOR_STORAGE_KEYS = {
  KEY: 'wallet_connector_key',
  RDNS: 'wallet_connector_rdns',
} as const;

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

  console.warn(
    'Network detection from wallet state is not currently supported. Please set network manually.',
  );
  return null;
};

/** Runtime shape of an injected Midnight InitialAPI / legacy connector. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type MidnightInjectedApi = any;

export type MidnightApiKind = 'v4' | 'v3';

export interface MidnightProviderInfo {
  /** Object key under `window.midnight` (UUID or legacy alias like `mnLace`). */
  key: string;
  api: MidnightInjectedApi;
  apiKind: MidnightApiKind;
  name?: string;
  rdns?: string;
  icon?: string;
}

const isV4InitialApi = (api: MidnightInjectedApi): boolean =>
  !!api && typeof api.connect === 'function';

const isV3ConnectorApi = (api: MidnightInjectedApi): boolean =>
  !!api && typeof api.enable === 'function';

/**
 * Enumerate injected Midnight wallet providers from `window.midnight`.
 * Accepts v4 InitialAPI (`connect`) and legacy v3 connectors (`enable`).
 * @see https://docs.midnight.network/guides/react-wallet-connect
 */
export const listMidnightProviders = (): MidnightProviderInfo[] => {
  const midnight = typeof window !== 'undefined' ? window.midnight : undefined;
  if (!midnight) return [];

  const providers: MidnightProviderInfo[] = [];

  for (const [key, api] of Object.entries(midnight)) {
    if (isV4InitialApi(api)) {
      providers.push({
        key,
        api,
        apiKind: 'v4',
        name: typeof api.name === 'string' ? api.name : undefined,
        rdns: typeof api.rdns === 'string' ? api.rdns : undefined,
        icon: typeof api.icon === 'string' ? api.icon : undefined,
      });
      continue;
    }
    if (isV3ConnectorApi(api)) {
      providers.push({
        key,
        api,
        apiKind: 'v3',
        name: typeof api.name === 'string' ? api.name : undefined,
      });
    }
  }

  return providers;
};

/**
 * Resolve a Midnight wallet connector from `window.midnight`.
 * Lace injects under a UUID key; hardcoding `mnLace` often resolves to undefined.
 * When a prior selection (`walletKey` / `walletRdns`) is provided, match that
 * provider first so reconnection hits the same wallet. Otherwise prefer a v4
 * InitialAPI, then a v3 connector, with `mnLace` as a last-resort legacy alias.
 * @see https://docs.midnight.network/guides/react-wallet-connect
 */
export const resolveMidnightConnector = (options?: {
  walletKey?: string | null;
  walletRdns?: string | null;
}): MidnightProviderInfo | undefined => {
  const providers = listMidnightProviders();
  const midnight = typeof window !== 'undefined' ? window.midnight : undefined;

  const preferredKey = options?.walletKey ?? null;
  const preferredRdns = options?.walletRdns ?? null;

  if (preferredKey) {
    const byKey = providers.find((p) => p.key === preferredKey);
    if (byKey) return byKey;

    // Key may still exist but fail the enable/connect filter (e.g. partial inject).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = midnight ? (midnight as any)[preferredKey] : undefined;
    if (raw) {
      if (isV4InitialApi(raw)) {
        return {
          key: preferredKey,
          api: raw,
          apiKind: 'v4',
          name: typeof raw.name === 'string' ? raw.name : undefined,
          rdns: typeof raw.rdns === 'string' ? raw.rdns : undefined,
          icon: typeof raw.icon === 'string' ? raw.icon : undefined,
        };
      }
      if (isV3ConnectorApi(raw)) {
        return {
          key: preferredKey,
          api: raw,
          apiKind: 'v3',
          name: typeof raw.name === 'string' ? raw.name : undefined,
        };
      }
    }
  }

  if (preferredRdns) {
    const byRdns = providers.find((p) => p.rdns === preferredRdns);
    if (byRdns) return byRdns;
  }

  if (providers.length === 0) {
    // Legacy convenience alias (may be undefined when only a UUID key is present).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const legacy = midnight ? (midnight as any).mnLace : undefined;
    if (legacy && (isV3ConnectorApi(legacy) || isV4InitialApi(legacy))) {
      return {
        key: 'mnLace',
        api: legacy,
        apiKind: isV4InitialApi(legacy) ? 'v4' : 'v3',
        name: typeof legacy.name === 'string' ? legacy.name : undefined,
        rdns: typeof legacy.rdns === 'string' ? legacy.rdns : undefined,
      };
    }
    return undefined;
  }

  // Prefer v4 InitialAPI (UUID-keyed Lace) over legacy v3 when no selection is saved.
  const v4 = providers.find((p) => p.apiKind === 'v4');
  if (v4) return v4;

  return providers[0];
};

const readStoredConnectorIdentity = (): {
  walletKey: string | null;
  walletRdns: string | null;
} => {
  if (typeof window === 'undefined') {
    return { walletKey: null, walletRdns: null };
  }
  try {
    return {
      walletKey: localStorage.getItem(WALLET_CONNECTOR_STORAGE_KEYS.KEY),
      walletRdns: localStorage.getItem(WALLET_CONNECTOR_STORAGE_KEYS.RDNS),
    };
  } catch {
    return { walletKey: null, walletRdns: null };
  }
};

export const persistConnectorIdentity = (
  walletKey: string,
  walletRdns?: string,
): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(WALLET_CONNECTOR_STORAGE_KEYS.KEY, walletKey);
    if (walletRdns) {
      localStorage.setItem(WALLET_CONNECTOR_STORAGE_KEYS.RDNS, walletRdns);
    } else {
      localStorage.removeItem(WALLET_CONNECTOR_STORAGE_KEYS.RDNS);
    }
  } catch (error) {
    console.warn('Failed to persist wallet connector identity:', error);
  }
};

export const clearConnectorIdentity = (): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(WALLET_CONNECTOR_STORAGE_KEYS.KEY);
    localStorage.removeItem(WALLET_CONNECTOR_STORAGE_KEYS.RDNS);
  } catch (error) {
    console.warn('Failed to clear wallet connector identity:', error);
  }
};

/**
 * Adapt a v4 ConnectedAPI into the legacy DAppConnectorWalletAPI shape the UI
 * still expects (`state()`). Transaction methods remain unimplemented here —
 * lunarswap-ui currently only needs address/state for connect + account panel.
 */
const adaptV4ConnectedToLegacyWallet = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  connected: any,
): DAppConnectorWalletAPI => {
  const wallet = {
    state: async (): Promise<DAppConnectorWalletState> => {
      const addresses = await connected.getShieldedAddresses();
      return {
        address: addresses.shieldedAddress,
        coinPublicKey: addresses.shieldedCoinPublicKey,
        encryptionPublicKey: addresses.shieldedEncryptionPublicKey,
        addressLegacy: addresses.shieldedAddress,
        coinPublicKeyLegacy: addresses.shieldedCoinPublicKey,
        encryptionPublicKeyLegacy: addresses.shieldedEncryptionPublicKey,
      };
    },
  };
  return wallet as DAppConnectorWalletAPI;
};

const mapConfigurationToServiceUriConfig = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config: any,
): ServiceUriConfig => {
  return {
    indexerUri: config?.indexerUri ?? '',
    indexerWsUri: config?.indexerWsUri ?? '',
    proverServerUri: config?.proverServerUri ?? '',
    substrateNodeUri: config?.substrateNodeUri ?? '',
  } as ServiceUriConfig;
};

const connectViaV4 = async (
  provider: MidnightProviderInfo,
  options: Required<
    Pick<
      WalletConnectionOptions,
      'enableTimeout' | 'stateTimeout' | 'serviceUriTimeout' | 'networkId'
    >
  >,
): Promise<WalletConnectionResult> => {
  const { enableTimeout, stateTimeout, serviceUriTimeout, networkId } = options;

  const connected = await withTimeout(
    provider.api.connect(networkId),
    enableTimeout,
    'Timeout connecting wallet',
  );

  const connectionStatus = (await withTimeout(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (connected as any).getConnectionStatus(),
    stateTimeout,
    'Timeout getting connection status',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  )) as any;

  if (!connectionStatus || connectionStatus.status !== 'connected') {
    throw new Error('Wallet connection was not established');
  }

  const configuration = await withTimeout(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (connected as any).getConfiguration(),
    serviceUriTimeout,
    'Timeout getting wallet configuration',
  );

  const wallet = adaptV4ConnectedToLegacyWallet(connected);
  const state = (await withTimeout(
    wallet.state(),
    stateTimeout,
    'Timeout getting wallet state',
  )) as DAppConnectorWalletState;

  if (!state?.address) {
    throw new Error('Could not get wallet address');
  }

  return {
    wallet,
    state,
    serviceUriConfig: mapConfigurationToServiceUriConfig(configuration),
    walletKey: provider.key,
    walletRdns: provider.rdns,
  };
};

const connectViaV3 = async (
  provider: MidnightProviderInfo,
  options: {
    checkExisting: boolean;
    enableTimeout: number;
    stateTimeout: number;
    isEnabledTimeout: number;
    serviceUriTimeout: number;
  },
): Promise<WalletConnectionResult> => {
  const {
    checkExisting,
    enableTimeout,
    stateTimeout,
    isEnabledTimeout,
    serviceUriTimeout,
  } = options;
  const connector = provider.api;

  if (checkExisting) {
    try {
      const isEnabled = await withTimeout(
        connector.isEnabled(),
        isEnabledTimeout,
        'Timeout checking if wallet is enabled',
      );

      if (isEnabled) {
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
            walletKey: provider.key,
            walletRdns: provider.rdns,
          };
        }
      }
    } catch (error) {
      console.warn('Failed to check existing wallet connection:', error);
    }
  }

  const wallet: DAppConnectorWalletAPI = (await withTimeout(
    connector.enable(),
    enableTimeout,
    'Timeout enabling wallet',
  )) as DAppConnectorWalletAPI;

  const state: DAppConnectorWalletState = (await withTimeout(
    wallet.state(),
    stateTimeout,
    'Timeout getting wallet state',
  )) as DAppConnectorWalletState;

  const serviceUriConfig: ServiceUriConfig = (await withTimeout(
    connector.serviceUriConfig(),
    serviceUriTimeout,
    'Timeout getting service URI config',
  )) as ServiceUriConfig;

  if (!state?.address) {
    throw new Error('Could not get wallet address');
  }

  return {
    wallet,
    state,
    serviceUriConfig,
    walletKey: provider.key,
    walletRdns: provider.rdns,
  };
};

/**
 * Connect to a Midnight wallet with proper error handling and timeouts.
 * Supports v4 InitialAPI (`connect` / `getConnectionStatus` / `getConfiguration`)
 * and legacy v3 connectors (`isEnabled` / `enable` / `serviceUriConfig`).
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
    networkId = 'preprod',
  } = options;

  const stored = readStoredConnectorIdentity();
  const walletKey = options.walletKey ?? stored.walletKey;
  const walletRdns = options.walletRdns ?? stored.walletRdns;

  const provider = resolveMidnightConnector({ walletKey, walletRdns });
  if (!provider) {
    throw new Error(
      'Midnight wallet not found. Install Lace (or another Midnight wallet), refresh, and ensure it injects under window.midnight.',
    );
  }

  let result: WalletConnectionResult;
  if (provider.apiKind === 'v4') {
    result = await connectViaV4(provider, {
      enableTimeout,
      stateTimeout,
      serviceUriTimeout,
      networkId,
    });
  } else {
    result = await connectViaV3(provider, {
      checkExisting,
      enableTimeout,
      stateTimeout,
      isEnabledTimeout,
      serviceUriTimeout,
    });
  }

  persistConnectorIdentity(result.walletKey, result.walletRdns);
  return result;
};

/**
 * Disconnect wallet and clear all stored data
 */
export const disconnectWallet = () => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('wallet_connection_status');
      localStorage.removeItem('wallet_state');
      localStorage.removeItem('wallet_address');
      clearConnectorIdentity();
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
    }
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
