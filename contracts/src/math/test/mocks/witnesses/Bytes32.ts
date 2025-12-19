import type { Witnesses } from '../../../../../artifacts/math/test/mocks/contracts/Bytes32.mock/contract/index.d.ts';

/**
 * @description Represents the private state of the Bytes32 module.
 * @remarks No persistent state is needed as all circuits are pure.
 */
export type Bytes32PrivateState = Record<string, never>;

/**
 * @description Factory function creating witness implementations for Bytes32 module operations.
 */
export const Bytes32Witnesses = (): Witnesses<Bytes32PrivateState> => ({
  /**
   * @description Converts a 32-byte array to a U256 struct using little-endian byte ordering.
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
});
