import type {
  DivResultField,
  U128,
  Witnesses,
} from '../../../../../artifacts/math/test/mocks/contracts/Field255.mock/contract/index.js';
import { sqrtBigint } from '../../../utils/sqrtBigint.js';

/**
 * @description Represents the private state of the Field255 module.
 * @remarks No persistent state is needed beyond what's computed on-demand, so this is minimal.
 */
export type Field255PrivateState = Record<string, never>;

/**
 * @description Utility object for managing the private state of the Field255 module.
 */
export const Field255PrivateState = {
  /**
   * @description Generates a new private state.
   * @returns A fresh Field255PrivateState instance (empty for now).
   */
  generate: (): Field255PrivateState => {
    return {};
  },
};

const UINT64_MASK = BigInt('0xFFFFFFFFFFFFFFFF');

const toU128 = (value: bigint): U128 => ({
  low: value & UINT64_MASK,
  high: value >> 64n,
});

/**
 * @description Factory function creating witness implementations for Field255 module operations.
 * @returns An object implementing the Witnesses interface for Field255PrivateState.
 */
export const Field255Witnesses = (): Witnesses<Field255PrivateState> => ({
  /**
   * @description Converts a 32-byte array to a U256 struct using little-endian byte ordering.
   * Required by Bytes32 module (used by Field255 for toU256 operations).
   * @param _context - The witness context (unused).
   * @param bytes - The 32-byte array to convert.
   * @returns A tuple of [privateState, U256].
   */
  wit_bytesToU256Locally(_context, bytes) {
    // Little-endian: bytes[0..7] = low.low, bytes[8..15] = low.high,
    //                bytes[16..23] = high.low, bytes[24..31] = high.high
    const lowLow =
      BigInt(bytes[0]) |
      (BigInt(bytes[1]) << 8n) |
      (BigInt(bytes[2]) << 16n) |
      (BigInt(bytes[3]) << 24n) |
      (BigInt(bytes[4]) << 32n) |
      (BigInt(bytes[5]) << 40n) |
      (BigInt(bytes[6]) << 48n) |
      (BigInt(bytes[7]) << 56n);

    const lowHigh =
      BigInt(bytes[8]) |
      (BigInt(bytes[9]) << 8n) |
      (BigInt(bytes[10]) << 16n) |
      (BigInt(bytes[11]) << 24n) |
      (BigInt(bytes[12]) << 32n) |
      (BigInt(bytes[13]) << 40n) |
      (BigInt(bytes[14]) << 48n) |
      (BigInt(bytes[15]) << 56n);

    const highLow =
      BigInt(bytes[16]) |
      (BigInt(bytes[17]) << 8n) |
      (BigInt(bytes[18]) << 16n) |
      (BigInt(bytes[19]) << 24n) |
      (BigInt(bytes[20]) << 32n) |
      (BigInt(bytes[21]) << 40n) |
      (BigInt(bytes[22]) << 48n) |
      (BigInt(bytes[23]) << 56n);

    const highHigh =
      BigInt(bytes[24]) |
      (BigInt(bytes[25]) << 8n) |
      (BigInt(bytes[26]) << 16n) |
      (BigInt(bytes[27]) << 24n) |
      (BigInt(bytes[28]) << 32n) |
      (BigInt(bytes[29]) << 40n) |
      (BigInt(bytes[30]) << 48n) |
      (BigInt(bytes[31]) << 56n);

    return [
      {},
      {
        low: { low: lowLow, high: lowHigh },
        high: { low: highLow, high: highHigh },
      },
    ];
  },

  /**
   * @description Computes division of two Field values off-chain.
   * @param context - The witness context.
   * @param a - The dividend Field value.
   * @param b - The divisor Field value.
   * @returns A tuple of [privateState, DivResultField].
   */
  wit_divFieldLocally(context, a, b): [Field255PrivateState, DivResultField] {
    // Field values are already bigints in the TypeScript representation
    const quotient = a / b; // Integer division
    const remainder = a - quotient * b;

    return [
      context.privateState,
      {
        quotient,
        remainder,
      },
    ];
  },

  /**
   * @description Computes the square root of a Field value off-chain.
   * @param context - The witness context.
   * @param radicand - The Field value to compute the square root of.
   * @returns A tuple of [privateState, Field (square root)].
   */
  wit_sqrtFieldLocally(context, radicand): [Field255PrivateState, bigint] {
    const root = sqrtBigint(radicand);
    return [context.privateState, root];
  },

  /**
   * @description Computes division of two Uint128 values off-chain.
   * Required by Uint256_mul which internally uses Uint128 operations.
   * @param context - The witness context.
   * @param a - The dividend as bigint.
   * @param b - The divisor as bigint.
   * @returns A tuple of [privateState, DivResultU128].
   */
  wit_divUint128Locally(context, a, b) {
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
