import {
  Transaction,
  type FinalizedTransaction,
  type TransactionId,
  type CoinPublicKey,
  type EncPublicKey,
} from '@midnight-ntwrk/ledger-v7';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import type {
  MidnightProvider,
  WalletProvider,
  UnboundTransaction,
} from '@midnight-ntwrk/midnight-js-types';
import type { Resource } from '@midnight-ntwrk/wallet';
import type { Wallet } from '@midnight-ntwrk/wallet-api';
import { Transaction as ZswapTransaction, type NetworkId } from '@midnight-ntwrk/zswap';
import type {
  LunarswapProviders,
  LunarswapPrivateStateId,
  LunarswapCircuitKeys,
} from '@openzeppelin/midnight-apps-lunarswap-api';
import { firstValueFrom } from 'rxjs';
import type { Config } from '../config';
import { contractConfig } from '../config';

const createWalletAndMidnightProvider = async (
  wallet: Wallet,
  networkId: NetworkId,
): Promise<WalletProvider & MidnightProvider> => {
  const state = await firstValueFrom(wallet.state());
  
  return {
    balanceTx: async (
      tx: UnboundTransaction,
      _ttl?: Date,
    ): Promise<FinalizedTransaction> => {
      // Convert ledger-v7 Transaction to zswap Transaction for wallet API
      const serializedTx = tx.serialize();
      const zswapTx = ZswapTransaction.deserialize(serializedTx, networkId);
      
      // Check if balanceAndProveTransaction exists (newer API)
      if ('balanceAndProveTransaction' in wallet && typeof wallet.balanceAndProveTransaction === 'function') {
        const balancedAndProvenZswapTx = await wallet.balanceAndProveTransaction(zswapTx, []);
        const balancedAndProvenSerialized = balancedAndProvenZswapTx.serialize(networkId);
        return Transaction.deserialize(
          'signature',
          'proof',
          'binding',
          balancedAndProvenSerialized,
        ) as FinalizedTransaction;
      }
      
      // Fallback to separate balanceTransaction and proveTransaction (older API)
      const balancedZswapTx = await wallet.balanceTransaction(zswapTx, []);
      const provenZswapTx = await wallet.proveTransaction(balancedZswapTx);
      const provenSerialized = provenZswapTx.serialize(networkId);
      return Transaction.deserialize(
        'signature',
        'proof',
        'binding',
        provenSerialized,
      ) as FinalizedTransaction;
    },
    getCoinPublicKey(): CoinPublicKey {
      return state.coinPublicKey;
    },
    getEncryptionPublicKey(): EncPublicKey {
      return state.encryptionPublicKey;
    },
    submitTx: async (tx: FinalizedTransaction): Promise<TransactionId> => {
      // Convert FinalizedTransaction to ZswapTransaction for wallet API
      const serialized = tx.serialize();
      const zswapTx = ZswapTransaction.deserialize(serialized, networkId);
      await wallet.submitTransaction(zswapTx);
      // Generate transaction ID from the transaction serialization
      return Buffer.from(serialized.slice(0, 32)).toString('hex') as TransactionId;
    },
  };
};

export const configureProviders = async (
  wallet: Wallet & Resource,
  config: Config,
): Promise<LunarswapProviders> => {
  const zkConfigProvider = new NodeZkConfigProvider<LunarswapCircuitKeys>(contractConfig.zkConfigPath);
  const walletAndMidnightProvider =
    await createWalletAndMidnightProvider(wallet, config.networkId);

  return {
    privateStateProvider: levelPrivateStateProvider<
      typeof LunarswapPrivateStateId
    >({
      privateStateStoreName: contractConfig.privateStateStoreName,
    }),
    publicDataProvider: indexerPublicDataProvider(
      config.indexer,
      config.indexerWS,
    ),
    zkConfigProvider,
    proofProvider: httpClientProofProvider(config.proofServer, zkConfigProvider),
    walletProvider: walletAndMidnightProvider,
    midnightProvider: walletAndMidnightProvider,
  };
};
