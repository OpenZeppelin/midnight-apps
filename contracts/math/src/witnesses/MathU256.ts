import type { WitnessContext } from '@midnight-ntwrk/compact-runtime';
import type {
  DivResult,
  DivResultU256,
} from '../artifacts/Index/contract/index.cjs';
import type { Ledger } from '../artifacts/MathU256/contract/index.cjs';
import type { EmptyState } from '../types/state';
import { sqrtBigint } from '../utils/sqrtBigint';
import type { IMathU256Witnesses } from './interfaces';

/**
 * @description Represents the private state of the MathU256 module.
 * @remarks No persistent state is needed beyond what’s computed on-demand, so this is minimal.
 */
export type MathU256ContractPrivateState = EmptyState;

/**
 * @description Utility object for managing the private state of the MathU256 module.
 */
export const MathU256ContractPrivateState = {
  /**
   * @description Generates a new private state.
   * @returns A fresh MathU256ContractPrivateState instance (empty for now).
   */
  generate: (): MathU256ContractPrivateState => {
    return {};
  },
};

/**
 * @description Factory function creating witness implementations for MathU256 module operations.
 * @returns An object implementing the IMathU256Witnesses interface for MathU256ContractPrivateState.
 */
export const MathU256Witnesses = (): IMathU256Witnesses<
  Ledger,
  MathU256ContractPrivateState
> => ({
  /**
   * @description Computes the square root of a Uint<256> value off-chain.
   * @param context - The witness context containing ledger and private state.
   * @param radicand - The number to compute the square root of.
   * @returns A tuple of the unchanged private state and the square root as a bigint.
   */
  sqrtU256Locally(
    context: WitnessContext<Ledger, MathU256ContractPrivateState>,
    radicand: bigint,
  ): [MathU256ContractPrivateState, bigint] {
    // Compute square root using sqrtBigint, ensuring result fits in Uint<128>
    const root = sqrtBigint(radicand);
    return [context.privateState, root];
  },

  /**
   * @description Computes division of two Uint<256> values off-chain.
   * @param context - The witness context containing ledger and private state.
   * @param dividend - The number to divide.
   * @param divisor - The number to divide by.
   * @returns A tuple of the unchanged private state and a DivResult with quotient and remainder.
   */
  divU256Locally(
    context: WitnessContext<Ledger, MathU256ContractPrivateState>,
    dividend: bigint,
    divisor: bigint,
  ): [MathU256ContractPrivateState, DivResultU256] {
    const quotient = dividend / divisor; // Integer division
    const remainder = dividend - quotient * divisor;
    return [
      context.privateState,
      {
        quotient: {
          low: quotient & BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF'), // Lower 128 bits
          high: quotient >> BigInt(128), // Upper 128 bits
        },
        remainder: {
          low: remainder & BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF'), // Lower 128 bits
          high: remainder >> BigInt(128), // Upper 128 bits
        },
      },
    ];
  },
  /**
   * @description Computes division of two Uint<128> values off-chain.
   * @param context - The witness context containing ledger and private state.
   * @param dividend - The number to divide.
   * @param divisor - The number to divide by.
   * @returns A tuple of the unchanged private state and a DivResult with quotient and remainder.
   */
  divLocally(
    context: WitnessContext<Ledger, MathU256ContractPrivateState>,
    dividend: bigint,
    divisor: bigint,
  ): [MathU256ContractPrivateState, DivResult] {
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
