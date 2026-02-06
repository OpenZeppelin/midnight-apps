import type {
  DivResultU128,
  U128,
  Witnesses,
} from '@src/artifacts/math/test/mocks/contracts/Uint128.mock/contract/index.d.ts';
import { sqrtBigint } from '../../../utils/sqrtBigint.js';

/**
 * @description Represents the private state of the Uint128 module.
 * @remarks No persistent state is needed beyond what's computed on-demand, so this is minimal.
 */
export type Uint128PrivateState = Record<string, never>;

/**
 * @description Utility object for managing the private state of the Uint128 module.
 */
export const Uint128PrivateState = {
  /**
   * @description Generates a new private state.
   * @returns A fresh Uint128PrivateState instance (empty for now).
   */
  generate: (): Uint128PrivateState => {
    return {};
  },
};

const UINT64_MASK = BigInt('0xFFFFFFFFFFFFFFFF');

const toU128 = (value: bigint): U128 => ({
  low: value & UINT64_MASK,
  high: value >> 64n,
});

const fromU128 = (value: U128): bigint =>
  (BigInt(value.high) << 64n) + BigInt(value.low);

/**
 * @description Factory function creating witness implementations for Uint128 module operations.
 */
export const Uint128Witnesses = (): Witnesses<Uint128PrivateState> => ({
  sqrtU128Locally(context, radicand) {
    const radicandBigInt = fromU128(radicand);
    const root = sqrtBigint(radicandBigInt);
    return [context.privateState, root];
  },

  divU128Locally(context, a, b): [Uint128PrivateState, DivResultU128] {
    const aValue = fromU128(a);
    const bValue = fromU128(b);
    const quotient = aValue / bValue;
    const remainder = aValue - quotient * bValue;
    return [
      context.privateState,
      {
        quotient: toU128(quotient),
        remainder: toU128(remainder),
      },
    ];
  },

  divUint128Locally(context, a, b) {
    const quotient = a / b;
    const remainder = a - quotient * b;
    return [
      context.privateState,
      {
        quotient: toU128(quotient),
        remainder: toU128(remainder),
      },
    ];
  },
});
