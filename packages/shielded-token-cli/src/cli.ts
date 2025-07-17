import { stdin as input, stdout as output } from 'node:process';
import { createInterface, type Interface } from 'node:readline/promises';
import type { Logger } from 'pino';
import type { Config } from './config';
import type {
  ShieldedTokenProviders,
  ShieldedToken,
} from '@midnight-dapps/shielded-token-api';
import type { Wallet } from '@midnight-ntwrk/wallet-api';
import type { Resource } from '@midnight-ntwrk/wallet';
import { buildFreshWallet, buildWalletFromSeed } from './api/wallet';
import { configureProviders } from './api/providers';
import { deployContract, joinContract } from './api/contract';
import { createCoinInfo, mintTokens, burnTokens, getTokenInfo } from './api/token';
import { getPublicState, getZswapChainState, getDeployedContractState } from './api/state';
import { subscribeToState } from './api/state';

let logger: Logger;

const WALLET_LOOP_QUESTION = `
You can do one of the following:
  1. Build a fresh wallet
  2. Build wallet from a seed
  3. Use test seed (if available)
  4. Exit
Which would you like to do? `;

const DEPLOY_OR_JOIN_QUESTION = `
You can do one of the following:
  1. Deploy a new Shielded Token contract
  2. Join an existing Shielded Token contract
  3. Exit
Which would you like to do? `;

const MAIN_LOOP_QUESTION = `
Shielded Token CLI - Main Menu

You can do one of the following:
1. Get token information
2. Mint tokens
3. Burn tokens
4. Get public state
5. Get ZSwap chain state
6. Get deployed contract state
7. Subscribe to state
8. Exit

Which would you like to do? `;

const WALLET_QUESTION = 'Enter your wallet seed: ';
const CONTRACT_ADDRESS_QUESTION = 'Enter the deployed Shielded Token contract address: ';

const buildWallet = async (config: Config, rli: Interface): Promise<(Wallet & Resource) | null> => {
  while (true) {
    const choice = await rli.question(WALLET_LOOP_QUESTION);
    switch (choice) {
      case '1':
        return await buildFreshWallet(config, logger);
      case '2': {
        const seed = await rli.question(WALLET_QUESTION);
        return await buildWalletFromSeed(config, seed, logger);
      }
      case '3': {
        if (config.testSeed) {
          logger.info('Using test seed from environment variable');
          return await buildWalletFromSeed(config, config.testSeed, logger);
        }
        logger.error('No test seed found in environment variable TEST_SEED');
        logger.info('Please set TEST_SEED environment variable or choose option 2 to enter seed manually');
        break;
      }
      case '4':
        logger.info('Exiting...');
        return null;
      default:
        logger.error(`Invalid choice: ${choice}`);
    }
  }
};

const deployOrJoin = async (providers: ShieldedTokenProviders, rli: Interface): Promise<ShieldedToken | null> => {
  while (true) {
    const choice = await rli.question(DEPLOY_OR_JOIN_QUESTION);
    switch (choice) {
      case '1':
        return await deployContract(providers, logger);
      case '2': {
        const contractAddress = await rli.question(CONTRACT_ADDRESS_QUESTION);
        return await joinContract(providers, contractAddress, logger);
      }
      case '3':
        logger.info('Exiting...');
        return null;
      default:
        logger.error(`Invalid choice: ${choice}`);
    }
  }
};

const handleGetTokenInfo = async (shieldedToken: ShieldedToken, rli: Interface): Promise<void> => {
  await getTokenInfo(shieldedToken, logger);
};

const handleMintTokens = async (shieldedToken: ShieldedToken, wallet: Wallet & Resource, rli: Interface): Promise<void> => {
  const amount = BigInt(await rli.question('Enter amount to mint: '));
  
  const recipientChoice = await rli.question('Mint to:\n1. Yourself (wallet)\n2. Custom recipient\nEnter choice (1 or 2): ');
  
  let recipientCoinPublicKey: string | undefined;
  
  if (recipientChoice === '2') {
    recipientCoinPublicKey = await rli.question('Enter recipient coin public key (hex): ');
  } else if (recipientChoice !== '1') {
    logger.error('Invalid choice, defaulting to mint to yourself');
  }

  await mintTokens(shieldedToken, wallet, amount, logger, recipientCoinPublicKey);
};

