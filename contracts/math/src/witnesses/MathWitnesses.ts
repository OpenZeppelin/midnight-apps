import type { WitnessContext } from '@midnight-ntwrk/compact-runtime';
import type {
  Ledger,
  Math_DivResult,
} from '../artifacts/Index/contract/index.cjs'; // Adjust path to your generated artifacts
import type { EmptyState } from '../types/state';
import { sqrtBigint } from '../utils/sqrtBigint';
import type { IMathWitnesses } from './interface';

/**
 * @description Represents the private state of the Math module.
 * @remarks No persistent state is needed beyond what’s computed on-demand, so this is minimal.
 */
export type MathContractPrivateState = EmptyState;

/**
 * @description Utility object for managing the private state of the Math module.
 */
export const MathContractPrivateState = {
  /**
   * @description Generates a new private state.
   * @returns A fresh MathContractPrivateState instance (empty for now).
   */
  generate: (): MathContractPrivateState => {
    return {};
  },
};

/**
 * @description Factory function creating witness implementations for Math module operations.
 * @returns An object implementing the IMathWitnesses interface for MathContractPrivateState.
 */
export const MathWitnesses = (): IMathWitnesses<MathContractPrivateState> => ({
  /**
   * @description Computes the square root of a Uint<128> value off-chain.
   * @param context - The witness context containing ledger and private state.
   * @param radicand - The number to compute the square root of.
   * @returns A tuple of the unchanged private state and the square root as a bigint.
   */
  sqrtLocally(
    context: WitnessContext<Ledger, MathContractPrivateState>,
    radicand: bigint,
  ): [MathContractPrivateState, bigint] {
    // Simple square root computation using Math.sqrt, converted to bigint
    const root = sqrtBigint(radicand);
    return [context.privateState, root];
  },

  /**
   * @description Computes division of two Uint<128> values off-chain.
   * @param context - The witness context containing ledger and private state.
   * @param dividend - The number to divide.
   * @param divisor - The number to divide by.
   * @returns A tuple of the unchanged private state and a DivResult with quotient and remainder.
   */
  divLocally(
    context: WitnessContext<Ledger, MathContractPrivateState>,
    dividend: bigint,
    divisor: bigint,
  ): [MathContractPrivateState, Math_DivResult] {
    const quotient = dividend / divisor; // Integer division
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
