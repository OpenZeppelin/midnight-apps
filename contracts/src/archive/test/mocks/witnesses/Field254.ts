import type { WitnessContext } from '@midnight-ntwrk/compact-runtime';
import type {
  DivResultU128,
  DivResultU256,
  U256,
} from '@src/artifacts/math/Index/contract/index.d.ts';
import type { Ledger } from '@src/artifacts/math/test/Field254.mock/contract/index.js';
import type { EmptyState } from '../types/state.js';
import { sqrtBigint } from '../utils/sqrtBigint.js';

/**
 * @description Represents the private state of the Field254 module.
 * @remarks No persistent state is needed beyond what's computed on-demand, so this is minimal.
 */
export type Field254PrivateState = EmptyState;

/**
 * @description Utility object for managing the private state of the Field254 module.
 */
export const Field254PrivateState = {
  /**
   * @description Generates a new private state.
   * @returns A fresh Field254ContractPrivateState instance (empty for now).
   */
  generate: (): Field254PrivateState => {
    return {};
  },
};

/**
 * @description Factory function creating witness implementations for Field254 module operations.
 * @returns An object implementing the witness functions for Field254PrivateState.
 */
export const Field254Witnesses = () => ({
  /**
   * @description Computes division of two Uint<254> values off-chain.
   * @param context - The witness context containing ledger and private state.
   * @param a - The Uint<254> value to divide.
   * @param b - The Uint<254> value to divide by.
   * @returns A tuple of the unchanged private state and a DivResultU256 with quotient and remainder.
   */
  divUint254Locally(
    context: WitnessContext<Ledger, Field254PrivateState>,
    a: bigint,
    b: bigint,
  ): [Field254PrivateState, DivResultU256] {
    // Compute quotient and remainder
    const quotient = a / b;
    const remainder = a - quotient * b;

    // Convert quotient to U256
    const quotientLowBigInt = quotient & ((1n << 128n) - 1n);
    const quotientHighBigInt = quotient >> 128n;
    const quotientU256 = {
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
    const remainderU256 = {
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
   * @description Computes the square root of a U256 value off-chain.
   * @param context - The witness context containing ledger and private state.
   * @param radicand - The U256 value to compute the square root of.
   * @returns A tuple of the unchanged private state and the square root as a bigint (Uint<128>).
   */
  sqrtU256Locally(
    context: WitnessContext<Ledger, Field254PrivateState>,
    radicand: U256,
  ): [Field254PrivateState, bigint] {
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
    context: WitnessContext<Ledger, Field254PrivateState>,
    a: U256,
    b: U256,
  ): [Field254PrivateState, DivResultU256] {
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
  divUint128Locally(
    context: WitnessContext<Ledger, Field254PrivateState>,
    a: bigint,
    b: bigint,
  ): [Field254PrivateState, DivResultU128] {
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
