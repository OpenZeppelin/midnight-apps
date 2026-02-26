import path from 'node:path';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import type { EnvironmentConfiguration } from '@midnight-ntwrk/testkit-js';
import {
  RemoteTestEnvironment,
  type TestEnvironment,
} from '@midnight-ntwrk/testkit-js';
import { preprod } from '@openzeppelin/midnight-networks';
import type { Logger } from 'pino';

export const currentDir = path.resolve(new URL(import.meta.url).pathname, '..');

export const contractConfig = {
  privateStateStoreName: 'shielded-token-private-state',
  zkConfigPath: path.resolve(
    currentDir,
    '..',
    '..',
    '..',
    'contracts',
    'src',
    'artifacts',
    'shielded-token',
    'ShieldedFungibleToken',
  ),
};

export interface Config {
  readonly privateStateStoreName: string;
  readonly logDir: string;
  readonly zkConfigPath: string;
  getEnvironment(logger: Logger): TestEnvironment;
  readonly requestFaucetTokens: boolean;
  readonly generateDust: boolean;
  /** Network ID for remote proof server (preprod, preview, testnet). Undefined for local. */
  readonly networkId?: string;
}

/** Preprod remote - uses preprod network with local proof server container */
export class PreprodRemoteConfig implements Config {
  networkId = preprod.networkId;
  getEnvironment(logger: Logger): TestEnvironment {
    setNetworkId(preprod.networkId);
    return new PreprodTestEnvironment(logger);
  }
  privateStateStoreName = contractConfig.privateStateStoreName;
  logDir = path.resolve(
    currentDir,
    '..',
    'logs',
    'preprod-remote',
    `${new Date().toISOString()}.log`,
  );
  zkConfigPath = contractConfig.zkConfigPath;
  requestFaucetTokens = false;
  generateDust = true;
}

export class PreprodTestEnvironment extends RemoteTestEnvironment {
  private getProofServerUrl(): string {
    const container = this.proofServerContainer as
      | { getUrl(): string }
      | undefined;
    if (!container) {
      throw new Error('Proof server container is not available.');
    }
    return container.getUrl();
  }

  getEnvironmentConfiguration(): EnvironmentConfiguration {
    const nodeWS = preprod.node
      .replace('https://', 'wss://')
      .replace('http://', 'ws://');
    return {
      walletNetworkId: preprod.networkId,
      networkId: preprod.networkId,
      indexer: preprod.indexer,
      indexerWS: preprod.indexerWS,
      node: preprod.node,
      nodeWS,
      faucet: preprod.faucetUrl,
      proofServer: this.getProofServerUrl(),
    };
  }
}
