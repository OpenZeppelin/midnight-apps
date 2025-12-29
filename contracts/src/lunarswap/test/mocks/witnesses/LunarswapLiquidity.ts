import type { Witnesses } from '@artifacts/lunarswap/test/mocks/contracts/LunarswapLiquidity.mock/contract/index.js';
import { wit_divUint128 } from '@src/math/witnesses/wit_divUint128.js';

/**
 * @description Represents the private state of the LunarswapLiquidity module.
 * @remarks No persistent state is needed beyond what's computed on-demand, so this is minimal.
 */
export type LunarswapLiquidityPrivateState = Record<string, never>;

/**
 * @description Utility object for managing the private state of the LunarswapLiquidity module.
 */
export const LunarswapLiquidityPrivateState = {
  /**
   * @description Generates a new private state.
   * @returns A fresh LunarswapLiquidityPrivateState instance (empty for now).
   */
  generate: (): LunarswapLiquidityPrivateState => {
    return {};
  },
};

/**
 * @description Factory function creating witness implementations for LunarswapLiquidity module operations.
 * @remarks Uses math library witnesses for division operations used in LP token calculations.
 */
export const LunarswapLiquidityWitnesses =
  (): Witnesses<LunarswapLiquidityPrivateState> => ({
    wit_divUint128(_context, a, b) {
      return [{}, wit_divUint128(a, b)];
    },
  });
