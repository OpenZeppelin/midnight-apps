import type { Witnesses } from '@src/artifacts/lunarswap/Lunarswap/contract/index.js';
import { wit_divU128 } from '@src/math/witnesses/wit_divU128.js';
import { wit_divUint128 } from '@src/math/witnesses/wit_divUint128.js';
import { wit_sqrtU128 } from '@src/math/witnesses/wit_sqrtU128.js';
import { wit_unpackBytes } from '@src/math/witnesses/wit_unpackBytes.js';

/**
 * @description Represents the private state of the Lunarswap module.
 * @remarks No persistent state is needed beyond what's computed on-demand, so this is minimal.
 */
export type LunarswapPrivateState = Record<string, never>;

/**
 * @description Utility object for managing the private state of the Lunarswap module.
 */
export const LunarswapPrivateState = {
  /**
   * @description Generates a new private state.
   * @returns A fresh LunarswapPrivateState instance (empty for now).
   */
  generate: (): LunarswapPrivateState => {
    return {};
  },
};

/**
 * @description Factory function creating witness implementations for Lunarswap module operations.
 * @returns An object implementing the Witnesses interface for LunarswapPrivateState.
 */
export const LunarswapWitnesses = (): Witnesses<LunarswapPrivateState> => ({
  wit_sqrtU128(_context, radicand) {
    return [{}, wit_sqrtU128(radicand)];
  },

  wit_divU128(_context, a, b) {
    return [{}, wit_divU128(a, b)];
  },

  wit_divUint128(_context, a, b) {
    return [{}, wit_divUint128(a, b)];
  },

  wit_unpackBytes(_context, bytes_0) {
    return [{}, wit_unpackBytes(bytes_0)];
  },
});
