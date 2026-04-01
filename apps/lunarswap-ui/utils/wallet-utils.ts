import type {
  Configuration,
  InitialAPI,
  WalletConnectedAPI,
} from '@midnight-ntwrk/dapp-connector-api';

const SUPPORTED_WALLET_RDNS = ['io.lace.wallet', 'io.shielded.gsd'];
const SUPPORTED_WALLET_NAMES = ['lace', 'gsd'];

/**
 * Get all supported Midnight providers from window.midnight using UUID-based discovery.
 * In API 4.x, wallets inject under a UUID key. Supports Lace and GSD wallets.
 */
export function getSupportedMidnightProviders(): InitialAPI[] {
  if (
    typeof window === 'undefined' ||
    !window.midnight ||
    typeof window.midnight !== 'object'
  ) {
    return [];
  }
  const providers = Object.values(window.midnight) as InitialAPI[];
  return providers.filter(
    (p) =>
      p &&
      typeof p === 'object' &&
      (SUPPORTED_WALLET_RDNS.includes(p.rdns ?? '') ||
        SUPPORTED_WALLET_NAMES.includes(p.name?.toLowerCase() ?? '')),
  );
}

/**
 * Get the first supported Midnight provider. Used for availability checks.
 */
export function getLaceMidnightProvider(): InitialAPI | undefined {
  return getSupportedMidnightProviders()[0];
}

import { pipe as fnPipe } from 'fp-ts/function';
import type { Logger } from 'pino';
import {
  concatMap,
  filter,
  firstValueFrom,
  interval,
  map,
  of,
  take,
  tap,
  throwError,
  timeout,
} from 'rxjs';
import semver from 'semver';

const NETWORK_ID_MISMATCH = 'Network ID mismatch';

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
  wallet: WalletConnectedAPI;
  configuration: Configuration;
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
  rpcUrl: string;
  explorerUrl: string;
  available: boolean;
}

/**
 * Detect the wallet's current network based on service URI config and other indicators
 * Note: Network detection from wallet state is not currently supported
 */
export const detectWalletNetwork = async (
  wallet: WalletConnectedAPI | null,
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

export interface ConnectToWalletOptions {
  networkId?: string;
  rdns?: string;
}

/**
 * Connect to the Midnight Lace wallet with proper error handling and timeouts
 */
export const connectToWallet = (
  logger: Logger,
  options: ConnectToWalletOptions = {},
): Promise<{ wallet: WalletConnectedAPI; configuration: Configuration }> => {
  const COMPATIBLE_CONNECTOR_API_VERSION = '4.x';
  const networkId = options.networkId ?? 'preprod';
  const targetRdns = options.rdns;

  return firstValueFrom(
    fnPipe(
      interval(100),
      map(() => {
        const providers = getSupportedMidnightProviders();
        return targetRdns
          ? providers.find((p) => p.rdns === targetRdns)
          : providers[0];
      }),
      tap((connectorAPI) => {
        logger.info(
          { rdns: connectorAPI?.rdns, name: connectorAPI?.name, apiVersion: connectorAPI?.apiVersion },
          'Check for wallet connector API',
        );
      }),
      filter((connectorAPI): connectorAPI is InitialAPI => !!connectorAPI),
      concatMap((connectorAPI) =>
        semver.satisfies(
          connectorAPI.apiVersion,
          COMPATIBLE_CONNECTOR_API_VERSION,
        )
          ? of(connectorAPI)
          : throwError(() => {
              logger.error(
                {
                  expected: COMPATIBLE_CONNECTOR_API_VERSION,
                  actual: connectorAPI.apiVersion,
                },
                'Incompatible version of wallet connector API',
              );

              return new Error(
                `Incompatible version of Midnight wallet found. Require '${COMPATIBLE_CONNECTOR_API_VERSION}', got '${connectorAPI.apiVersion}'.`,
              );
            }),
      ),
      tap((connectorAPI) => {
        logger.info(
          connectorAPI,
          'Compatible wallet connector API found. Connecting.',
        );
      }),
      take(1),
      timeout({
        first: 5_000,
        with: () =>
          throwError(() => {
            logger.error({}, 'Could not find wallet connector API');

            return new Error(
              'Could not find a Midnight wallet. Extension installed?',
            );
          }),
      }),
      concatMap(async (connectorAPI) => {
        // InitialAPI is ready, proceed to connection
        logger.info('Wallet connector API found, proceeding to connect');
        return connectorAPI;
      }),
      timeout({
        first: 10_000,
        with: () =>
          throwError(() => {
            logger.error({}, 'Wallet connector API has failed to respond');
            return new Error(
              'Midnight wallet has failed to respond. Extension enabled?',
            );
          }),
      }),
      concatMap(async (connectorAPI) => {
        try {
          const connectedAPI = await connectorAPI.connect(networkId);
          return {
            walletConnectorAPI: connectedAPI,
            connectorAPI,
          };
        } catch (e) {
          const reason = e instanceof Error ? e.message : String(e);
          console.error('[wallet] connect() failed', {
            walletRdns: connectorAPI.rdns,
            walletName: connectorAPI.name,
            requestedNetworkId: networkId,
            reason,
            rawError: e,
          });
          throw new Error(`Application is not authorized: ${reason}`);
        }
      }),
      concatMap(async ({ walletConnectorAPI }) => {
        const configuration = await walletConnectorAPI.getConfiguration();

        logger.info(
          'Connected to wallet connector API and retrieved service configuration',
        );

        return { wallet: walletConnectorAPI, configuration };
      }),
    ),
  );
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
      localStorage.removeItem('lace-wallet-connected');
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

export function getErrorType(error: Error): string {
  if (error.message.includes('Midnight wallet not found') || error.message.includes('Could not find a Midnight wallet'))
    return 'WALLET_NOT_FOUND';
  if (error.message.includes('Incompatible version of Midnight wallet'))
    return 'INCOMPATIBLE_API_VERSION';
  if (error.message.includes('Wallet connector API has failed to respond'))
    return 'TIMEOUT_API_RESPONSE';
  if (error.message.includes('Could not find wallet connector API'))
    return 'TIMEOUT_FINDING_API';
  if (error.message.includes('Unable to enable connector API'))
    return 'ENABLE_API_FAILED';
  if (error.message.startsWith('Application is not authorized'))
    return 'UNAUTHORIZED';
  if (error.message.includes('Timeout')) return 'TIMEOUT';
  return 'UNKNOWN_ERROR';
}
