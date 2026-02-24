import path from 'node:path';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import {
  type EnvironmentConfiguration,
  getTestEnvironment,
  RemoteTestEnvironment,
  type TestEnvironment,
} from '@midnight-ntwrk/testkit-js';
import { preprod, preview, testnet } from '@openzeppelin/midnight-networks';
import type { Logger } from 'pino';

export const currentDir = path.resolve(new URL(import.meta.url).pathname, '..');

export const contractConfig = {
  privateStateStoreName: 'lunarswap-private-state',
  zkConfigPath: path.resolve(
    currentDir,
    '..',
    '..',
    '..',
    'contracts',
    'src',
    'artifacts',
    'lunarswap',
    'Lunarswap',
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

/** Standalone (local Docker) - uses genesis wallet, no faucet/dust */
export class StandaloneConfig implements Config {
  getEnvironment(logger: Logger): TestEnvironment {
    return getTestEnvironment(logger) as TestEnvironment;
  }
  privateStateStoreName = contractConfig.privateStateStoreName;
  logDir = path.resolve(
    currentDir,
    '..',
    'logs',
    'standalone',
    `${new Date().toISOString()}.log`,
  );
  zkConfigPath = contractConfig.zkConfigPath;
  requestFaucetTokens = false;
  generateDust = false;
}

/** Testnet local - same as standalone, uses local Docker stack */
export class TestnetLocalConfig extends StandaloneConfig {
  logDir = path.resolve(
    currentDir,
    '..',
    'logs',
    'testnet-local',
    `${new Date().toISOString()}.log`,
  );
}

/** Testnet remote - uses testnet-02 with proof server container */
export class TestnetRemoteConfig implements Config {
  networkId = testnet.networkId;
  getEnvironment(logger: Logger): TestEnvironment {
    setNetworkId(testnet.networkId);
    return new TestnetRemoteTestEnvironment(logger);
  }
  privateStateStoreName = contractConfig.privateStateStoreName;
  logDir = path.resolve(
    currentDir,
    '..',
    'logs',
    'testnet-remote',
    `${new Date().toISOString()}.log`,
  );
  zkConfigPath = contractConfig.zkConfigPath;
  requestFaucetTokens = false;
  generateDust = true;
}

/** Preview remote - uses preview network with proof server container */
export class PreviewRemoteConfig implements Config {
  networkId = preview.networkId;
  getEnvironment(logger: Logger): TestEnvironment {
    setNetworkId(preview.networkId);
    return new PreviewTestEnvironment(logger);
  }
  privateStateStoreName = contractConfig.privateStateStoreName;
  logDir = path.resolve(
    currentDir,
    '..',
    'logs',
    'preview-remote',
    `${new Date().toISOString()}.log`,
  );
  zkConfigPath = contractConfig.zkConfigPath;
  requestFaucetTokens = false;
  generateDust = true;
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

export class TestnetRemoteTestEnvironment extends RemoteTestEnvironment {
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
    const nodeWS = testnet.node
      .replace('https://', 'wss://')
      .replace('http://', 'ws://');
    return {
      walletNetworkId: testnet.networkId,
      networkId: testnet.networkId,
      indexer: testnet.indexer,
      indexerWS: testnet.indexerWS,
      node: testnet.node,
      nodeWS,
      faucet: testnet.faucetUrl,
      proofServer: this.getProofServerUrl(),
    };
  }
}

export class PreviewTestEnvironment extends RemoteTestEnvironment {
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
    const nodeWS = preview.node
      .replace('https://', 'wss://')
      .replace('http://', 'ws://');
    return {
      walletNetworkId: preview.networkId,
      networkId: preview.networkId,
      indexer: preview.indexer,
      indexerWS: preview.indexerWS,
      node: preview.node,
      nodeWS,
      faucet: preview.faucetUrl,
      proofServer: this.getProofServerUrl(),
    };
  }
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
