import type {
  Configuration,
  WalletConnectedAPI,
} from '@midnight-ntwrk/dapp-connector-api';
import {
  type CoinPublicKey,
  type EncPublicKey,
  type FinalizedTransaction,
  Transaction,
  type TransactionId,
} from '@midnight-ntwrk/ledger-v7';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import type {
  MidnightProvider,
  PrivateStateProvider,
  ProofProvider,
  PublicDataProvider,
  UnboundTransaction,
  WalletProvider,
  ZKConfigProvider,
} from '@midnight-ntwrk/midnight-js-types';
import type { Address } from '@midnight-ntwrk/wallet-api';
import type { LunarswapPrivateState } from '@openzeppelin/midnight-apps-contracts/dist/lunarswap/witnesses/Lunarswap';
import type {
  LunarswapCircuitKeys,
  LunarswapPrivateStateId,
  LunarswapProviders,
} from '@openzeppelin/midnight-apps-lunarswap-api';
import { Buffer } from 'buffer';
import type { Logger } from 'pino';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { PrivateDataProviderWrapper } from '@/providers/private';
import { noopProofClient, proofClient } from '@/providers/proof';
import { PublicDataProviderWrapper } from '@/providers/public';
import { ZkConfigProviderWrapper } from '@/providers/zk-config';
import { connectToWallet } from '@/utils/wallet-utils';
import { useRuntimeConfiguration } from './runtime-configuration';

export interface MidnightWalletState {
  isConnected: boolean;
  isConnecting: boolean;
  proofServerIsOnline: boolean;
  address?: Address;
  walletAPI?: WalletAPI;
  privateStateProvider: PrivateStateProvider<
    typeof LunarswapPrivateStateId,
    LunarswapPrivateState
  >;
  zkConfigProvider: ZKConfigProvider<LunarswapCircuitKeys>;
  proofProvider: ProofProvider;
  publicDataProvider: PublicDataProvider;
  walletProvider: WalletProvider;
  midnightProvider: MidnightProvider;
  providers: LunarswapProviders;
  shake: () => void;
  callback: (action: ProviderCallbackAction) => void;
  disconnect: () => void;
  reconnect: () => void;
  connect: (manual: boolean) => Promise<void>;
  walletError?: MidnightWalletErrorType;
  snackBarText?: string;
}

export interface WalletAPI {
  address: Address;
  wallet: WalletConnectedAPI;
  coinPublicKey: CoinPublicKey;
  encryptionPublicKey: EncPublicKey;
  configuration: Configuration;
}

export const getErrorType = (error: Error): MidnightWalletErrorType => {
  if (error.message.includes('Could not find Midnight Lace wallet')) {
    return MidnightWalletErrorType.WALLET_NOT_FOUND;
  }
  if (error.message.includes('Incompatible version of Midnight Lace wallet')) {
    return MidnightWalletErrorType.INCOMPATIBLE_API_VERSION;
  }
  if (error.message.includes('Wallet connector API has failed to respond')) {
    return MidnightWalletErrorType.TIMEOUT_API_RESPONSE;
  }
  if (error.message.includes('Could not find wallet connector API')) {
    return MidnightWalletErrorType.TIMEOUT_FINDING_API;
  }
  if (error.message.includes('Unable to enable connector API')) {
    return MidnightWalletErrorType.ENABLE_API_FAILED;
  }
  if (error.message.includes('Application is not authorized')) {
    return MidnightWalletErrorType.UNAUTHORIZED;
  }
  return MidnightWalletErrorType.UNKNOWN_ERROR;
};
const MidnightWalletContext = createContext<MidnightWalletState | null>(null);

export const useMidnightWallet = (): MidnightWalletState => {
  const walletState = useContext(MidnightWalletContext);
  if (!walletState) {
    throw new Error('MidnightWallet not loaded');
  }
  return walletState;
};

export { MidnightWalletContext as WalletContext };

interface MidnightWalletProviderProps {
  children: React.ReactNode;
  logger: Logger;
}

