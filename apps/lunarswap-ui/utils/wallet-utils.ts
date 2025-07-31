import type {
  DAppConnectorAPI,
  DAppConnectorWalletAPI,
  DAppConnectorWalletState,
  ServiceUriConfig,
} from '@midnight-ntwrk/dapp-connector-api';
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
import { pipe as fnPipe } from 'fp-ts/function';
import semver from 'semver';

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

  console.warn(
    'Network detection from wallet state is not currently supported. Please set network manually.',
  );
  return null;
};

/**
 * Connect to the Midnight Lace wallet with proper error handling and timeouts
 */
export const connectToWallet = (
  logger: Logger,
): Promise<{ wallet: DAppConnectorWalletAPI; uris: ServiceUriConfig }> => {
  const COMPATIBLE_CONNECTOR_API_VERSION = '1.x';

  return firstValueFrom(
    fnPipe(
      interval(100),
      map(() => window.midnight?.mnLace),
      tap((connectorAPI) => {
        logger.info(connectorAPI, 'Check for wallet connector API');
      }),
      filter(
        (connectorAPI): connectorAPI is DAppConnectorAPI => !!connectorAPI,
      ),
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
                `Incompatible version of Midnight Lace wallet found. Require '${COMPATIBLE_CONNECTOR_API_VERSION}', got '${connectorAPI.apiVersion}'.`,
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
        first: 1_000,
        with: () =>
          throwError(() => {
            logger.error('Could not find wallet connector API');

            return new Error(
              'Could not find Midnight Lace wallet. Extension installed?',
            );
          }),
      }),
      concatMap(async (connectorAPI) => {
        const isEnabled = await connectorAPI.isEnabled();

        logger.info(isEnabled, 'Wallet connector API enabled status');

        return connectorAPI;
      }),
      timeout({
        first: 5_000,
        with: () =>
          throwError(() => {
            logger.error('Wallet connector API has failed to respond');
            return new Error(
              'Midnight Lace wallet has failed to respond. Extension enabled?',
            );
          }),
      }),
      concatMap(async (connectorAPI) => {
        try {
          return {
            walletConnectorAPI: await connectorAPI.enable(),
            connectorAPI,
          };
        } catch (e) {
          logger.error('Unable to enable connector API');
          throw new Error('Application is not authorized');
        }
      }),
      concatMap(async ({ walletConnectorAPI, connectorAPI }) => {
        const uris = await connectorAPI.serviceUriConfig();

        logger.info(
          'Connected to wallet connector API and retrieved service configuration',
        );

        return { wallet: walletConnectorAPI, uris };
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
  if (error.message.includes('Midnight Lace wallet not found'))
    return 'WALLET_NOT_FOUND';
  if (error.message.includes('Incompatible version of Midnight Lace wallet'))
    return 'INCOMPATIBLE_API_VERSION';
  if (error.message.includes('Wallet connector API has failed to respond'))
    return 'TIMEOUT_API_RESPONSE';
  if (error.message.includes('Could not find wallet connector API'))
    return 'TIMEOUT_FINDING_API';
  if (error.message.includes('Unable to enable connector API'))
    return 'ENABLE_API_FAILED';
  if (error.message.includes('Application is not authorized'))
    return 'UNAUTHORIZED';
  if (error.message.includes('Timeout')) return 'TIMEOUT';
  return 'UNKNOWN_ERROR';
}
