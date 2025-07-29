import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from 'react';
import type { Logger } from 'pino';
import type { Address, CoinPublicKey } from '@midnight-ntwrk/wallet-api';
import type {
  LunarswapCircuitKeys,
  LunarswapPrivateStateId,
  LunarswapProviders,
} from '@midnight-dapps/lunarswap-api';
import type { LunarswapPrivateState } from '@midnight-dapps/lunarswap-v1';
import {
  type BalancedTransaction,
  createBalancedTx,
  type PrivateStateProvider,
  type PublicDataProvider,
  type UnbalancedTransaction,
} from '@midnight-ntwrk/midnight-js-types';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
//import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import {
  type CoinInfo,
  Transaction,
  type TransactionId,
  type EncPublicKey,
} from '@midnight-ntwrk/ledger';
import { Transaction as ZswapTransaction } from '@midnight-ntwrk/zswap';
import {
  getLedgerNetworkId,
  getZswapNetworkId,
} from '@midnight-ntwrk/midnight-js-network-id';
import { useRuntimeConfiguration } from './runtime-configuration';
import type {
  DAppConnectorWalletAPI,
  ServiceUriConfig,
} from '@midnight-ntwrk/dapp-connector-api';
import type {
  ZKConfigProvider,
  WalletProvider,
  MidnightProvider,
  ProofProvider,
} from '@midnight-ntwrk/midnight-js-types';
import { PrivateDataProviderWrapper } from '@/providers/private';
import { connectToWallet } from '@/utils/wallet-utils';
import { ZkConfigProviderWrapper } from '@/providers/zk-config';
import { PublicDataProviderWrapper } from '@/providers/public';
import { noopProofClient } from '@/providers/proof';
import { proofClient } from '@/providers/proof';

function isChromeBrowser(): boolean {
  const userAgent = navigator.userAgent.toLowerCase();
  return (
    userAgent.includes('chrome') &&
    !userAgent.includes('edge') &&
    !userAgent.includes('opr')
  );
}

interface MidnightWalletState {
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
  proofProvider: ProofProvider<LunarswapCircuitKeys>;
  publicDataProvider: PublicDataProvider;
  walletProvider: WalletProvider;
  midnightProvider: MidnightProvider;
  providers: LunarswapProviders;
  shake: () => void;
  callback: (action: ProviderCallbackAction) => void;
  disconnect: () => void;
}

// Export the interface for external use
export type { MidnightWalletState };

export interface WalletAPI {
  wallet: DAppConnectorWalletAPI;
  coinPublicKey: CoinPublicKey;
  encryptionPublicKey: EncPublicKey;
  uris: ServiceUriConfig;
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
  const [openWallet, setOpenWallet] = React.useState(false);
  const [isRotate, setRotate] = React.useState(false);
  const [snackBarText, setSnackBarText] = useState<string | undefined>(
    undefined,
  );
  const [walletAPI, setWalletAPI] = useState<WalletAPI | undefined>(undefined);
  const [floatingOpen, setFloatingOpen] = React.useState(true);

  // Disconnect function to reset wallet state
  const disconnect = useCallback(() => {
    setAddress(undefined);
    setWalletAPI(undefined);
    setIsConnecting(false);
    setWalletError(undefined);
    setOpenWallet(false);
    setProofServerIsOnline(false);
  }, []);

  const privateStateProvider: PrivateStateProvider<
    typeof LunarswapPrivateStateId,
    LunarswapPrivateState
  > = useMemo(
    () =>
      new PrivateDataProviderWrapper(
        levelPrivateStateProvider({
          privateStateStoreName: 'lunarswap-private-state',
        }),
        logger,
      ),
    [logger],
  );

  const providerCallback = useCallback(
    (action: ProviderCallbackAction): void => {
      if (action === 'proveTxStarted') {
        setSnackBarText('Proving transaction...');
      } else if (action === 'proveTxDone') {
        setSnackBarText(undefined);
      } else if (action === 'balanceTxStarted') {
        setSnackBarText('Signing the transaction with Midnight Lace wallet...');
      } else if (action === 'downloadProverDone') {
        setSnackBarText(undefined);
      } else if (action === 'downloadProverStarted') {
        setSnackBarText('Downloading prover key...');
      } else if (action === 'balanceTxDone') {
        setSnackBarText(undefined);
      } else if (action === 'submitTxStarted') {
        setSnackBarText('Submitting transaction...');
      } else if (action === 'submitTxDone') {
        setSnackBarText(undefined);
      } else if (action === 'watchForTxDataStarted') {
        setSnackBarText(
          'Waiting for transaction finalization on blockchain...',
        );
      } else if (action === 'watchForTxDataDone') {
        setSnackBarText(undefined);
      }
    },
    [],
  );

  const zkConfigProvider = useMemo(
    () =>
      new ZkConfigProviderWrapper<LunarswapCircuitKeys>(
        window.location.origin,
        fetch.bind(window),
        providerCallback,
      ),
    [providerCallback],
  );

