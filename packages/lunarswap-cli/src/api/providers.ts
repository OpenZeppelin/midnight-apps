import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import type {
  LunarswapCircuitKeysWithProof,
  LunarswapPrivateStateId,
  LunarswapProviders,
} from '@openzeppelin/midnight-apps-lunarswap-api';
import type { Config } from '../config.js';
import type { MidnightWalletProvider } from '../midnight-wallet-provider.js';

export const configureProviders = (
  walletProvider: MidnightWalletProvider,
  config: Config,
): LunarswapProviders => {
  const zkConfigProvider =
    new NodeZkConfigProvider<LunarswapCircuitKeysWithProof>(
      config.zkConfigPath,
    );
  const env = walletProvider.env;

  // 3.2.0-rc.1 config: accountId + privateStoragePasswordProvider (required).
  const privateStateConfig = {
    privateStateStoreName: config.privateStateStoreName,
    accountId: walletProvider.getCoinPublicKey(),
    privateStoragePasswordProvider: () =>
      `${walletProvider.getEncryptionPublicKey() as string}A!`,
  } as Parameters<
    typeof levelPrivateStateProvider<typeof LunarswapPrivateStateId>
  >[0];

  return {
    privateStateProvider:
      levelPrivateStateProvider<typeof LunarswapPrivateStateId>(
        privateStateConfig,
      ),
    publicDataProvider: indexerPublicDataProvider(env.indexer, env.indexerWS),
    zkConfigProvider,
    proofProvider: httpClientProofProvider(env.proofServer, zkConfigProvider),
    walletProvider,
    midnightProvider: walletProvider,
  };
};
