import type { Witnesses } from '../../../../../artifacts/math/test/mocks/contracts/Uint256.mock/contract/index.js';
import { sqrtBigint } from '../../../utils/sqrtBigint.js';

/**
 * @description Represents the private state of the MathU256 module.
 * @remarks No persistent state is needed beyond what's computed on-demand, so this is minimal.
 */
export type Uint256PrivateState = Record<string, never>;

/**
 * @description Utility object for managing the private state of the MathU256 module.
 */
export const Uint256PrivateState = {
  /**
   * @description Generates a new private state.
   * @returns A fresh Uint256PrivateState instance (empty for now).
   */
  generate: (): Uint256PrivateState => {
    return {};
  },
};

/**
 * @description Factory function creating witness implementations for MathU256 module operations.
 * @returns An object implementing the Witnesses interface for Uint256PrivateState.
 */
export const Uint256Witnesses = (): Witnesses<Uint256PrivateState> => ({
  /**
   * @description Computes the square root of a U256 value off-chain.
   */
  wit_sqrtU256Locally(context, radicand) {
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
   */
  wit_divU256Locally(context, a, b) {
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
   * @description Computes division of two Uint<128> values off-chain.
   */
  wit_divUint128Locally(context, a, b) {
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
