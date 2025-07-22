import type { WitnessContext } from '@midnight-ntwrk/compact-runtime';
import type {
  DivResultU128,
  U128,
} from '../artifacts/Lunarswap/contract/index.cjs';
import type { Ledger } from '../artifacts/Lunarswap/contract/index.cjs';
import type { EmptyState } from '../types/state';
import { sqrtBigint } from '../utils/sqrtBigint';
import type { ILunarswapWitnesses } from './interfaces';

/**
 * @description Represents the private state of the MathU128 module.
 * @remarks No persistent state is needed beyond what's computed on-demand, so this is minimal.
 */
export type LunarswapPrivateState = EmptyState;

/**
 * @description Utility object for managing the private state of the MathU128 module.
 */
export const LunarswapPrivateState = {
  /**
   * @description Generates a new private state.
   * @returns A fresh MathU128ContractPrivateState instance (empty for now).
   */
  generate: (): LunarswapPrivateState => {
    return {};
  },
};

/**
 * @description Factory function creating witness implementations for MathU128 module operations.
 * @returns An object implementing the IMathU128Witnesses interface for MathU128ContractPrivateState.
 */
export const LunarswapWitnesses = (): ILunarswapWitnesses<
  Ledger,
  LunarswapPrivateState
> => ({
  /**
   * @description Computes the square root of a U128 value off-chain.
   * @param context - The witness context containing ledger and private state.
   * @param radicand - The U128 value to compute the square root of.
   * @returns A tuple of the unchanged private state and the square root as a bigint.
   */
  sqrtU128Locally(
    context: WitnessContext<Ledger, LunarswapPrivateState>,
    radicand: U128,
  ): [LunarswapPrivateState, bigint] {
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
    context: WitnessContext<Ledger, LunarswapPrivateState>,
    a: U128,
    b: U128,
  ): [LunarswapPrivateState, DivResultU128] {
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
    context: WitnessContext<Ledger, LunarswapPrivateState>,
    a: bigint,
    b: bigint,
  ): [LunarswapPrivateState, DivResultU128] {
    return this.divU128Locally(
      context,
      { low: a, high: 0n },
      { low: b, high: 0n },
    );
  },

  /**
   * @description Computes division of two Uint<254> values off-chain.
   * @param context - The witness context containing ledger and private state.
   * @param a - The dividend.
   * @param b - The divisor.
   * @returns A tuple of the unchanged private state and a struct with U256 quotient and remainder.
   */
  divUint254Locally(
    context: WitnessContext<Ledger, LunarswapPrivateState>,
    a: bigint,
    b: bigint,
  ): [
    LunarswapPrivateState,
    {
      quotient: {
        low: { low: bigint; high: bigint };
        high: { low: bigint; high: bigint };
      };
      remainder: {
        low: { low: bigint; high: bigint };
        high: { low: bigint; high: bigint };
      };
    },
  ] {
    const quotient = a / b;
    const remainder = a % b;

    // Convert to U256 struct format
    const quotientLow = quotient & ((1n << 128n) - 1n);
    const quotientHigh = quotient >> 128n;
    const remainderLow = remainder & ((1n << 128n) - 1n);
    const remainderHigh = remainder >> 128n;

    return [
      context.privateState,
      {
        quotient: {
          low: {
            low: quotientLow & ((1n << 64n) - 1n),
            high: quotientLow >> 64n,
          },
          high: {
            low: quotientHigh & ((1n << 64n) - 1n),
            high: quotientHigh >> 64n,
          },
        },
        remainder: {
          low: {
            low: remainderLow & ((1n << 64n) - 1n),
            high: remainderLow >> 64n,
          },
          high: {
            low: remainderHigh & ((1n << 64n) - 1n),
            high: remainderHigh >> 64n,
          },
        },
      },
    ];
  },
});