  // const publicDataProvider = useMemo(
  //   () =>
  //     new PublicDataProviderWrapper(
  //       indexerPublicDataProvider(config.INDEXER_URI, config.INDEXER_WS_URI),
  //       providerCallback,
  //       logger,
  //     ),
  //   [config.INDEXER_URI, config.INDEXER_WS_URI, providerCallback, logger],
  // );

  const publicDataProvider = useMemo(
    () =>
      new PublicDataProviderWrapper(
        {} as PublicDataProvider, // Use an empty object with a type assertion for the mock
        providerCallback,
        logger,
      ),
    [providerCallback, logger],
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
      return proofClient(walletAPI.uris.proverServerUri, providerCallback);
    }
    return noopProofClient();
  }, [walletAPI, providerCallback]);

  const walletProvider: WalletProvider = useMemo(() => {
    if (walletAPI) {
      return {
        coinPublicKey: walletAPI.coinPublicKey,
        encryptionPublicKey: walletAPI.encryptionPublicKey,
        balanceTx(
          tx: UnbalancedTransaction,
          newCoins: CoinInfo[],
        ): Promise<BalancedTransaction> {
          providerCallback('balanceTxStarted');
          return walletAPI.wallet
            .balanceAndProveTransaction(
              ZswapTransaction.deserialize(
                tx.serialize(getLedgerNetworkId()),
                getZswapNetworkId(),
              ),
              newCoins,
            )
            .then((zswapTx) =>
              Transaction.deserialize(
                zswapTx.serialize(getZswapNetworkId()),
                getLedgerNetworkId(),
              ),
            )
            .then(createBalancedTx)
            .finally(() => {
              providerCallback('balanceTxDone');
            });
        },
      };
    }
    return {
      coinPublicKey: '',
      encryptionPublicKey: '',
      balanceTx(
        tx: UnbalancedTransaction,
        newCoins: CoinInfo[],
      ): Promise<BalancedTransaction> {
        return Promise.reject(new Error('readonly'));
      },
    };
  }, [walletAPI, providerCallback]);

  const midnightProvider: MidnightProvider = useMemo(() => {
    if (walletAPI) {
      return {
        submitTx(tx: BalancedTransaction): Promise<TransactionId> {
          providerCallback('submitTxStarted');
          return walletAPI.wallet.submitTransaction(tx).finally(() => {
            providerCallback('submitTxDone');
          });
        },
      };
    }
    return {
      submitTx(tx: BalancedTransaction): Promise<TransactionId> {
        return Promise.reject(new Error('readonly'));
      },
    };
  }, [walletAPI, providerCallback]);

  const [walletState, setWalletState] = React.useState<MidnightWalletState>({
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
  });

  async function checkProofServerStatus(
    proverServerUri: string,
  ): Promise<void> {
    try {
      const response = await fetch(proverServerUri);
      if (!response.ok) {
        setProofServerIsOnline(false);
      }
      const text = await response.text();
      setProofServerIsOnline(text.includes("We're alive 🎉!"));
    } catch (error) {
      setProofServerIsOnline(false);
    }
  }

  async function connect(manual: boolean): Promise<void> {
    setIsConnecting(true);
    let walletResult: unknown;
    try {
      walletResult = await connectToWallet();
    } catch (e) {
      const walletError = getErrorType(e as Error);
      setWalletError(walletError);
      setIsConnecting(false);
    }
    if (!walletResult) {
      setIsConnecting(false);
      if (manual) setOpenWallet(true);
      return;
    }
    await checkProofServerStatus(
    // @ts-expect-error: walletResult type depends on connectToWallet implementation
      walletResult.uris?.proverServerUri ??
    // @ts-expect-error: walletResult type depends on connectToWallet implementation
        walletResult.serviceUriConfig?.proverServerUri,
    );
    try {
      // @ts-expect-error: walletResult type depends on connectToWallet implementation
      const reqState = await walletResult.wallet.state();
      setAddress(reqState.address);
      setWalletAPI({
        // @ts-expect-error: walletResult type depends on connectToWallet implementation
        wallet: walletResult.wallet,
        coinPublicKey: reqState.coinPublicKey,
        encryptionPublicKey: reqState.encryptionPublicKey,
        // @ts-expect-error: walletResult type depends on connectToWallet implementation
        uris: walletResult.uris ?? walletResult.serviceUriConfig,
      });
    } catch (e) {
      setWalletError(MidnightWalletErrorType.TIMEOUT_API_RESPONSE);
    }
    setIsConnecting(false);
  }

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

  const connectMemo = useCallback(connect, []);

  useEffect(() => {
    if (!walletState.isConnected && !isConnecting && !walletError) {
      void connectMemo(false); // auto connect
    }
  }, [walletState.isConnected, isConnecting, walletError, connectMemo]);

  return (
    <MidnightWalletContext.Provider value={walletState}>
      {children}
    </MidnightWalletContext.Provider>
  );
};
