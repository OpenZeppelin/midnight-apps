import type { Witnesses } from '@artifacts/lunarswap/test/mocks/contracts/LunarswapLibrary.mock/contract/index.js';
import { wit_bytes32ToU256 } from '@src/math/witnesses/wit_bytes32ToU256.js';
import { wit_divU128 } from '@src/math/witnesses/wit_divU128.js';
import { wit_divUint128 } from '@src/math/witnesses/wit_divUint128.js';

/**
 * @description Represents the private state of the LunarswapLibrary module.
 * @remarks No persistent state is needed beyond what's computed on-demand, so this is minimal.
 */
export type LunarswapLibraryPrivateState = Record<string, never>;

/**
 * @description Utility object for managing the private state of the LunarswapLibrary module.
 */
export const LunarswapLibraryPrivateState = {
  /**
   * @description Generates a new private state.
   * @returns A fresh LunarswapLibraryPrivateState instance (empty for now).
   */
  generate: (): LunarswapLibraryPrivateState => {
    return {};
  },
};

/**
 * @description Factory function creating witness implementations for LunarswapLibrary module operations.
 * @remarks Uses math library witnesses for division operations.
 */
export const LunarswapLibraryWitnesses =
  (): Witnesses<LunarswapLibraryPrivateState> => ({
    wit_divU128(_context, a, b) {
      return [{}, wit_divU128(a, b)];
    },
    wit_bytes32ToU256(_context, bytes) {
      return [{}, wit_bytes32ToU256(bytes)];
    },
    wit_divUint128(_context, a, b) {
      return [{}, wit_divUint128(a, b)];
    },
  });
