// SPDX-License-Identifier: MIT
// LunarSwap CLI main loop and handlers

import type { Interface } from 'node:readline/promises';
import type { ShieldedCoinInfo } from '@openzeppelin/midnight-apps-contracts/dist/artifacts/lunarswap/Lunarswap/contract';
import type {
  Lunarswap,
  LunarswapProviders,
} from '@openzeppelin/midnight-apps-lunarswap-api';
import type { Logger } from 'pino';
import { deployContract, joinContract } from './api/contract.js';
import {
  checkPairExists,
  getAllPairsLength,
  getLpTokenTotalSupplyInfo,
  getPairInfo,
  getPairReservesInfo,
} from './api/pair-info.js';
import {
  addLiquidity,
  createCoinInfo,
  createRecipient,
  removeLiquidity,
  swapExactTokensForTokens,
  swapTokensForExactTokens,
} from './api/swap.js';

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
5. Check if pair exists
6. Get total number of pairs
7. Get pair information
8. Get pair reserves
9. Get pair identity
10. Get LP token total supply
11. Exit

Which would you like to do? `;

const CONTRACT_ADDRESS_QUESTION =
  'Enter the deployed LunarSwap contract address: ';

const deployOrJoin = async (
  providers: LunarswapProviders,
  zkConfigPath: string,
  rli: Interface,
  logger: Logger,
): Promise<Lunarswap | null> => {
  while (true) {
    const choice = await rli.question(DEPLOY_OR_JOIN_QUESTION);
    switch (choice) {
      case '1':
        return await deployContract(providers, zkConfigPath, logger);
      case '2': {
        const contractAddress = await rli.question(CONTRACT_ADDRESS_QUESTION);
        return await joinContract(
          providers,
          contractAddress,
          zkConfigPath,
          logger,
        );
      }
      case '3':
        logger.info('Exiting...');
        return null;
      default:
        logger.error(`Invalid choice: ${choice}`);
    }
  }
};

const handleAddLiquidity = async (
  lunarswap: Lunarswap,
  rli: Interface,
  logger: Logger,
): Promise<void> => {
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

  await addLiquidity(
    lunarswap,
    tokenA,
    tokenB,
    amountAMin,
    amountBMin,
    to,
    logger,
  );
};

const handleRemoveLiquidity = async (
  lunarswap: Lunarswap,
  rli: Interface,
  logger: Logger,
): Promise<void> => {
  const tokenAColor = await rli.question('Enter token A color (hex): ');
  const tokenBColor = await rli.question('Enter token B color (hex): ');
  const liquidityColor = await rli.question(
    'Enter liquidity token color (hex): ',
  );
  const liquidityValue = BigInt(await rli.question('Enter liquidity amount: '));
  const amountAMin = BigInt(await rli.question('Enter minimum amount A: '));
  const amountBMin = BigInt(await rli.question('Enter minimum amount B: '));
  const recipient = await rli.question('Enter recipient address (hex): ');

  const tokenA = createCoinInfo(tokenAColor, 0n);
  const tokenB = createCoinInfo(tokenBColor, 0n);
  const liquidity = createCoinInfo(liquidityColor, liquidityValue);
  const to = createRecipient(recipient);

  await removeLiquidity(
    lunarswap,
    tokenA,
    tokenB,
    liquidity,
    amountAMin,
    amountBMin,
    to,
    logger,
  );
};

const handleSwapExactTokensForTokens = async (
  lunarswap: Lunarswap,
  rli: Interface,
  logger: Logger,
): Promise<void> => {
  const tokenInColor = await rli.question('Enter input token color (hex): ');
  const tokenInValue = BigInt(await rli.question('Enter input token amount: '));
  const tokenOutColor = await rli.question('Enter output token color (hex): ');
  const amountOutMin = BigInt(
    await rli.question('Enter minimum output amount: '),
  );
  const recipient = await rli.question('Enter recipient address (hex): ');

  const tokenIn = createCoinInfo(tokenInColor, tokenInValue);
  const tokenOut = createCoinInfo(tokenOutColor, 0n);
  const to = createRecipient(recipient);

  await swapExactTokensForTokens(
    lunarswap,
    tokenIn,
    tokenOut,
    tokenInValue,
    amountOutMin,
    to,
    logger,
  );
};

const handleSwapTokensForExactTokens = async (
  lunarswap: Lunarswap,
  rli: Interface,
  logger: Logger,
): Promise<void> => {
  const tokenInColor = await rli.question('Enter input token color (hex): ');
  const tokenInValue = BigInt(await rli.question('Enter input token amount: '));
  const tokenOutColor = await rli.question('Enter output token color (hex): ');
  const amountOut = BigInt(await rli.question('Enter exact output amount: '));
  const amountInMax = BigInt(
    await rli.question('Enter maximum input amount: '),
  );
  const recipient = await rli.question('Enter recipient address (hex): ');

  const tokenIn = createCoinInfo(tokenInColor, tokenInValue);
  const tokenOut = createCoinInfo(tokenOutColor, 0n);
  const to = createRecipient(recipient);

  await swapTokensForExactTokens(
    lunarswap,
    tokenIn,
    tokenOut,
    amountOut,
    amountInMax,
    to,
    logger,
  );
};

const getTokenInput = async (
  rli: Interface,
  tokenLabel: string,
): Promise<ShieldedCoinInfo> => {
  const color = await rli.question(`Enter ${tokenLabel} color (hex): `);
  return createCoinInfo(color, 0n);
};

const handleCheckPairExists = async (
  lunarswap: Lunarswap,
  rli: Interface,
  logger: Logger,
): Promise<void> => {
  const tokenA = await getTokenInput(rli, 'Token A');
  const tokenB = await getTokenInput(rli, 'Token B');
  await checkPairExists(lunarswap, tokenA, tokenB, logger);
};

const handleGetAllPairsLength = async (
  lunarswap: Lunarswap,
  logger: Logger,
): Promise<void> => {
  await getAllPairsLength(lunarswap, logger);
};

const handleGetPairInfo = async (
  lunarswap: Lunarswap,
  rli: Interface,
  logger: Logger,
): Promise<void> => {
  const tokenA = await getTokenInput(rli, 'Token A');
  const tokenB = await getTokenInput(rli, 'Token B');
  await getPairInfo(lunarswap, tokenA, tokenB, logger);
};

const handleGetPairReserves = async (
  lunarswap: Lunarswap,
  rli: Interface,
  logger: Logger,
): Promise<void> => {
  const tokenA = await getTokenInput(rli, 'Token A');
  const tokenB = await getTokenInput(rli, 'Token B');
  await getPairReservesInfo(lunarswap, tokenA, tokenB, logger);
};

// const handleGetPairIdentity = async (
//   lunarswap: Lunarswap,
//   rli: Interface,
//   logger: Logger,
// ): Promise<void> => {
//   const tokenA = await getTokenInput(rli, 'Token A');
//   const tokenB = await getTokenInput(rli, 'Token B');
//   await getPairIdentityInfo(lunarswap, tokenA, tokenB, logger);
// };

const handleGetLpTokenTotalSupply = async (
  lunarswap: Lunarswap,
  rli: Interface,
  logger: Logger,
): Promise<void> => {
  const tokenA = await getTokenInput(rli, 'Token A');
  const tokenB = await getTokenInput(rli, 'Token B');
  await getLpTokenTotalSupplyInfo(lunarswap, tokenA, tokenB, logger);
};

export const mainLoop = async (
  providers: LunarswapProviders,
  zkConfigPath: string,
  rli: Interface,
  logger: Logger,
): Promise<void> => {
  const lunarswap = await deployOrJoin(providers, zkConfigPath, rli, logger);
  if (lunarswap === null) {
    return;
  }
  while (true) {
    const choice = await rli.question(MAIN_LOOP_QUESTION);
    switch (choice) {
      case '1':
        await handleAddLiquidity(lunarswap, rli, logger);
        break;
      case '2':
        await handleRemoveLiquidity(lunarswap, rli, logger);
        break;
      case '3':
        await handleSwapExactTokensForTokens(lunarswap, rli, logger);
        break;
      case '4':
        await handleSwapTokensForExactTokens(lunarswap, rli, logger);
        break;
      case '5':
        await handleCheckPairExists(lunarswap, rli, logger);
        break;
      case '6':
        await handleGetAllPairsLength(lunarswap, logger);
        break;
      case '7':
        await handleGetPairInfo(lunarswap, rli, logger);
        break;
      case '8':
        await handleGetPairReserves(lunarswap, rli, logger);
        break;
      case '9':
        //await handleGetPairIdentity(lunarswap, rli, logger);
        break;
      case '10':
        await handleGetLpTokenTotalSupply(lunarswap, rli, logger);
        break;
      case '11':
        logger.info('Exiting...');
        return;
      default:
        logger.error(`Invalid choice: ${choice}`);
    }
  }
};
