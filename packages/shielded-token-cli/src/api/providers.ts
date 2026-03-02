import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import type {
  ShieldedFungibleTokenCircuitKeys,
  ShieldedFungibleTokenProviders,
} from '@openzeppelin/midnight-apps-shielded-token-api';
import { ShieldedFungibleTokenPrivateStateId } from '@openzeppelin/midnight-apps-shielded-token-api';
import type { Config } from '../config.js';
import type { MidnightWalletProvider } from '../midnight-wallet-provider.js';

export const configureProviders = (
  walletProvider: MidnightWalletProvider,
  config: Config,
): ShieldedFungibleTokenProviders => {
  const zkConfigProvider =
    new NodeZkConfigProvider<ShieldedFungibleTokenCircuitKeys>(
      config.zkConfigPath,
    );
  const env = walletProvider.env;

  // 3.2.0-rc.1 config: accountId + privateStoragePasswordProvider (required).
  // Type assertion used so this compiles when an older provider's types are resolved.
  const privateStateConfig = {
    privateStateStoreName: config.privateStateStoreName,
    accountId: walletProvider.getCoinPublicKey(),
    // Provider requires password with ≥3 character classes (upper, lower, digit, special).
    privateStoragePasswordProvider: () =>
      `${walletProvider.getEncryptionPublicKey() as string}A!`,
  } as Parameters<
    typeof levelPrivateStateProvider<typeof ShieldedFungibleTokenPrivateStateId>
  >[0];

  return {
    privateStateProvider: levelPrivateStateProvider<
      typeof ShieldedFungibleTokenPrivateStateId
    >(privateStateConfig),
    publicDataProvider: indexerPublicDataProvider(env.indexer, env.indexerWS),
    zkConfigProvider,
    proofProvider: httpClientProofProvider(env.proofServer, zkConfigProvider),
    walletProvider,
    midnightProvider: walletProvider,
  };
};
