import type { Witnesses } from '@src/artifacts/math/test/mocks/contracts/Uint128.mock/contract/index.js';
import { wit_divU128 } from '@src/math/witnesses/wit_divU128.js';
import { wit_divUint128 } from '@src/math/witnesses/wit_divUint128.js';
import { wit_sqrtU128 } from '@src/math/witnesses/wit_sqrtU128.js';

/**
 * @description Represents the private state of the Uint128 module.
 * @remarks No persistent state is needed beyond what's computed on-demand, so this is minimal.
 */
export type Uint128PrivateState = Record<string, never>;

/**
 * @description Utility object for managing the private state of the Uint128 module.
 */
export const Uint128PrivateState = {
  /**
   * @description Generates a new private state.
   * @returns A fresh Uint128PrivateState instance (empty for now).
   */
  generate: (): Uint128PrivateState => {
    return {};
  },
};

/**
 * @description Factory function creating witness implementations for Uint128 module operations.
 */
export const Uint128Witnesses = (): Witnesses<Uint128PrivateState> => ({
  wit_sqrtU128(_context, radicand) {
    return [{}, wit_sqrtU128(radicand)];
  },

  wit_divU128(_context, a, b) {
    return [{}, wit_divU128(a, b)];
  },

  wit_divUint128(_context, a, b) {
    return [{}, wit_divUint128(a, b)];
  },
});
