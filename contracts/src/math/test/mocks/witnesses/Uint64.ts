import type { Witnesses } from '../../../../../artifacts/math/test/mocks/contracts/Uint64.mock/contract/index.d.ts';
import { sqrtBigint } from '../../../utils/sqrtBigint.js';

/**
 * @description Represents the private state of the Uint64 module.
 * @remarks No persistent state is needed beyond what's computed on-demand, so this is minimal.
 */
export type Uint64PrivateState = Record<string, never>;

/**
 * @description Factory function creating witness implementations for Math module operations.
 */
export const Uint64Witnesses = (): Witnesses<Uint64PrivateState> => ({
  wit_sqrtU64Locally(context, radicand) {
    const root = sqrtBigint(radicand);
    return [context.privateState, root];
  },

  wit_divU64Locally(context, dividend, divisor) {
    const quotient = dividend / divisor;
    const remainder = dividend % divisor;
    return [
      context.privateState,
      {
        quotient,
        remainder,
      },
    ];
  },
});
