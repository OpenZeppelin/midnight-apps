import type { Logger } from 'pino';
import type { Lunarswap } from '@midnight-dapps/lunarswap-api';
import type { Either, ZswapCoinPublicKey, CoinInfo, ContractAddress } from '@midnight-dapps/compact-std';

// Helper function to create CoinInfo from user input
export const createCoinInfo = (color: string, value: bigint): CoinInfo => ({
  color: new Uint8Array(Buffer.from(color, 'hex')),
  value,
  nonce: new Uint8Array(32),
});

// Helper function to create Either for recipient
export const createRecipient = (address: string): Either<ZswapCoinPublicKey, ContractAddress> => ({
  is_left: true,
  left: { bytes: new Uint8Array(Buffer.from(address, 'hex')) },
  right: { bytes: new Uint8Array(32) },
});

export const addLiquidity = async (
  lunarswap: Lunarswap, 
  tokenA: CoinInfo, 
  tokenB: CoinInfo, 
  amountAMin: bigint, 
  amountBMin: bigint, 
  to: Either<ZswapCoinPublicKey, ContractAddress>, 
  logger: Logger
): Promise<void> => {
  logger.info('Adding liquidity...');
  await lunarswap.addLiquidity(tokenA, tokenB, amountAMin, amountBMin, to);
  logger.info('Liquidity added successfully!');
};

export const removeLiquidity = async (
  lunarswap: Lunarswap, 
  tokenA: CoinInfo, 
  tokenB: CoinInfo, 
  liquidity: CoinInfo, 
  amountAMin: bigint, 
  amountBMin: bigint, 
  to: Either<ZswapCoinPublicKey, ContractAddress>, 
  logger: Logger
): Promise<void> => {
  logger.info('Removing liquidity...');
  await lunarswap.removeLiquidity(tokenA, tokenB, liquidity, amountAMin, amountBMin, to);
  logger.info('Liquidity removed successfully!');
};

export const swapExactTokensForTokens = async (
  lunarswap: Lunarswap, 
  tokenIn: CoinInfo, 
  tokenOut: CoinInfo, 
  amountIn: bigint, 
  amountOutMin: bigint, 
  to: Either<ZswapCoinPublicKey, ContractAddress>, 
  logger: Logger
): Promise<void> => {
  logger.info('Swapping exact tokens for tokens...');
  await lunarswap.swapExactTokensForTokens(tokenIn, tokenOut, amountIn, amountOutMin, to);
  logger.info('Swap completed successfully!');
};

export const swapTokensForExactTokens = async (
  lunarswap: Lunarswap, 
  tokenIn: CoinInfo, 
  tokenOut: CoinInfo, 
  amountOut: bigint, 
  amountInMax: bigint, 
  to: Either<ZswapCoinPublicKey, ContractAddress>, 
  logger: Logger
): Promise<void> => {
  logger.info('Swapping tokens for exact tokens...');
  await lunarswap.swapTokensForExactTokens(tokenIn, tokenOut, amountOut, amountInMax, to);
  logger.info('Swap completed successfully!');
}; 