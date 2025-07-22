import type { WitnessContext } from '@midnight-ntwrk/compact-runtime';
import type {
  DivResultU128,
  U128,
} from '../artifacts/Index/contract/index.cjs';
import type { Ledger } from '../artifacts/Uint128/contract/index.cjs';
import type { EmptyState } from '../types/state';
import { sqrtBigint } from '../utils/sqrtBigint';
import type { IUint128Witnesses } from './interfaces';

/**
 * @description Represents the private state of the MathU128 module.
 * @remarks No persistent state is needed beyond what's computed on-demand, so this is minimal.
 */
export type Uint128ContractPrivateState = EmptyState;

/**
 * @description Utility object for managing the private state of the MathU128 module.
 */
export const Uint128ContractPrivateState = {
  /**
   * @description Generates a new private state.
   * @returns A fresh MathU128ContractPrivateState instance (empty for now).
   */
  generate: (): Uint128ContractPrivateState => {
    return {};
  },
};

/**
 * @description Factory function creating witness implementations for MathU128 module operations.
 * @returns An object implementing the IMathU128Witnesses interface for MathU128ContractPrivateState.
 */
export const Uint128Witnesses = (): IUint128Witnesses<
  Ledger,
  Uint128ContractPrivateState
> => ({
  /**
   * @description Computes the square root of a U128 value off-chain.
   * @param context - The witness context containing ledger and private state.
   * @param radicand - The U128 value to compute the square root of.
   * @returns A tuple of the unchanged private state and the square root as a bigint.
   */
  sqrtU128Locally(
    context: WitnessContext<Ledger, Uint128ContractPrivateState>,
    radicand: U128,
  ): [Uint128ContractPrivateState, bigint] {
    // Convert U128 to bigint
    const radicandBigInt =
      (BigInt(radicand.high) << 64n) + BigInt(radicand.low);

    // Compute square root using sqrtBigint, ensuring result fits in Uint<64>
    const root = sqrtBigint(radicandBigInt);
    return [context.privateState, root];
  },

  /**
   * @description Computes division of two Uint<128> values off-chain.
   * @param context - The witness context containing ledger and private state.
   * @param dividend - The number to divide.
   * @param divisor - The number to divide by.
   * @returns A tuple of the unchanged private state and a DivResultU64 with quotient and remainder.
   */
  divU128Locally(
    context: WitnessContext<Ledger, Uint128ContractPrivateState>,
    a: U128,
    b: U128,
  ): [Uint128ContractPrivateState, DivResultU128] {
    const aValue = (BigInt(a.high) << 64n) + BigInt(a.low);
    const bValue = (BigInt(b.high) << 64n) + BigInt(b.low);
    const quotient = aValue / bValue;
    const remainder = aValue - quotient * bValue;
    return [
      context.privateState,
      {
        quotient: {
          low: quotient & BigInt('0xFFFFFFFFFFFFFFFF'),
          high: quotient >> BigInt(64),
        },
        remainder: {
          low: remainder & BigInt('0xFFFFFFFFFFFFFFFF'),
          high: remainder >> BigInt(64),
        },
      },
    ];
  },

  /**
   * @description Computes division of two Uint<128> values off-chain.
   * @param context - The witness context containing ledger and private state.
   * @param dividend - The number to divide.
   * @param divisor - The number to divide by.
   * @returns A tuple of the unchanged private state and a DivResultU64 with quotient and remainder.
   */
  divUint128Locally(
    context: WitnessContext<Ledger, Uint128ContractPrivateState>,
    a: bigint,
    b: bigint,
  ): [Uint128ContractPrivateState, DivResultU128] {
    return this.divU128Locally(
      context,
      { low: a, high: 0n },
      { low: b, high: 0n },
    );
  },
});
