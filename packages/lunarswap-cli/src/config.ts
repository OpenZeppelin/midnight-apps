import path from 'node:path';
import {
  NetworkId,
  setNetworkId,
} from '@midnight-ntwrk/midnight-js-network-id';

export const currentDir = path.resolve(new URL(import.meta.url).pathname, '..');

export const contractConfig = {
  privateStateStoreName: 'lunarswap-private-state',
  zkConfigPath: path.resolve(
    currentDir,
    '..',
    '..',
    '..',
    'contracts',
    'lunarswap-v1',
    'src',
    'artifacts',
    'Lunarswap',
  ),
};

export interface Config {
  readonly logDir: string;
  readonly indexer: string;
  readonly indexerWS: string;
  readonly node: string;
  readonly proofServer: string;
  readonly testSeed?: string; // Optional test seed for faster development
}

export class TestnetLocalConfig implements Config {
  logDir = path.resolve(
    currentDir,
    '..',
    'logs',
    'testnet-local',
    `${new Date().toISOString()}.log`,
  );
  indexer = 'http://127.0.0.1:8088/api/v1/graphql';
  indexerWS = 'ws://127.0.0.1:8088/api/v1/graphql/ws';
  node = 'http://127.0.0.1:9944';
  proofServer = 'http://127.0.0.1:6300';
  testSeed = process.env.LUNARSWAP_TEST_SEED;

  constructor() {
    setNetworkId(NetworkId.Undeployed);
  }
}

export class TestnetRemoteConfig implements Config {
  logDir = path.resolve(
    currentDir,
    '..',
    'logs',
    'testnet-remote',
    `${new Date().toISOString()}.log`,
  );
  indexer = 'https://indexer.testnet-02.midnight.network/api/v1/graphql';
  indexerWS = 'wss://indexer.testnet-02.midnight.network/api/v1/graphql/ws';
  node = 'https://rpc.testnet-02.midnight.network';
  proofServer = 'http://127.0.0.1:6300';
  testSeed = process.env.LUNARSWAP_TEST_SEED;

  constructor() {
    setNetworkId(NetworkId.TestNet);
  }
}

export class TestnetRemotePSConfig implements Config {
  logDir = path.resolve(
    currentDir,
    '..',
    'logs',
    'testnet-remote-ps',
    `${new Date().toISOString()}.log`,
  );
  indexer = 'https://indexer.testnet-02.midnight.network/api/v1/graphql';
  indexerWS = 'wss://indexer.testnet-02.midnight.network/api/v1/graphql/ws';
  node = 'https://rpc.testnet-02.midnight.network';
  proofServer = 'https://proof-server.testnet-02.midnight.network';
  testSeed = process.env.LUNARSWAP_TEST_SEED;

  constructor() {
    setNetworkId(NetworkId.TestNet);
  }
}
