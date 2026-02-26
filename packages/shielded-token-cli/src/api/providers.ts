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

  return {
    privateStateProvider: levelPrivateStateProvider<
      typeof ShieldedFungibleTokenPrivateStateId
    >({
      privateStateStoreName: config.privateStateStoreName,
      walletProvider,
    }),
    publicDataProvider: indexerPublicDataProvider(env.indexer, env.indexerWS),
    zkConfigProvider,
    proofProvider: httpClientProofProvider(env.proofServer, zkConfigProvider),
    walletProvider,
    midnightProvider: walletProvider,
  };
};
