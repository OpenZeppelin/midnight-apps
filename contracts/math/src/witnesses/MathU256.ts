import type { WitnessContext } from '@midnight-ntwrk/compact-runtime';
import type {
  DivResultU128,
  DivResultU256,
  U128,
  U256,
} from '../artifacts/Index/contract/index.cjs';
import type { Ledger } from '../artifacts/MathU256/contract/index.cjs';
import type { EmptyState } from '../types/state';
import { sqrtBigint } from '../utils/sqrtBigint';
import type { IMathU256Witnesses } from './interfaces';

/**
 * @description Represents the private state of the MathU256 module.
 * @remarks No persistent state is needed beyond what's computed on-demand, so this is minimal.
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
   * @description Computes the square root of a U256 value off-chain.
   * @param context - The witness context containing ledger and private state.
   * @param radicand - The U256 value to compute the square root of.
   * @returns A tuple of the unchanged private state and the square root as a bigint (Uint<128>).
   */
  sqrtU256Locally(
    context: WitnessContext<Ledger, MathU256ContractPrivateState>,
    radicand: U256,
  ): [MathU256ContractPrivateState, bigint] {
    // Convert U256 to bigint
    const radicandBigInt =
      (BigInt(radicand.high.high) << 192n) +
      (BigInt(radicand.high.low) << 128n) +
      (BigInt(radicand.low.high) << 64n) +
      BigInt(radicand.low.low);

    // Compute square root using sqrtBigint, ensuring result fits in Uint<128>
    const root = sqrtBigint(radicandBigInt);

    return [context.privateState, root];
  },

  /**
   * @description Computes division of two U256 values off-chain.
   * @param context - The witness context containing ledger and private state.
   * @param a - The U256 value to divide (dividend).
   * @param b - The U256 value to divide by (divisor).
   * @returns A tuple of the unchanged private state and a DivResultU256 with quotient and remainder.
   */
  divU256Locally(
    context: WitnessContext<Ledger, MathU256ContractPrivateState>,
    a: U256,
    b: U256,
  ): [MathU256ContractPrivateState, DivResultU256] {
    // Convert U256 to bigint
    const aBigInt =
      (BigInt(a.high.high) << 192n) +
      (BigInt(a.high.low) << 128n) +
      (BigInt(a.low.high) << 64n) +
      BigInt(a.low.low);
    const bBigInt =
      (BigInt(b.high.high) << 192n) +
      (BigInt(b.high.low) << 128n) +
      (BigInt(b.low.high) << 64n) +
      BigInt(b.low.low);

    // Compute quotient and remainder
    const quotient = aBigInt / bBigInt; // Integer division
    const remainder = aBigInt - quotient * bBigInt;

    // Convert quotient to U256
    const quotientLowBigInt = quotient & ((1n << 128n) - 1n);
    const quotientHighBigInt = quotient >> 128n;
    const quotientU256: U256 = {
      low: {
        low: quotientLowBigInt & ((1n << 64n) - 1n),
        high: quotientLowBigInt >> 64n,
      },
      high: {
        low: quotientHighBigInt & ((1n << 64n) - 1n),
        high: quotientHighBigInt >> 64n,
      },
    };

    // Convert remainder to U256
    const remainderLowBigInt = remainder & ((1n << 128n) - 1n);
    const remainderHighBigInt = remainder >> 128n;
    const remainderU256: U256 = {
      low: {
        low: remainderLowBigInt & ((1n << 64n) - 1n),
        high: remainderLowBigInt >> 64n,
      },
      high: {
        low: remainderHighBigInt & ((1n << 64n) - 1n),
        high: remainderHighBigInt >> 64n,
      },
    };

    return [
      context.privateState,
      {
        quotient: quotientU256,
        remainder: remainderU256,
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
  divU128Locally(
    context: WitnessContext<Ledger, MathU256ContractPrivateState>,
    a: U128,
    b: U128,
  ): [MathU256ContractPrivateState, DivResultU128] {
    const aBigInt = (BigInt(a.high) << 64n) + BigInt(a.low);
    const bBigInt = (BigInt(b.high) << 64n) + BigInt(b.low);
    const quotient = aBigInt / bBigInt;
    const remainder = aBigInt - quotient * bBigInt;
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

  divUint128Locally(
    context: WitnessContext<Ledger, MathU256ContractPrivateState>,
    a: bigint,
    b: bigint,
  ): [MathU256ContractPrivateState, DivResultU128] {
    const quotient = a / b;
    const remainder = a - quotient * b;
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
});
