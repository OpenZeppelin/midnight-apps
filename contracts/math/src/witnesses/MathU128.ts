import type { WitnessContext } from '@midnight-ntwrk/compact-runtime';
import type { DivResultU128 } from '../artifacts/Index/contract/index.cjs';
import type { Ledger } from '../artifacts/MathU128/contract/index.cjs';
import type { EmptyState } from '../types/state';
import { sqrtBigint } from '../utils/sqrtBigint';
import type { IMathU128Witnesses } from './interfaces';

/**
 * @description Represents the private state of the MathU128 module.
 * @remarks No persistent state is needed beyond what’s computed on-demand, so this is minimal.
 */
export type MathU128ContractPrivateState = EmptyState;

/**
 * @description Utility object for managing the private state of the MathU128 module.
 */
export const MathU128ContractPrivateState = {
  /**
   * @description Generates a new private state.
   * @returns A fresh MathU128ContractPrivateState instance (empty for now).
   */
  generate: (): MathU128ContractPrivateState => {
    return {};
  },
};

/**
 * @description Factory function creating witness implementations for MathU128 module operations.
 * @returns An object implementing the IMathU128Witnesses interface for MathU128ContractPrivateState.
 */
export const MathU128Witnesses = (): IMathU128Witnesses<
  Ledger,
  MathU128ContractPrivateState
> => ({
  /**
   * @description Computes the square root of a Uint<128> value off-chain.
   * @param context - The witness context containing ledger and private state.
   * @param radicand - The number to compute the square root of.
   * @returns A tuple of the unchanged private state and the square root as a bigint.
   */
  sqrtU128Locally(
    context: WitnessContext<Ledger, MathU128ContractPrivateState>,
    radicand: bigint,
  ): [MathU128ContractPrivateState, bigint] {
    // Compute square root using sqrtBigint, ensuring result fits in Uint<64>
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
  divU128Locally(
    context: WitnessContext<Ledger, MathU128ContractPrivateState>,
    dividend: bigint,
    divisor: bigint,
  ): [MathU128ContractPrivateState, DivResultU128] {
    const quotient = dividend / divisor; // Integer division
    const remainder = dividend - quotient * divisor;
    return [
      context.privateState,
      {
        quotient: {
          low: quotient & BigInt('0xFFFFFFFFFFFFFFFF'), // Lower 64 bits
          high: quotient >> BigInt(64), // Upper 64 bits
        },
        remainder: {
          low: remainder & BigInt('0xFFFFFFFFFFFFFFFF'), // Lower 64 bits
          high: remainder >> BigInt(64), // Upper 64 bits
        },
      },
    ];
  },
});
