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
} from '@midnight-ntwrk/ledger-v8';
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
import { ttlOneHour } from '@midnight-ntwrk/midnight-js-utils';
import type { Address } from '@midnight-ntwrk/wallet-api';
import {
  DustAddress,
  UnshieldedAddress,
} from '@midnight-ntwrk/wallet-sdk-address-format';
import type { LunarswapPrivateState } from '@openzeppelin/midnight-apps-contracts';
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
import * as Rx from 'rxjs';
import { PrivateDataProviderWrapper } from '@/providers/private';
import { noopProofClient, proofClient } from '@/providers/proof';
import { PublicDataProviderWrapper } from '@/providers/public';
import { ZkConfigProviderWrapper } from '@/providers/zk-config';
import { connectToWallet, getLaceMidnightProvider } from '@/utils/wallet-utils';
import {
  buildLocalWallet,
  isLocalWalletModeEnabled,
  type LocalWalletHandle,
  setLocalWalletModeEnabled,
} from './local-wallet';
import {
  useActiveNetworkConfig,
  useRuntimeConfiguration,
} from './runtime-configuration';

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
  connect: (manual: boolean, rdns?: string) => Promise<void>;
  /** Bootstrap the in-browser test wallet (genesis seed, local docker only). */
  connectLocal: () => Promise<void>;
  /** True when the test wallet is active instead of Lace. */
  isLocalMode: boolean;
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
  const activeNetwork = useActiveNetworkConfig();
  const [_openWallet, setOpenWallet] = React.useState(false);
  const [_isRotate, setRotate] = React.useState(false);
  const [snackBarText, setSnackBarText] = useState<string | undefined>(
    undefined,
  );
  const [walletAPI, setWalletAPI] = useState<WalletAPI | undefined>(undefined);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [lastReconnectTime, setLastReconnectTime] = useState(0);
  const [isReconnecting, setIsReconnecting] = useState(false);

  // Local-wallet mode: bypass Lace and run wallet-sdk-facade@4 directly in-browser.
  // Toggled by the "Test Wallet" button, `?localWallet=1` query param, or
  // `VITE_USE_LOCAL_WALLET=1` env var. Persists across SPA navigation via
  // localStorage so internal route changes don't drop the flag.
  const [localMode, setLocalMode] = useState<boolean>(() =>
    isLocalWalletModeEnabled(),
  );
  const [localWallet, setLocalWallet] = useState<LocalWalletHandle | undefined>(
    undefined,
  );

  const connectLocal = useCallback(async (): Promise<void> => {
    if (config?.DEFAULT_NETWORK !== 'undeployed') {
      logger.warn(
        'Test wallet is only available on the local (undeployed) network.',
      );
      return;
    }
    setLocalWalletModeEnabled(true);
    setLocalMode(true);
  }, [config?.DEFAULT_NETWORK, logger]);

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
    // Clear local-wallet mode so we don't auto-bootstrap again on refresh.
    setLocalWalletModeEnabled(false);
    setLocalMode(false);
    setLocalWallet(undefined);
  }, []);

  // Local-wallet mode: build the in-browser wallet-sdk-facade@4 once, start it,
  // and populate `address` + a stub `walletAPI` so downstream code keeps working.
  useEffect(() => {
    if (!localMode) return;
    if (config?.DEFAULT_NETWORK !== 'undeployed') {
      logger.warn(
        'Local wallet mode requires DEFAULT_NETWORK="undeployed"; skipping bootstrap.',
      );
      return;
    }
    let cancelled = false;
    let handle: LocalWalletHandle | undefined;
    let stateSub: { unsubscribe(): void } | undefined;
    setIsConnecting(true);
    (async () => {
      try {
        handle = await buildLocalWallet({
          network: activeNetwork,
          walletNetworkId: 'undeployed',
        });
        if (cancelled) {
          await handle.wallet.stop();
          return;
        }
        const [shieldedState, unshieldedState, dustState] = await Promise.all([
          Rx.firstValueFrom(handle.shielded.state),
          Rx.firstValueFrom(handle.unshielded.state),
          Rx.firstValueFrom(handle.dust.state),
        ]);
        if (cancelled) {
          await handle.wallet.stop();
          return;
        }
        const shieldedAddress = shieldedState.address.coinPublicKeyString();
        const coinPublicKey = handle.zswapSecretKeys.coinPublicKey;
        const encryptionPublicKey = handle.zswapSecretKeys.encryptionPublicKey;
        const networkId = activeNetwork.name?.toLowerCase().includes('local')
          ? 'undeployed'
          : 'undeployed';
        const unshieldedAddressStr = (() => {
          try {
            return UnshieldedAddress.codec
              .encode(networkId, unshieldedState.address)
              .toString();
          } catch {
            return String(unshieldedState.address);
          }
        })();
        const dustAddressStr = (() => {
          try {
            return DustAddress.codec
              .encode(networkId, dustState.address)
              .toString();
          } catch {
            return String(dustState.address);
          }
        })();

        // Cache balances live from the facade state observable for the
        // poll-based getters below.
        let latestShieldedBalances = (shieldedState.balances ?? {}) as Record<
          string,
          bigint
        >;
        let latestUnshieldedBalances = (unshieldedState.balances ?? {}) as Record<
          string,
          bigint
        >;
        let latestDustBalance: bigint = (() => {
          try {
            return dustState.balance(new Date());
          } catch {
            return 0n;
          }
        })();
        stateSub = handle.wallet.state().subscribe((s) => {
          latestShieldedBalances = (s.shielded.balances ?? {}) as Record<
            string,
            bigint
          >;
          latestUnshieldedBalances = (s.unshielded.balances ?? {}) as Record<
            string,
            bigint
          >;
          try {
            latestDustBalance = s.dust.balance(new Date());
          } catch {
            // ignore — keep last value
          }
        });

        const stubConnector = {
          getShieldedAddresses: async () => ({
            shieldedAddress: shieldedAddress as Address,
            shieldedCoinPublicKey: coinPublicKey,
            shieldedEncryptionPublicKey: encryptionPublicKey,
          }),
          getShieldedBalances: async () => latestShieldedBalances,
          getUnshieldedAddress: async () => ({
            unshieldedAddress: unshieldedAddressStr,
          }),
          getUnshieldedBalances: async () => latestUnshieldedBalances,
          getDustAddress: async () => ({ dustAddress: dustAddressStr }),
          getDustBalance: async () => ({
            balance: latestDustBalance,
            // No public "cap" surface from facade@4; report balance for now
            cap: latestDustBalance,
          }),
        } as unknown as WalletConnectedAPI;

        setLocalWallet(handle);
        setAddress(shieldedAddress as Address);
        setWalletAPI({
          address: shieldedAddress as Address,
          coinPublicKey,
          encryptionPublicKey,
          wallet: stubConnector,
          configuration: {
            networkId,
            indexerUri: activeNetwork.INDEXER_URI,
            indexerWsUri: activeNetwork.INDEXER_WS_URI,
            substrateNodeUri: activeNetwork.RPC_URL,
            proverServerUri: activeNetwork.PROOF_SERVER_URL,
          } as Configuration,
        });
        setProofServerIsOnline(true);
        setIsConnecting(false);
        logger.info(
          { address: shieldedAddress },
          'Local wallet started against local node',
        );
      } catch (e) {
        if (cancelled) return;
        logger.error({ err: e }, 'Failed to start local wallet');
        setWalletError(MidnightWalletErrorType.UNKNOWN_ERROR);
        setIsConnecting(false);
      }
    })();
    return () => {
      cancelled = true;
      if (stateSub) {
        try {
          stateSub.unsubscribe();
        } catch {
          // ignore
        }
      }
      if (handle) {
        void handle.wallet.stop();
      }
    };
  }, [localMode, config?.DEFAULT_NETWORK, activeNetwork, logger]);

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
    async (manual: boolean, rdns?: string): Promise<void> => {
      setIsConnecting(true);
      setWalletError(undefined);

      let walletResult:
        | { wallet: WalletConnectedAPI; configuration: Configuration }
        | undefined;

      try {
        walletResult = await connectToWallet(logger, {
          networkId: config?.DEFAULT_NETWORK ?? 'preprod',
          rdns,
        });
      } catch (e) {
        const errorType = getErrorType(e as Error);
        setWalletError(errorType);
        setIsConnecting(false);
        if (manual) throw e;
        return;
      }

      if (!walletResult) {
        setIsConnecting(false);
        if (manual) setOpenWallet(true);
        return;
      }

      await checkProofServerStatus(
        walletResult.configuration.proverServerUri ||
          activeNetwork.PROOF_SERVER_URL,
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
      } catch (e) {
        setWalletError(MidnightWalletErrorType.TIMEOUT_API_RESPONSE);
        setIsConnecting(false);
        if (manual) throw e;
        return;
      }

      setIsConnecting(false);
    },
    [
      logger,
      config?.DEFAULT_NETWORK,
      activeNetwork.PROOF_SERVER_URL,
      checkProofServerStatus,
    ],
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
        [`${window.location.origin}/shielded-token`],
      ),
    [providerCallback],
  );

  const publicDataProvider = useMemo(
    () =>
      new PublicDataProviderWrapper(
        indexerPublicDataProvider(
          activeNetwork.INDEXER_URI,
          activeNetwork.INDEXER_WS_URI,
        ),
        providerCallback,
        logger,
      ),
    [
      providerCallback,
      activeNetwork.INDEXER_URI,
      activeNetwork.INDEXER_WS_URI,
      logger,
    ],
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
      const proverServerUri =
        walletAPI.configuration.proverServerUri ||
        activeNetwork.PROOF_SERVER_URL;
      return proofClient(proverServerUri, zkConfigProvider, providerCallback);
    }
    return noopProofClient();
  }, [
    walletAPI,
    zkConfigProvider,
    providerCallback,
    activeNetwork.PROOF_SERVER_URL,
  ]);

  const walletProvider: WalletProvider = useMemo(() => {
    if (localMode && localWallet && walletAPI) {
      return {
        async balanceTx(
          tx: UnboundTransaction,
          ttl: Date = ttlOneHour(),
        ): Promise<FinalizedTransaction> {
          providerCallback('balanceTxStarted');
          try {
            // Snapshot wallet state right before balancing so we can compare
            // requested token types against actually-held UTXO colors when the
            // balancer throws InsufficientFundsError (which carries `tokenType`
            // on the live Error object — click into it in DevTools).
            try {
              const facadeState = await Rx.firstValueFrom(
                localWallet.wallet.state(),
              );
              // Emit at warn level so the snapshots stand out from the Effect
              // runtime's per-second info-level dedupe warnings spamming the
              // Info channel.
              // eslint-disable-next-line no-console
              console.warn('[balanceTx] shielded balances:', {
                ...facadeState.shielded.balances,
              });
              // eslint-disable-next-line no-console
              console.warn('[balanceTx] unshielded balances:', {
                ...facadeState.unshielded.balances,
              });
              // eslint-disable-next-line no-console
              console.warn('[balanceTx] tx bytes:', tx.serialize().byteLength);
            } catch (snapshotErr) {
              // eslint-disable-next-line no-console
              console.warn(
                '[balanceTx] snapshot failed (non-fatal):',
                snapshotErr,
              );
            }
            try {
              const recipe = await localWallet.wallet.balanceUnboundTransaction(
                tx,
                {
                  shieldedSecretKeys: localWallet.zswapSecretKeys,
                  dustSecretKey: localWallet.dustSecretKey,
                },
                { ttl },
              );
              return await localWallet.wallet.finalizeRecipe(recipe);
            } catch (err) {
              // Tree-walk the error so the deeply-nested
              // InsufficientFundsError's `tokenType` field surfaces as plain
              // text. Effect.ts stores its `Cause<E>` on **Symbol-keyed**
              // properties of FiberFailureImpl, so we must use `Reflect.ownKeys`
              // (string + symbol) and recurse over every object value. We also
              // special-case any node tagged `_tag: "Wallet.InsufficientFunds"`
              // and print its tokenType/amount loudly.
              const visited = new WeakSet<object>();
              const queue: Array<{ value: unknown; path: string }> = [
                { value: err, path: 'err' },
              ];
              let nodeIdx = 0;
              while (queue.length > 0 && nodeIdx < 256) {
                const { value, path } = queue.shift() as {
                  value: unknown;
                  path: string;
                };
                if (!value || typeof value !== 'object') continue;
                if (visited.has(value as object)) continue;
                visited.add(value as object);
                nodeIdx++;
                const v = value as Record<string | symbol, unknown>;
                const ctor =
                  (value as { constructor?: { name?: string } }).constructor
                    ?.name ?? typeof value;
                const tagVal = (v as { _tag?: unknown })._tag;
                const tag = typeof tagVal === 'string' ? ` _tag=${tagVal}` : '';

                // Loud match on the wallet-sdk-shielded InsufficientFundsError.
                if (tagVal === 'Wallet.InsufficientFunds') {
                  // eslint-disable-next-line no-console
                  console.error(
                    `[balanceTx] >>> InsufficientFundsError at ${path}: tokenType=${String(
                      v.tokenType,
                    )} amount=${String(v.amount)}`,
                  );
                }

                const ownKeys = Reflect.ownKeys(value as object).filter(
                  (k) => k !== 'stack',
                );
                const fields: Record<string, unknown> = {};
                for (const k of ownKeys) {
                  const label = typeof k === 'symbol' ? `@@${k.toString()}` : k;
                  let fv: unknown;
                  try {
                    fv = (v as Record<string | symbol, unknown>)[k];
                  } catch {
                    fv = '<getter threw>';
                  }
                  fields[label] =
                    typeof fv === 'string' ||
                    typeof fv === 'number' ||
                    typeof fv === 'bigint' ||
                    typeof fv === 'boolean' ||
                    fv == null
                      ? fv
                      : Array.isArray(fv)
                        ? `[Array(${fv.length})]`
                        : (fv as { constructor?: { name?: string } })
                            ?.constructor?.name ?? typeof fv;
                  // Recurse into every object value (string- or symbol-keyed).
                  if (fv && typeof fv === 'object') {
                    if (Array.isArray(fv)) {
                      fv.forEach((item, i) =>
                        queue.push({
                          value: item,
                          path: `${path}.${label}[${i}]`,
                        }),
                      );
                    } else {
                      queue.push({ value: fv, path: `${path}.${label}` });
                    }
                  }
                }
                // eslint-disable-next-line no-console
                console.error(
                  `[balanceTx] ${path} ${ctor}${tag}:`,
                  fields,
                );
              }
              throw err;
            }
          } finally {
            providerCallback('balanceTxDone');
          }
        },
        getCoinPublicKey(): CoinPublicKey {
          return walletAPI.coinPublicKey;
        },
        getEncryptionPublicKey(): EncPublicKey {
          return walletAPI.encryptionPublicKey;
        },
      };
    }
    if (walletAPI) {
      return {
        async balanceTx(
          tx: UnboundTransaction,
          _ttl?: Date,
        ): Promise<FinalizedTransaction> {
          providerCallback('balanceTxStarted');
          const rawBytes = tx.serialize();
          const serialized = Array.from(rawBytes)
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('');
          try {
            const result =
              await walletAPI.wallet.balanceUnsealedTransaction(serialized);
            const cleaned = result.tx.replace(/^0x/, '');
            const matches = cleaned.match(/.{1,2}/g);
            const resultBytes = matches
              ? new Uint8Array(
                  matches.map((byte: string) => parseInt(byte, 16)),
                )
              : new Uint8Array();
            return Transaction.deserialize(
              'signature',
              'proof',
              'binding',
              resultBytes,
            ) as FinalizedTransaction;
          } finally {
            providerCallback('balanceTxDone');
          }
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
  }, [localMode, localWallet, walletAPI, providerCallback]);

  const privateStateProvider: PrivateStateProvider<
    typeof LunarswapPrivateStateId,
    LunarswapPrivateState
  > = useMemo(() => {
    // 3.2.0-rc.1: levelPrivateStateProvider requires accountId + privateStoragePasswordProvider (no walletProvider).
    const accountId = walletAPI
      ? String(walletAPI.coinPublicKey)
      : 'lunarswap-disconnected';
    const privateStoragePasswordProvider = walletAPI
      ? () =>
          `${Buffer.from(String(walletAPI.encryptionPublicKey)).toString('base64')}A1!`
      : () => {
          const stored = localStorage.getItem('lunarswap-storage-password');
          if (stored) return stored;
          const defaultPassword = 'lunarswap-default-passwordA1!';
          localStorage.setItem('lunarswap-storage-password', defaultPassword);
          return defaultPassword;
        };

    const providerConfig = {
      privateStateStoreName: 'lunarswap-private-state',
      accountId,
      privateStoragePasswordProvider,
    } as Parameters<
      typeof levelPrivateStateProvider<typeof LunarswapPrivateStateId>
    >[0];

    return new PrivateDataProviderWrapper(
      levelPrivateStateProvider(providerConfig),
      logger,
    );
  }, [walletAPI, logger]);

  const midnightProvider: MidnightProvider = useMemo(() => {
    if (localMode && localWallet) {
      return {
        async submitTx(tx: FinalizedTransaction): Promise<TransactionId> {
          providerCallback('submitTxStarted');
          try {
            return await localWallet.wallet.submitTransaction(tx);
          } finally {
            providerCallback('submitTxDone');
          }
        },
      };
    }
    if (walletAPI) {
      return {
        async submitTx(tx: FinalizedTransaction): Promise<TransactionId> {
          providerCallback('submitTxStarted');
          const serialized = tx.serialize();
          const hex = Array.from(serialized)
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('');
          await walletAPI.wallet.submitTransaction(hex);
          providerCallback('submitTxDone');
          return tx.identifiers()[0];
        },
      };
    }
    return {
      submitTx(_tx: FinalizedTransaction): Promise<TransactionId> {
        return Promise.reject(new Error('readonly'));
      },
    };
  }, [localMode, localWallet, walletAPI, providerCallback]);

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
    connectLocal,
    isLocalMode: localMode,
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
      walletError,
    }));
  }, [address, isConnecting, proofServerIsOnline, shake, walletError]);

  // Update wallet state when snackBarText changes
  useEffect(() => {
    setWalletState((state) => ({
      ...state,
      snackBarText,
    }));
  }, [snackBarText]);

  // Keep function references up to date in wallet state
  useEffect(() => {
    setWalletState((state) => ({
      ...state,
      connect,
      disconnect,
      reconnect: manualReconnect,
      callback: providerCallback,
      connectLocal,
      isLocalMode: localMode,
    }));
  }, [
    connect,
    disconnect,
    manualReconnect,
    providerCallback,
    connectLocal,
    localMode,
  ]);

  //const connectMemo = useCallback(connect, []);

  // Check if wallet is available before auto-connecting (API 4.x: Lace uses UUID key, not mnLace)
  const isWalletAvailable = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return !!getLaceMidnightProvider();
  }, []);

  useEffect(() => {
    if (localMode) return; // local-wallet bootstrap handles connection
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
    localMode,
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
    if (localMode) {
      return; // no extension to ping in local mode
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
  }, [localMode, walletState.isConnected, walletAPI, logger]);

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
