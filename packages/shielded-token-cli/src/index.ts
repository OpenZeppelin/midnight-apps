import { randomBytes } from 'node:crypto';
import { stdin as input, stdout as output } from 'node:process';
import { createInterface, type Interface } from 'node:readline/promises';
import { unshieldedToken } from '@midnight-ntwrk/ledger-v7';
import { toHex } from '@midnight-ntwrk/midnight-js-utils';
import {
  DynamicProofServerContainer,
  StaticProofServerContainer,
  type TestEnvironment,
} from '@midnight-ntwrk/testkit-js';
import { mnemonicToSeedSync, validateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import type { Logger } from 'pino';
import { WebSocket } from 'ws';
import { configureProviders } from './api/providers.js';
import { mainLoop } from './cli.js';
import type { Config } from './config.js';
import { generateDust } from './generate-dust.js';
import { MidnightWalletProvider } from './midnight-wallet-provider.js';
import { verifyAddresses } from './scripts/verify-addresses.js';
import { syncWallet, waitForUnshieldedFunds } from './wallet-utils.js';

// @ts-expect-error: Enable WebSocket for Apollo
globalThis.WebSocket = WebSocket;

const WALLET_LOOP_QUESTION = `
You can do one of the following:
  1. Build a fresh wallet
  2. Build wallet from a seed (hex or BIP39 mnemonic)
  3. Exit
${process.env.TEST_RECOVERY_PHRASE ? '  4. Recover from TEST_RECOVERY_PHRASE (env)\n' : ''}Which would you like to do? `;

/** Converts BIP39 mnemonic or hex seed to the hex format expected by FluentWalletBuilder. */
function normalizeSeed(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error('Seed cannot be empty');
  }
  if (
    /^[0-9a-fA-F]+$/.test(trimmed) &&
    (trimmed.length === 64 || trimmed.length === 128)
  ) {
    return trimmed.toLowerCase();
  }
  if (validateMnemonic(trimmed, wordlist)) {
    const seed = mnemonicToSeedSync(trimmed);
    return toHex(seed);
  }
  throw new Error(
    'Invalid seed: provide a 64-char hex string or a valid BIP39 mnemonic phrase (12 or 24 words)',
  );
}

const buildWallet = async (
  rli: Interface,
  logger: Logger,
): Promise<{ seed: string; fromEnvRecovery?: boolean } | undefined> => {
  while (true) {
    const choice = await rli.question(WALLET_LOOP_QUESTION);
    switch (choice.trim()) {
      case '1':
        return { seed: toHex(randomBytes(32)) };
      case '2': {
        const raw = await rli.question(
          'Enter your wallet seed (hex or BIP39 mnemonic): ',
        );
        try {
          return { seed: normalizeSeed(raw) };
        } catch (e) {
          logger.error(e instanceof Error ? e.message : 'Invalid seed');
          continue;
        }
      }
      case '3':
        logger.info('Exiting...');
        return undefined;
      case '4':
        if (process.env.TEST_RECOVERY_PHRASE) {
          try {
            return {
              seed: normalizeSeed(process.env.TEST_RECOVERY_PHRASE),
              fromEnvRecovery: true,
            };
          } catch (e) {
            logger.error(e instanceof Error ? e.message : 'Invalid TEST_RECOVERY_PHRASE');
            continue;
          }
        }
        logger.error('TEST_RECOVERY_PHRASE is not set');
        continue;
      default:
        logger.error(`Invalid choice: ${choice}`);
    }
  }
};

function logError(logger: Logger, e: unknown) {
  if (e instanceof Error) {
    logger.error(`Found error: ${e.message}`);
    if (e.stack) {
      logger.error({ stack: e.stack }, 'Stack trace');
    }
    if (e.cause !== undefined) {
      logger.error({ cause: e.cause }, 'Error cause');
      if (e.cause instanceof Error && e.cause.stack) {
        logger.error({ causeStack: e.cause.stack }, 'Cause stack');
      }
    }
    // Log any enumerable extra properties (e.g. from SDK errors)
    const extra = Object.fromEntries(
      Object.entries(e).filter(
        ([k]) => !['message', 'stack', 'cause', 'name'].includes(k),
      ),
    );
    if (Object.keys(extra).length > 0) {
      logger.error({ extra }, 'Error details');
    }
  } else {
    logger.error({ error: e }, 'Found error (non-Error)');
  }
}

export const run = async (
  config: Config,
  testEnv: TestEnvironment,
  logger: Logger,
): Promise<void> => {
  const rli = createInterface({ input, output, terminal: true });
  const providersToBeStopped: MidnightWalletProvider[] = [];

  try {
    let proofServer:
      | Awaited<ReturnType<typeof DynamicProofServerContainer.start>>
      | StaticProofServerContainer
      | undefined;
    if (config.networkId !== undefined) {
      const existingPort = process.env.PROOF_SERVER_PORT;
      if (existingPort !== undefined) {
        const port = Number.parseInt(existingPort, 10);
        if (Number.isNaN(port)) {
          throw new Error(
            `Invalid PROOF_SERVER_PORT: ${existingPort}. Must be a number.`,
          );
        }
        logger.info(`Using existing proof server at localhost:${port}`);
        proofServer = new StaticProofServerContainer(port);
      } else {
        proofServer = await DynamicProofServerContainer.start(
          logger,
          undefined,
          config.networkId,
        );
      }
    }
    const envConfiguration = await testEnv.start(proofServer);
    logger.info(
      `Environment started with configuration: ${JSON.stringify(envConfiguration)}`,
    );

    const walletResult = await buildWallet(rli, logger);
    if (walletResult === undefined) {
      return;
    }
    const { seed, fromEnvRecovery } = walletResult;

    const walletProvider = await MidnightWalletProvider.build(
      logger,
      envConfiguration,
      seed,
    );
    providersToBeStopped.push(walletProvider);

    await walletProvider.start();

    if (fromEnvRecovery) {
      verifyAddresses(config.networkId);
      logger.info('Recovered addresses match TEST_SHIELDED_ADDRESS and TEST_DUST_ADDRESS');
    }

    const unshieldedState = await waitForUnshieldedFunds(
      logger,
      walletProvider.wallet,
      envConfiguration,
      unshieldedToken(),
      config.requestFaucetTokens,
    );
    const nightBalance = unshieldedState.balances[unshieldedToken().raw];
    if (nightBalance === undefined) {
      logger.info('No funds received, exiting...');
      return;
    }
    logger.info(`Your NIGHT wallet balance is: ${nightBalance}`);

    if (config.generateDust) {
      const dustGeneration = await generateDust(
        logger,
        seed,
        unshieldedState,
        walletProvider.wallet,
      );
      if (dustGeneration) {
        logger.info(
          `Submitted dust generation registration transaction: ${dustGeneration}`,
        );
        await syncWallet(logger, walletProvider.wallet);
      }
    }

    const providers = configureProviders(walletProvider, config);

    await mainLoop(
      providers,
      config.zkConfigPath,
      rli,
      logger,
      walletProvider,
    );
  } catch (e) {
    logError(logger, e);
    logger.info('Exiting...');
  } finally {
    try {
      rli.close();
      rli.removeAllListeners();
    } catch (e) {
      logError(logger, e);
    } finally {
      try {
        for (const wallet of providersToBeStopped) {
          logger.info('Stopping wallet...');
          await wallet.stop();
        }
        if (testEnv) {
          logger.info('Stopping test environment...');
          await testEnv.shutdown();
        }
      } catch (e) {
        logError(logger, e);
      }
    }
  }
};
