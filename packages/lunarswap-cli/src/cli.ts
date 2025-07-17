import { stdin as input, stdout as output } from 'node:process';
import { createInterface, type Interface } from 'node:readline/promises';
import type { Logger } from 'pino';
import type { Config } from './config';
import type {
  LunarswapProviders,
  Lunarswap,
} from '@midnight-dapps/lunarswap-api';
import type { Wallet } from '@midnight-ntwrk/wallet-api';
import type { Resource } from '@midnight-ntwrk/wallet';
import {
  buildFreshWallet,
  buildWalletFromSeed,
  configureProviders,
  deployContract,
  joinContract,
  createCoinInfo,
  createRecipient,
  addLiquidity,
  removeLiquidity,
  swapExactTokensForTokens,
  swapTokensForExactTokens,
} from './api';

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
  1. Deploy a new LunarSwap contract
  2. Join an existing LunarSwap contract
  3. Exit
Which would you like to do? `;

const MAIN_LOOP_QUESTION = `
LunarSwap CLI - Main Menu

You can do one of the following:
1. Add liquidity to a pair
2. Remove liquidity from a pair
3. Swap tokens (exact input)
4. Swap tokens (exact output)
5. Exit

Which would you like to do? `;

const WALLET_QUESTION = 'Enter your wallet seed: ';
const CONTRACT_ADDRESS_QUESTION = 'Enter the deployed LunarSwap contract address: ';

const buildWallet = async (config: Config, rli: Interface): Promise<(Wallet & Resource) | null> => {
  // For now, always build a fresh wallet since we don't have StandaloneConfig
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
        logger.error('No test seed found in environment variable LUNARSWAP_TEST_SEED');
        logger.info('Please set LUNARSWAP_TEST_SEED environment variable or choose option 2 to enter seed manually');
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

const deployOrJoin = async (providers: LunarswapProviders, rli: Interface): Promise<Lunarswap | null> => {
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

const handleAddLiquidity = async (lunarswap: Lunarswap, rli: Interface): Promise<void> => {
  const tokenAColor = await rli.question('Enter token A color (hex): ');
  const tokenAValue = BigInt(await rli.question('Enter token A amount: '));
  const tokenBColor = await rli.question('Enter token B color (hex): ');
  const tokenBValue = BigInt(await rli.question('Enter token B amount: '));
  const amountAMin = BigInt(await rli.question('Enter minimum amount A: '));
  const amountBMin = BigInt(await rli.question('Enter minimum amount B: '));
  const recipient = await rli.question('Enter recipient address (hex): ');

  const tokenA = createCoinInfo(tokenAColor, tokenAValue);
  const tokenB = createCoinInfo(tokenBColor, tokenBValue);
  const to = createRecipient(recipient);

  await addLiquidity(lunarswap, tokenA, tokenB, amountAMin, amountBMin, to, logger);
};

const handleRemoveLiquidity = async (lunarswap: Lunarswap, rli: Interface): Promise<void> => {
  const tokenAColor = await rli.question('Enter token A color (hex): ');
  const tokenBColor = await rli.question('Enter token B color (hex): ');
  const liquidityColor = await rli.question('Enter liquidity token color (hex): ');
  const liquidityValue = BigInt(await rli.question('Enter liquidity amount: '));
  const amountAMin = BigInt(await rli.question('Enter minimum amount A: '));
  const amountBMin = BigInt(await rli.question('Enter minimum amount B: '));
  const recipient = await rli.question('Enter recipient address (hex): ');

  const tokenA = createCoinInfo(tokenAColor, 0n);
  const tokenB = createCoinInfo(tokenBColor, 0n);
  const liquidity = createCoinInfo(liquidityColor, liquidityValue);
  const to = createRecipient(recipient);

  await removeLiquidity(lunarswap, tokenA, tokenB, liquidity, amountAMin, amountBMin, to, logger);
};

const handleSwapExactTokensForTokens = async (lunarswap: Lunarswap, rli: Interface): Promise<void> => {
  const tokenInColor = await rli.question('Enter input token color (hex): ');
  const tokenInValue = BigInt(await rli.question('Enter input token amount: '));
  const tokenOutColor = await rli.question('Enter output token color (hex): ');
  const amountOutMin = BigInt(await rli.question('Enter minimum output amount: '));
  const recipient = await rli.question('Enter recipient address (hex): ');

  const tokenIn = createCoinInfo(tokenInColor, tokenInValue);
  const tokenOut = createCoinInfo(tokenOutColor, 0n);
  const to = createRecipient(recipient);

  await swapExactTokensForTokens(lunarswap, tokenIn, tokenOut, tokenInValue, amountOutMin, to, logger);
};

const handleSwapTokensForExactTokens = async (lunarswap: Lunarswap, rli: Interface): Promise<void> => {
  const tokenInColor = await rli.question('Enter input token color (hex): ');
  const tokenInValue = BigInt(await rli.question('Enter input token amount: '));
  const tokenOutColor = await rli.question('Enter output token color (hex): ');
  const amountOut = BigInt(await rli.question('Enter exact output amount: '));
  const amountInMax = BigInt(await rli.question('Enter maximum input amount: '));
  const recipient = await rli.question('Enter recipient address (hex): ');

  const tokenIn = createCoinInfo(tokenInColor, tokenInValue);
  const tokenOut = createCoinInfo(tokenOutColor, 0n);
  const to = createRecipient(recipient);

  await swapTokensForExactTokens(lunarswap, tokenIn, tokenOut, amountOut, amountInMax, to, logger);
};

const mainLoop = async (providers: LunarswapProviders, rli: Interface): Promise<void> => {
  const lunarswap = await deployOrJoin(providers, rli);
  if (lunarswap === null) {
    logger.error('Failed to deploy or join LunarSwap contract');
    return;
  }
  while (true) {
    const choice = await rli.question(MAIN_LOOP_QUESTION);
    switch (choice) {
      case '1':
        await handleAddLiquidity(lunarswap, rli);
        break;
      case '2':
        await handleRemoveLiquidity(lunarswap, rli);
        break;
      case '3':
        await handleSwapExactTokensForTokens(lunarswap, rli);
        break;
      case '4':
        await handleSwapTokensForExactTokens(lunarswap, rli);
        break; 
      case '5':
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
      await mainLoop(providers, rli);
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
 