const handleBurnTokens = async (shieldedToken: ShieldedToken, rli: Interface): Promise<void> => {
  const coinColor = await rli.question('Enter coin color (hex): ');
  const coinValue = BigInt(await rli.question('Enter coin value: '));
  const burnAmount = BigInt(await rli.question('Enter amount to burn: '));

  const coin = createCoinInfo(coinColor, coinValue);
  await burnTokens(shieldedToken, coin, burnAmount, logger);
};

const handleGetPublicState = async (shieldedToken: ShieldedToken, providers: ShieldedTokenProviders, rli: Interface): Promise<void> => {
  await getPublicState(shieldedToken, providers, logger);
};

const handleGetZswapChainState = async (shieldedToken: ShieldedToken, providers: ShieldedTokenProviders, rli: Interface): Promise<void> => {
  await getZswapChainState(shieldedToken, providers, logger);
};

const handleGetDeployedContractState = async (shieldedToken: ShieldedToken, providers: ShieldedTokenProviders, rli: Interface): Promise<void> => {
  await getDeployedContractState(shieldedToken, providers, logger);
};

const handleSubscribeToState = async (shieldedToken: ShieldedToken, rli: Interface): Promise<void> => {
  logger.info('Starting state subscription. Press Ctrl+C to stop...');
  const subscription = await subscribeToState(shieldedToken, logger);
  
  // Keep the subscription active for a while
  setTimeout(() => {
    subscription.unsubscribe();
    logger.info('State subscription stopped');
  }, 30000); // Stop after 30 seconds
};

const mainLoop = async (providers: ShieldedTokenProviders, wallet: Wallet & Resource, rli: Interface): Promise<void> => {
  const shieldedToken = await deployOrJoin(providers, rli);
  if (shieldedToken === null) {
    logger.error('Failed to deploy or join Shielded Token contract');
    return;
  }
  while (true) {
    const choice = await rli.question(MAIN_LOOP_QUESTION);
    switch (choice) {
      case '1':
        await handleGetTokenInfo(shieldedToken, rli);
        break;
      case '2':
        await handleMintTokens(shieldedToken, wallet, rli);
        break;
      case '3':
        await handleBurnTokens(shieldedToken, rli);
        break;
      case '4':
        await handleGetPublicState(shieldedToken, providers, rli);
        break;
      case '5':
        await handleGetZswapChainState(shieldedToken, providers, rli);
        break;
      case '6':
        await handleGetDeployedContractState(shieldedToken, providers, rli);
        break;
      case '7':
        await handleSubscribeToState(shieldedToken, rli);
        break;
      case '8':
        logger.info('Exiting...');
        return;
      default:
        logger.error(`Invalid choice: ${choice}`);
    }
  }
};

export const run = async (config: Config, _logger: Logger, dockerEnv?: unknown): Promise<void> => {
  logger = _logger;
  const rli = createInterface({ input, output, terminal: true });
  let env: unknown;
  if (dockerEnv !== undefined) {
    env = await (dockerEnv as { up(): Promise<unknown> }).up();
    logger.info('Docker environment started');
  }
  const wallet = await buildWallet(config, rli);
  try {
    if (wallet !== null) {
      const providers = await configureProviders(wallet, config);
      await mainLoop(providers, wallet, rli);
    }
  } catch (e) {
    logger.error('Error:', e);
    throw e;
  } finally {
    try {
      rli.close();
      rli.removeAllListeners();
    } catch (e) {
      logger.error(`Error closing readline interface: ${e}`);
    } finally {
      try {
        if (wallet !== null) {
          await wallet.close();
        }
      } catch (e) {
        logger.error(`Error closing wallet: ${e}`);
      } finally {
        try {
          if (env !== undefined) {
            await (env as { down(): Promise<void> }).down();
            logger.info('Goodbye');
          }
        } catch (e) {
          logger.error(`Error shutting down docker environment: ${e}`);
        }
      }
    }
  }
}; 