export enum MidnightWalletErrorType {
  WALLET_NOT_FOUND = 'WALLET_NOT_FOUND',
  INCOMPATIBLE_API_VERSION = 'INCOMPATIBLE_API_VERSION',
  TIMEOUT_FINDING_API = 'TIMEOUT_FINDING_API',
  TIMEOUT_API_RESPONSE = 'TIMEOUT_API_RESPONSE',
  ENABLE_API_FAILED = 'ENABLE_API_FAILED',
  UNAUTHORIZED = 'UNAUTHORIZED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export type ProviderCallbackAction =
  | 'downloadProverStarted'
  | 'downloadProverDone'
  | 'proveTxStarted'
  | 'proveTxDone'
  | 'balanceTxStarted'
  | 'balanceTxDone'
  | 'submitTxStarted'
  | 'submitTxDone'
  | 'watchForTxDataStarted'
  | 'watchForTxDataDone';

export const MidnightWalletProvider: React.FC<MidnightWalletProviderProps> = ({
  logger,
  children,
}) => {
  const [isConnecting, setIsConnecting] = React.useState<boolean>(false);
  const [walletError, setWalletError] = React.useState<
    MidnightWalletErrorType | undefined
  >(undefined);
  const [address, setAddress] = React.useState<Address | undefined>(undefined);
  const [proofServerIsOnline, setProofServerIsOnline] =
    React.useState<boolean>(false);
  const config = useRuntimeConfiguration();
  const [_openWallet, setOpenWallet] = React.useState(false);
  const [_isRotate, setRotate] = React.useState(false);
  const [snackBarText, setSnackBarText] = useState<string | undefined>(
    undefined,
  );
  const [walletAPI, setWalletAPI] = useState<WalletAPI | undefined>(undefined);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [lastReconnectTime, setLastReconnectTime] = useState(0);
  const [isReconnecting, setIsReconnecting] = useState(false);

  // Disconnect function to reset wallet state
  const disconnect = useCallback(() => {
    setAddress(undefined);
    setWalletAPI(undefined);
    setIsConnecting(false);
    setWalletError(undefined);
    setOpenWallet(false);
    setProofServerIsOnline(false);
    setReconnectAttempts(0);
    setIsReconnecting(false);
  }, []);

  const checkProofServerStatus = useCallback(
    async (proverServerUri: string): Promise<void> => {
      try {
        const response = await fetch(proverServerUri);
        if (!response.ok) {
          setProofServerIsOnline(false);
        }
        const text = await response.text();
        setProofServerIsOnline(text.includes("We're alive 🎉!"));
      } catch (_error) {
        setProofServerIsOnline(false);
      }
    },
    [],
  );

  // Enhanced connect function with better error handling
  const connect = useCallback(
    async (manual: boolean): Promise<void> => {
      setIsConnecting(true);
      setWalletError(undefined);

      let walletResult:
        | { wallet: WalletConnectedAPI; configuration: Configuration }
        | undefined;

      try {
        walletResult = await connectToWallet(logger, {
          networkId: config?.NETWORK_ID ?? 'testnet',
        });
      } catch (e) {
        const walletError = getErrorType(e as Error);
        setWalletError(walletError);
        setIsConnecting(false);
        return;
      }

      if (!walletResult) {
        setIsConnecting(false);
        if (manual) setOpenWallet(true);
        return;
      }

      await checkProofServerStatus(
        walletResult.configuration.proverServerUri || 'http://localhost:6300',
      );

      try {
        const addressInfo = await walletResult.wallet.getShieldedAddresses();

        setAddress(addressInfo.shieldedAddress);
        setWalletAPI({
          address: addressInfo.shieldedAddress,
          wallet: walletResult.wallet,
          coinPublicKey: addressInfo.shieldedCoinPublicKey,
          encryptionPublicKey: addressInfo.shieldedEncryptionPublicKey,
          configuration: walletResult.configuration,
        });
        // Reset reconnect attempts on successful connection
        setReconnectAttempts(0);
      } catch (_e) {
        setWalletError(MidnightWalletErrorType.TIMEOUT_API_RESPONSE);
      }

      setIsConnecting(false);
    },
    [logger, config?.NETWORK_ID, checkProofServerStatus],
  );

  // Reconnection function with exponential backoff
  const attemptReconnect = useCallback(async () => {
    if (isReconnecting || reconnectAttempts >= 5) {
      return;
    }

    const now = Date.now();
    const timeSinceLastAttempt = now - lastReconnectTime;
    const backoffDelay = Math.min(1000 * 2 ** reconnectAttempts, 30000); // Max 30 seconds

    if (timeSinceLastAttempt < backoffDelay) {
      return;
    }

    setIsReconnecting(true);
    setLastReconnectTime(now);
    setReconnectAttempts((prev) => prev + 1);

    try {
      await connect(false);
      // If successful, reset reconnect attempts
      setReconnectAttempts(0);
      setWalletError(undefined);
    } catch (error) {
      console.warn(
        `Reconnection attempt ${reconnectAttempts + 1} failed:`,
        error,
      );
      if (reconnectAttempts >= 4) {
        setWalletError(MidnightWalletErrorType.TIMEOUT_API_RESPONSE);
      }
    } finally {
      setIsReconnecting(false);
    }
  }, [isReconnecting, reconnectAttempts, lastReconnectTime, connect]);

  // Manual reconnect function for user-initiated reconnection
  const manualReconnect = useCallback(async () => {
    setWalletError(undefined);
    setReconnectAttempts(0);
    await connect(true);
  }, [connect]);

  const providerCallback = useCallback(
    (action: ProviderCallbackAction): void => {
      if (action === 'proveTxStarted') {
        setSnackBarText('Proving transaction...');
      } else if (action === 'proveTxDone') {
        setSnackBarText('Transaction proved');
      } else if (action === 'balanceTxStarted') {
        setSnackBarText('Signing the transaction with Midnight Lace wallet...');
      } else if (action === 'downloadProverDone') {
        setSnackBarText('Prover key downloaded');
      } else if (action === 'downloadProverStarted') {
        setSnackBarText('Downloading prover key...');
      } else if (action === 'balanceTxDone') {
        setSnackBarText('Transaction signed');
      } else if (action === 'submitTxStarted') {
        setSnackBarText('Submitting transaction...');
      } else if (action === 'submitTxDone') {
        setSnackBarText('Transaction submitted');
      } else if (action === 'watchForTxDataStarted') {
        setSnackBarText(
          'Waiting for transaction finalization on blockchain...',
        );
      } else if (action === 'watchForTxDataDone') {
        setSnackBarText('Transaction finalized');
      }
    },
    [],
  );

  const zkConfigProvider = useMemo(
    () =>
      new ZkConfigProviderWrapper<LunarswapCircuitKeys>(
        window.location.origin,
        providerCallback,
        fetch.bind(window),
      ),
    [providerCallback],
  );

  const publicDataProvider = useMemo(
    () =>
      new PublicDataProviderWrapper(
        indexerPublicDataProvider(config.INDEXER_URI, config.INDEXER_WS_URI),
        providerCallback,
        logger,
      ),
    [providerCallback, config.INDEXER_URI, config.INDEXER_WS_URI, logger],
  );

  const shake = useCallback((): void => {
    setRotate(true);
    setSnackBarText('Please connect to your Midnight Lace wallet');
    setTimeout(() => {
      setRotate(false);
      setSnackBarText(undefined);
    }, 3000);
  }, []);

  const proofProvider = useMemo(() => {
    if (walletAPI) {
      return proofClient(
        walletAPI.configuration.proverServerUri || 'http://localhost:6300',
        zkConfigProvider,
        providerCallback,
      );
    }
    return noopProofClient();
  }, [walletAPI, zkConfigProvider, providerCallback]);

  const walletProvider: WalletProvider = useMemo(() => {
    if (walletAPI) {
      return {
        balanceTx(
          tx: UnboundTransaction,
          _ttl?: Date,
        ): Promise<FinalizedTransaction> {
          providerCallback('balanceTxStarted');
          return walletAPI.wallet
            .balanceUnsealedTransaction(
              Buffer.from(tx.serialize()).toString('hex'),
            )
            .then((result) => {
              return Transaction.deserialize(
                'signature',
                'proof',
                'binding',
                Buffer.from(result.tx, 'hex'),
              ) as FinalizedTransaction;
            })
            .finally(() => {
              providerCallback('balanceTxDone');
            });
        },
        getCoinPublicKey(): CoinPublicKey {
          return walletAPI.coinPublicKey;
        },
        getEncryptionPublicKey(): EncPublicKey {
          return walletAPI.encryptionPublicKey;
        },
      };
    }
    return {
      balanceTx(
        _tx: UnboundTransaction,
        _ttl?: Date,
      ): Promise<FinalizedTransaction> {
        return Promise.reject(new Error('Wallet not connected'));
      },
      getCoinPublicKey(): CoinPublicKey {
        throw new Error('Wallet not connected');
      },
      getEncryptionPublicKey(): EncPublicKey {
        throw new Error('Wallet not connected');
      },
    };
  }, [walletAPI, providerCallback]);

  const privateStateProvider: PrivateStateProvider<
    typeof LunarswapPrivateStateId,
    LunarswapPrivateState
  > = useMemo(() => {
    // levelPrivateStateProvider requires either walletProvider or privateStoragePasswordProvider
    // Use walletProvider when wallet is connected, otherwise use a password provider
    const providerConfig: {
      privateStateStoreName: string;
      walletProvider?: WalletProvider;
      privateStoragePasswordProvider?: () => Promise<string>;
    } = {
      privateStateStoreName: 'lunarswap-private-state',
    };

    // Only use walletProvider if wallet is connected (walletAPI exists)
    if (walletAPI) {
      providerConfig.walletProvider = walletProvider;
    } else {
      // Use password provider when wallet is not connected
      // This allows the app to initialize even without a connected wallet
      providerConfig.privateStoragePasswordProvider = async () => {
        // Use a consistent password based on localStorage or a default
        const storedPassword = localStorage.getItem('lunarswap-storage-password');
        if (storedPassword) {
          return storedPassword;
        }
        const defaultPassword = 'lunarswap-default-password';
        localStorage.setItem('lunarswap-storage-password', defaultPassword);
        return defaultPassword;
      };
    }

    return new PrivateDataProviderWrapper(
      levelPrivateStateProvider(providerConfig),
      logger,
    );
  }, [walletAPI, walletProvider, logger]);

  const midnightProvider: MidnightProvider = useMemo(() => {
    if (walletAPI) {
      return {
        async submitTx(tx: FinalizedTransaction): Promise<TransactionId> {
          providerCallback('submitTxStarted');
          await walletAPI.wallet.submitTransaction(
            Buffer.from(tx.serialize()).toString('hex'),
          );
          providerCallback('submitTxDone');
          // Generate transaction ID from the transaction serialization
          const serialized = tx.serialize();
          return Buffer.from(serialized.slice(0, 32)).toString(
            'hex',
          ) as TransactionId;
        },
      };
    }
    return {
      submitTx(_tx: FinalizedTransaction): Promise<TransactionId> {
        return Promise.reject(new Error('readonly'));
      },
    };
  }, [walletAPI, providerCallback]);

  // Add manual reconnect to wallet state
  const [walletState, setWalletState] = useState<MidnightWalletState>({
    isConnected: false,
    isConnecting: false,
    proofServerIsOnline: false,
    address: undefined,
    walletAPI,
    privateStateProvider,
    zkConfigProvider,
    proofProvider,
    publicDataProvider,
    walletProvider,
    midnightProvider,
    shake,
    providers: {
      privateStateProvider,
      publicDataProvider,
      zkConfigProvider,
      proofProvider,
      walletProvider,
      midnightProvider,
    },
    callback: providerCallback,
    disconnect,
    reconnect: manualReconnect,
    connect,
    walletError,
    snackBarText,
  });

  useEffect(() => {
    setWalletState((state) => ({
      ...state,
      walletAPI,
      privateStateProvider,
      zkConfigProvider,
      proofProvider,
      publicDataProvider,
      walletProvider,
      midnightProvider,
      providers: {
        privateStateProvider,
        publicDataProvider,
        zkConfigProvider,
        proofProvider,
        walletProvider,
        midnightProvider,
      },
    }));
  }, [
    walletAPI,
    privateStateProvider,
    zkConfigProvider,
    proofProvider,
    publicDataProvider,
    walletProvider,
    midnightProvider,
  ]);

  useEffect(() => {
    setWalletState((state) => ({
      ...state,
      isConnected: !!address,
      isConnecting,
      proofServerIsOnline,
      address,
      shake,
    }));
  }, [address, isConnecting, proofServerIsOnline, shake]);

  // Update wallet state when snackBarText changes
  useEffect(() => {
    setWalletState((state) => ({
      ...state,
      snackBarText,
    }));
  }, [snackBarText]);

  //const connectMemo = useCallback(connect, []);

  // Check if wallet is available before auto-connecting
  const isWalletAvailable = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return !!(
      window.midnight?.mnLace || typeof window.midnight !== 'undefined'
    );
  }, []);

  useEffect(() => {
    // Only auto-connect if wallet is available and we're not already connected/connecting
    if (
      isWalletAvailable &&
      !walletState.isConnected &&
      !isConnecting &&
      !walletError
    ) {
      void connect(false); // auto connect
    }
  }, [
    walletState.isConnected,
    isConnecting,
    isWalletAvailable,
    connect,
    walletError,
  ]);

  // Auto-reconnection for stale connections
  useEffect(() => {
    if (
      walletError === MidnightWalletErrorType.TIMEOUT_API_RESPONSE ||
      walletError === MidnightWalletErrorType.TIMEOUT_FINDING_API
    ) {
      // Schedule automatic reconnection for timeout errors
      const timeoutId = setTimeout(() => {
        if (!isConnecting && !isReconnecting) {
          void attemptReconnect();
        }
      }, 3000);

      return () => clearTimeout(timeoutId);
    }
  }, [walletError, isConnecting, isReconnecting, attemptReconnect]);

  // Periodic connection health check
  useEffect(() => {
    if (!walletState.isConnected || !walletAPI) {
      return;
    }

    const healthCheckInterval = setInterval(async () => {
      try {
        // Test if wallet is still responsive
        await walletAPI.wallet.getShieldedAddresses();
      } catch (error) {
        logger.warn(
          { error },
          `Wallet connection health check failed: ${error instanceof Error ? error.message : String(error)}`,
        );
        // If wallet is not responsive, trigger reconnection
        setWalletError(MidnightWalletErrorType.TIMEOUT_API_RESPONSE);
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(healthCheckInterval);
  }, [walletState.isConnected, walletAPI, logger]);

  // Expose wallet state for debugging
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).debugWalletState = () => {
        return walletState;
      };
    }
  }, [walletState]);

  return (
    <MidnightWalletContext.Provider value={walletState}>
      {children}
    </MidnightWalletContext.Provider>
  );
};
