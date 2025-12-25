import type { Witnesses } from '../../../../../artifacts/math/test/mocks/contracts/Uint64.mock/contract/index.js';
import { wit_divU64 } from '../../../witnesses/wit_divU64.js';
import { wit_sqrtU64 } from '../../../witnesses/wit_sqrtU64.js';

/**
 * @description Represents the private state of the Uint64 module.
 * @remarks No persistent state is needed beyond what's computed on-demand, so this is minimal.
 */
export type Uint64PrivateState = Record<string, never>;

/**
 * @description Factory function creating witness implementations for Math module operations.
 */
export const Uint64Witnesses = (): Witnesses<Uint64PrivateState> => ({
  wit_sqrtU64(_context, radicand) {
    return [{}, wit_sqrtU64(radicand)];
  },

  wit_divU64(_context, dividend, divisor) {
    return [{}, wit_divU64(dividend, divisor)];
  },
});
