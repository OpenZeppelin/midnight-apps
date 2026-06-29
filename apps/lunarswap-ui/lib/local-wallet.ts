import {
  DustSecretKey,
  LedgerParameters,
  ZswapSecretKeys,
} from '@midnight-ntwrk/ledger-v8';
import {
  createKeystore,
  DustWallet,
  type DustWalletAPI,
  HDWallet,
  NoOpTransactionHistoryStorage,
  PublicKey,
  type Role,
  Roles,
  ShieldedWallet,
  type ShieldedWalletAPI,
  UnshieldedWallet,
  type UnshieldedWalletAPI,
  WalletFacade,
} from '@midnight-ntwrk/wallet-sdk';
import { Buffer } from 'buffer';
import type { NetworkConfig } from '@/utils/config';

/**
 * Genesis-mint seed used by the local docker chain. Matches the CLI standalone path.
 */
export const GENESIS_MINT_WALLET_SEED =
  '0000000000000000000000000000000000000000000000000000000000000001';

const ADDITIONAL_FEE_OVERHEAD_UNDEPLOYED = 500_000_000_000_000_000n;

type WalletNetworkId = 'undeployed' | 'devnet' | 'testnet' | 'mainnet';

type DerivedSeeds = {
  masterSeed: string;
  shielded: Uint8Array;
  unshielded: Uint8Array;
  dust: Uint8Array;
};

const deriveSeed = (masterSeedHex: string, role: Role): Uint8Array => {
  const seedBuffer = Buffer.from(masterSeedHex, 'hex');
  const result = HDWallet.fromSeed(seedBuffer);
  if (result.type !== 'seedOk') {
    throw new Error('Invalid master seed');
  }
  const derived = result.hdWallet
    .selectAccount(0)
    .selectRole(role)
    .deriveKeyAt(0);
  if (derived.type === 'keyOutOfBounds') {
    throw new Error(`Failed to derive key for role ${role}`);
  }
  return derived.key;
};

const deriveSeeds = (masterSeedHex: string): DerivedSeeds => ({
  masterSeed: masterSeedHex,
  shielded: deriveSeed(masterSeedHex, Roles.Zswap),
  unshielded: deriveSeed(masterSeedHex, Roles.NightExternal),
  dust: deriveSeed(masterSeedHex, Roles.Dust),
});

export interface BuildLocalWalletOptions {
  /** UI runtime network config (provides indexer/proof-server/RPC URLs). */
  network: NetworkConfig;
  /** Wallet network id — `'undeployed'` for the local docker chain. */
  walletNetworkId: WalletNetworkId;
  /** 64-char hex master seed. Defaults to the local genesis-mint seed. */
  masterSeedHex?: string;
}

export interface LocalWalletHandle {
  wallet: WalletFacade;
  shielded: ShieldedWalletAPI;
  unshielded: UnshieldedWalletAPI;
  dust: DustWalletAPI;
  zswapSecretKeys: ZswapSecretKeys;
  dustSecretKey: DustSecretKey;
  seeds: DerivedSeeds;
}

const buildConfig = (
  network: NetworkConfig,
  walletNetworkId: WalletNetworkId,
) => {
  const wsRpcUrl = network.RPC_URL.replace(/^http/, 'ws');
  return {
    indexerClientConnection: {
      indexerHttpUrl: network.INDEXER_URI,
      indexerWsUrl: network.INDEXER_WS_URI,
    },
    provingServerUrl: new URL(network.PROOF_SERVER_URL),
    networkId: walletNetworkId,
    relayURL: new URL(wsRpcUrl),
    txHistoryStorage: new NoOpTransactionHistoryStorage(),
    costParameters: {
      ledgerParams: LedgerParameters.initialParameters(),
      additionalFeeOverhead:
        walletNetworkId === 'undeployed'
          ? ADDITIONAL_FEE_OVERHEAD_UNDEPLOYED
          : 1_000n,
      feeBlocksMargin: 5,
    },
  };
};

/**
 * Build (and start) a `wallet-sdk-facade@4` instance entirely in-browser, bypassing the dApp connector.
 * Matches the CLI standalone wallet flow so the same fix path can be exercised without Lace.
 */
export const buildLocalWallet = async ({
  network,
  walletNetworkId,
  masterSeedHex = GENESIS_MINT_WALLET_SEED,
}: BuildLocalWalletOptions): Promise<LocalWalletHandle> => {
  const seeds = deriveSeeds(masterSeedHex);
  const config = buildConfig(network, walletNetworkId);

  const unshieldedKeystore = createKeystore(seeds.unshielded, walletNetworkId);

  const shielded = ShieldedWallet(config).startWithSeed(seeds.shielded);
  const unshielded = UnshieldedWallet({
    ...config,
    txHistoryStorage: new NoOpTransactionHistoryStorage(),
  }).startWithPublicKey(PublicKey.fromKeyStore(unshieldedKeystore));
  const dust = DustWallet(config).startWithSeed(
    seeds.dust,
    LedgerParameters.initialParameters().dust,
  );

  const wallet = await WalletFacade.init({
    configuration: config,
    shielded: () => shielded,
    unshielded: () => unshielded,
    dust: () => dust,
  });

  const zswapSecretKeys = ZswapSecretKeys.fromSeed(seeds.shielded);
  const dustSecretKey = DustSecretKey.fromSeed(seeds.dust);

  await wallet.start(zswapSecretKeys, dustSecretKey);

  return {
    wallet,
    shielded,
    unshielded,
    dust,
    zswapSecretKeys,
    dustSecretKey,
    seeds,
  };
};

const LOCAL_WALLET_STORAGE_KEY = 'lunarswap.localWalletMode';

/**
 * Persists the local-wallet mode preference to `localStorage`. Pass `true` when
 * the user clicks the "Test Wallet" button, `false` on disconnect.
 */
export const setLocalWalletModeEnabled = (enabled: boolean): void => {
  if (typeof window === 'undefined') return;
  try {
    if (enabled) {
      window.localStorage.setItem(LOCAL_WALLET_STORAGE_KEY, '1');
    } else {
      window.localStorage.removeItem(LOCAL_WALLET_STORAGE_KEY);
    }
  } catch {
    // localStorage may be unavailable (private mode etc.) — ignore.
  }
};

/**
 * Reads `?localWallet=1` from the URL (or any truthy value), persists it to
 * `localStorage` so internal SPA navigation doesn't lose the flag, and falls
 * back to `VITE_USE_LOCAL_WALLET` at build time. Pass `?localWallet=0` to
 * clear the persisted flag and revert to Lace.
 */
export const isLocalWalletModeEnabled = (): boolean => {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  const flag = params.get('localWallet');
  if (flag !== null) {
    const enabled = flag !== '0' && flag.toLowerCase() !== 'false';
    try {
      if (enabled) {
        window.localStorage.setItem(LOCAL_WALLET_STORAGE_KEY, '1');
      } else {
        window.localStorage.removeItem(LOCAL_WALLET_STORAGE_KEY);
      }
    } catch {
      // localStorage may be unavailable (private mode etc.) — ignore.
    }
    return enabled;
  }
  try {
    if (window.localStorage.getItem(LOCAL_WALLET_STORAGE_KEY) === '1') {
      return true;
    }
  } catch {
    // ignore
  }
  const envFlag =
    typeof import.meta !== 'undefined' &&
    (import.meta as { env?: { VITE_USE_LOCAL_WALLET?: string } }).env
      ?.VITE_USE_LOCAL_WALLET;
  return envFlag === '1' || envFlag === 'true';
};
