import type { WitnessContext } from '@midnight-ntwrk/compact-runtime';
import type { DivResultU64 } from '../../../artifacts/math/Index/contract/index.d.cts';
import type { Ledger } from '../../../artifacts/math/test/Uint64.mock/contract/index.cjs';
import type { EmptyState } from '../types/state.js';
import { sqrtBigint } from '../utils/sqrtBigint.js';
import type { IUint64Witnesses } from './interfaces.js';

/**
 * @description Represents the private state of the Uint64 module.
 * @remarks No persistent state is needed beyond what’s computed on-demand, so this is minimal.
 */
export type Uint64PrivateState = EmptyState;

/**
 * @description Utility object for managing the private state of the Uint64 module.
 */
export const Uint64PrivateState = {
  /**
   * @description Generates a new private state.
   * @returns A fresh Uint64PrivateState instance (empty for now).
   */
  generate: (): Uint64PrivateState => {
    return {};
  },
};

/**
 * @description Factory function creating witness implementations for Math module operations.
 * @returns An object implementing the IUint64Witnesses interface for Uint64PrivateState.
 */
export const Uint64Witnesses = (): IUint64Witnesses<Uint64PrivateState> => ({
  /**
   * @description Computes the square root of a Uint<64> value off-chain.
   * @param context - The witness context containing ledger and private state.
   * @param radicand - The number to compute the square root of.
   * @returns A tuple of the unchanged private state and the square root as a bigint.
   */
  sqrtU64Locally(
    context: WitnessContext<Ledger, Uint64PrivateState>,
    radicand: bigint,
  ): [Uint64PrivateState, bigint] {
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
    context: WitnessContext<Ledger, Uint64PrivateState>,
    dividend: bigint,
    divisor: bigint,
  ): [Uint64PrivateState, DivResultU64] {
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
