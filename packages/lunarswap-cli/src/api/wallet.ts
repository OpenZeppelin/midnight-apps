import type { Logger } from 'pino';
import type { Config } from '../config';
import type { Wallet } from '@midnight-ntwrk/wallet-api';
import { type Resource, WalletBuilder } from '@midnight-ntwrk/wallet';
import { getZswapNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { firstValueFrom, throttleTime, tap, filter, map } from 'rxjs';
import { existsSync, createReadStream } from 'node:fs';
import { nativeToken } from '@midnight-ntwrk/ledger';
import { streamToString, toHex, randomBytes } from './utils';

const waitForSyncProgress = async (wallet: Wallet, logger: Logger) => {
  await firstValueFrom(
    wallet.state().pipe(
      throttleTime(5_000),
      tap((state) => {
        const applyGap = state.syncProgress?.lag.applyGap ?? 0n;
        const sourceGap = state.syncProgress?.lag.sourceGap ?? 0n;
        logger.info(
          `Waiting for funds. Backend lag: ${sourceGap}, wallet lag: ${applyGap}, transactions=${state.transactionHistory.length}`,
        );
      }),
      filter((state) => {
        return state.syncProgress !== undefined;
      })
    )
  );
};

const isAnotherChain = async (wallet: Wallet, offset: number, logger: Logger): Promise<boolean> => {
  await waitForSyncProgress(wallet, logger);
  const walletOffset = Number(JSON.parse(await wallet.serializeState()).offset);
  if (walletOffset < offset - 1) {
    logger.info(
      `Your offset is ${walletOffset}, restored offset: ${offset} so it is another chain`,
    );
    return true;
  }
  logger.info(
    `Your offset is ${walletOffset}, restored offset: ${offset} ok`,
  );
  return false;
};

const waitForSync = (wallet: Wallet, logger: Logger) =>
  firstValueFrom(
    wallet.state().pipe(
      throttleTime(5_000),
      tap((state) => {
        const applyGap = state.syncProgress?.lag.applyGap ?? 0n;
        const sourceGap = state.syncProgress?.lag.sourceGap ?? 0n;
        logger.info(
          `Waiting for funds. Backend lag: ${sourceGap}, wallet lag: ${applyGap}, transactions=${state.transactionHistory.length}`,
        );
      }),
      filter((state) => {
        return state.syncProgress?.synced === true;
      }),
    ),
  );

const waitForFunds = (wallet: Wallet, logger: Logger) =>
  firstValueFrom(
    wallet.state().pipe(
      throttleTime(10_000),
      tap((state) => {
        const applyGap = state.syncProgress?.lag.applyGap ?? 0n;
        const sourceGap = state.syncProgress?.lag.sourceGap ?? 0n;
        logger.info(
          `Waiting for funds. Backend lag: ${sourceGap}, wallet lag: ${applyGap}, transactions=${state.transactionHistory.length}`,
        );
      }),
      filter((state) => {
        return state.syncProgress?.synced === true;
      }),
      map((s) => s.balances[nativeToken()] ?? 0n),
      filter((balance) => balance > 0n),
    ),
  );

export const buildWalletAndWaitForFunds = async (
  config: Config,
  seed: string,
  filename: string,
  logger: Logger,
): Promise<Wallet & Resource> => {
  const { indexer, indexerWS, node, proofServer } = config;
  const directoryPath = process.env.SYNC_CACHE;
  let wallet: Wallet & Resource;
  
  if (directoryPath !== undefined) {
    if (existsSync(`${directoryPath}/${filename}`)) {
      logger.info(`Attempting to restore state from ${directoryPath}/${filename}`);
      try {
        const serializedStream = createReadStream(`${directoryPath}/${filename}`, 'utf-8');
        const serialized = await streamToString(serializedStream);
        serializedStream.on('finish', () => {
          serializedStream.close();
        });
        
        wallet = await WalletBuilder.restore(
          indexer,
          indexerWS,
          proofServer,
          node,
          seed,
          serialized,
          'info',
        );
        wallet.start();
        
        const stateObject = JSON.parse(serialized);
        if ((await isAnotherChain(wallet, Number(stateObject.offset), logger)) === true) {
          logger.warn('The chain was reset, building wallet from scratch');
          wallet = await WalletBuilder.buildFromSeed(
            indexer,
            indexerWS,
            proofServer,
            node,
            seed,
            getZswapNetworkId(),
            'info',
          );
          wallet.start();
        } else {
          const newState = await waitForSync(wallet, logger);
          if (newState.syncProgress?.synced) {
            logger.info('Wallet was able to sync from restored state');
          } else {
            logger.info(`Offset: ${stateObject.offset}`);
            logger.info(
              `SyncProgress.lag.applyGap: ${newState.syncProgress?.lag.applyGap}`,
            );
            logger.info(
              `SyncProgress.lag.sourceGap: ${newState.syncProgress?.lag.sourceGap}`,
            );
            logger.warn(
              'Wallet was not able to sync from restored state, building wallet from scratch',
            );
            wallet = await WalletBuilder.buildFromSeed(
              indexer,
              indexerWS,
              proofServer,
              node,
              seed,
              getZswapNetworkId(),
              'info',
            );
            wallet.start();
          }
        }
      } catch (error: unknown) {
        if (typeof error === 'string') {
          logger.error(error);
        } else if (error instanceof Error) {
          logger.error(error.message);
        } else {
          logger.error(error);
        }
        logger.warn('Wallet was not able to restore using the stored state, building wallet from scratch');
        wallet = await WalletBuilder.buildFromSeed(
          indexer,
          indexerWS,
          proofServer,
          node,
          seed,
          getZswapNetworkId(),
          'info',
        );
        wallet.start();
      }
    } else {
      logger.info('Wallet save file not found, building wallet from scratch');
      wallet = await WalletBuilder.buildFromSeed(
        indexer,
        indexerWS,
        proofServer,
        node,
        seed,
        getZswapNetworkId(),
        'info',
      );
      wallet.start();
    }
  } else {
    logger.info('File path for save file not found, building wallet from scratch');
    wallet = await WalletBuilder.buildFromSeed(
      indexer,
      indexerWS,
      proofServer,
      node,
      seed,
      getZswapNetworkId(),
      'info',
    );
    wallet.start();
  }

  const state = await firstValueFrom(wallet.state());
  logger.info(`Your wallet seed is: ${seed}`);
  logger.info(`Your wallet address is: ${state.address}`);
  let balance = state.balances[nativeToken()];
  if (balance === undefined || balance === 0n) {
    logger.info('Your wallet balance is: 0');
    logger.info('Waiting to receive tokens...');
    balance = await waitForFunds(wallet, logger);
  }
  logger.info(`Your wallet balance is: ${balance}`);
  return wallet;
};

export const buildFreshWallet = async (config: Config, logger: Logger): Promise<Wallet & Resource> =>
  await buildWalletAndWaitForFunds(config, toHex(randomBytes(32)), 'lunarswap-wallet.json', logger);

export const buildWalletFromSeed = async (config: Config, seed: string, logger: Logger): Promise<Wallet & Resource> => {
  return await buildWalletAndWaitForFunds(config, seed, 'lunarswap-wallet.json', logger);
}; 