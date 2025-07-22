import type { WitnessContext } from '@midnight-ntwrk/compact-runtime';
import type { DivResultU64 } from '../artifacts/Index/contract/index.cjs';
import type { Ledger } from '../artifacts/Uint64/contract/index.cjs';
import type { EmptyState } from '../types/state';
import { sqrtBigint } from '../utils/sqrtBigint';
import type { IUint64Witnesses } from './interfaces';

/**
 * @description Represents the private state of the MathU64 module.
 * @remarks No persistent state is needed beyond what’s computed on-demand, so this is minimal.
 */
export type Uint64ContractPrivateState = EmptyState;

/**
 * @description Utility object for managing the private state of the Math module.
 */
export const Uint64ContractPrivateState = {
  /**
   * @description Generates a new private state.
   * @returns A fresh MathContractPrivateState instance (empty for now).
   */
  generate: (): Uint64ContractPrivateState => {
    return {};
  },
};

/**
 * @description Factory function creating witness implementations for Math module operations.
 * @returns An object implementing the IMathWitnesses interface for MathContractPrivateState.
 */
export const Uint64Witnesses =
  (): IUint64Witnesses<Uint64ContractPrivateState> => ({
    /**
     * @description Computes the square root of a Uint<64> value off-chain.
     * @param context - The witness context containing ledger and private state.
     * @param radicand - The number to compute the square root of.
     * @returns A tuple of the unchanged private state and the square root as a bigint.
     */
    sqrtU64Locally(
      context: WitnessContext<Ledger, Uint64ContractPrivateState>,
      radicand: bigint,
    ): [Uint64ContractPrivateState, bigint] {
      // Simple square root computation using Math.sqrt, converted to bigint
      const root = sqrtBigint(radicand);
      return [context.privateState, root];
    },

    /**
     * @description Computes division of two Uint<64> values off-chain.
     * @param context - The witness context containing ledger and private state.
     * @param dividend - The number to divide.
     * @param divisor - The number to divide by.
     * @returns A tuple of the unchanged private state and a DivResultU64 with quotient and remainder.
     */
    divU64Locally(
      context: WitnessContext<Ledger, Uint64ContractPrivateState>,
      dividend: bigint,
      divisor: bigint,
    ): [Uint64ContractPrivateState, DivResultU64] {
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
