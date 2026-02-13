import type { ShieldedCoinInfo } from '@openzeppelin/midnight-apps-contracts/dist/artifacts/lunarswap/Lunarswap/contract';
import type { Lunarswap } from '@openzeppelin/midnight-apps-lunarswap-api';
import type { Logger } from 'pino';

export const checkPairExists = async (
  lunarswap: Lunarswap,
  tokenA: ShieldedCoinInfo,
  tokenB: ShieldedCoinInfo,
  logger: Logger,
): Promise<void> => {
  logger.info('Checking if pair exists...');
  try {
    const exists = await lunarswap.isPairExists(tokenA, tokenB);
    logger.info('');
    logger.info('🔍 Pair Information:');
    logger.info(`   Token A: ${Buffer.from(tokenA.color).toString('hex')}`);
    logger.info(`   Token B: ${Buffer.from(tokenB.color).toString('hex')}`);
    logger.info(`   Pair Exists: ${exists ? '✅ Yes' : '❌ No'}`);
    logger.info('');
  } catch (error) {
    logger.error(
      { error: error instanceof Error ? error.message : error },
      '❌ Failed to check pair existence',
    );
  }
};

export const getAllPairsLength = async (
  lunarswap: Lunarswap,
  logger: Logger,
): Promise<void> => {
  logger.info('Getting total number of pairs...');
  try {
    const pairCount = await lunarswap.getAllPairLength();
    logger.info('');
    logger.info('📊 Pool Statistics:');
    logger.info(`   Total Pairs: ${pairCount}`);
    logger.info('');
  } catch (error) {
    logger.error(
      { error: error instanceof Error ? error.message : error },
      '❌ Failed to get pair count',
    );
  }
};

export const getPairInfo = async (
  lunarswap: Lunarswap,
  tokenA: ShieldedCoinInfo,
  tokenB: ShieldedCoinInfo,
  logger: Logger,
): Promise<void> => {
  logger.info('Getting pair information...');
  try {
    const pair = await lunarswap.getPair(tokenA, tokenB);
    logger.info('');
    logger.info('🔗 Pair Details:');
    logger.info(`   Token A: ${Buffer.from(tokenA.color).toString('hex')}`);
    logger.info(`   Token B: ${Buffer.from(tokenB.color).toString('hex')}`);
    logger.info(`   Pair Info: ${JSON.stringify(pair, null, 2)}`);
    logger.info('');
  } catch (error) {
    logger.error(
      { error: error instanceof Error ? error.message : error },
      '❌ Failed to get pair info',
    );
  }
};

export const getPairReservesInfo = async (
  lunarswap: Lunarswap,
  tokenA: ShieldedCoinInfo,
  tokenB: ShieldedCoinInfo,
  logger: Logger,
): Promise<void> => {
  logger.info('Getting pair reserves...');
  try {
    const [reserveA, reserveB] = await lunarswap.getPairReserves(
      tokenA,
      tokenB,
    );
    logger.info('');
    logger.info('💰 Pair Reserves:');
    logger.info(`   Token A: ${Buffer.from(tokenA.color).toString('hex')}`);
    logger.info(`   Token B: ${Buffer.from(tokenB.color).toString('hex')}`);
    logger.info(`   Reserve A: ${reserveA}`);
    logger.info(`   Reserve B: ${reserveB}`);
    logger.info('');
  } catch (error) {
    logger.error(
      { error: error instanceof Error ? error.message : error },
      '❌ Failed to get pair reserves',
    );
  }
};

export const getPairIdentityInfo = async (
  lunarswap: Lunarswap,
  tokenA: ShieldedCoinInfo,
  tokenB: ShieldedCoinInfo,
  logger: Logger,
): Promise<void> => {
  logger.info('Getting pair identity...');
  try {
    const identity = await lunarswap.getPairId(tokenA, tokenB);
    logger.info('');
    logger.info('🆔 Pair Identity:');
    logger.info(`   Token A: ${Buffer.from(tokenA.color).toString('hex')}`);
    logger.info(`   Token B: ${Buffer.from(tokenB.color).toString('hex')}`);
    logger.info(`   Identity: ${Buffer.from(identity).toString('hex')}`);
    logger.info('');
  } catch (error) {
    logger.error(
      { error: error instanceof Error ? error.message : error },
      '❌ Failed to get pair identity',
    );
  }
};

// export const getLpTokenInfo = async (
//   lunarswap: Lunarswap,
//   logger: Logger,
// ): Promise<void> => {
//   logger.info('Getting LP token information...');
//   try {

//     logger.info('');
//     logger.info('🪙 LP Token Information:');
//     logger.info(`   Name: ${name}`);
//     logger.info(`   Symbol: ${symbol}`);
//     logger.info(`   Decimals: ${decimals}`);
//     logger.info(`   Type: ${Buffer.from(type).toString('hex')}`);
//     logger.info('');
//   } catch (error) {
//     logger.error('❌ Failed to get LP token info:', error instanceof Error ? error.message : error);
//   }
// };

export const getLpTokenTotalSupplyInfo = async (
  lunarswap: Lunarswap,
  tokenA: ShieldedCoinInfo,
  tokenB: ShieldedCoinInfo,
  logger: Logger,
): Promise<void> => {
  logger.info('Getting LP token total supply...');
  try {
    const totalSupply = await lunarswap.getLpTokenTotalSupply(tokenA, tokenB);
    logger.info('');
    logger.info('📈 LP Token Supply:');
    logger.info(`   Token A: ${Buffer.from(tokenA.color).toString('hex')}`);
    logger.info(`   Token B: ${Buffer.from(tokenB.color).toString('hex')}`);
    logger.info(`   Total Supply: ${JSON.stringify(totalSupply, null, 2)}`);
    logger.info('');
  } catch (error) {
    logger.error(
      { error: error instanceof Error ? error.message : error },
      '❌ Failed to get LP token total supply',
    );
  }
};
