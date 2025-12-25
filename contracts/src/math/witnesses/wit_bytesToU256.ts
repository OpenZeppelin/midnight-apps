import type { U256 } from './types.js';

/**
 * @description Converts a 32-byte array to a U256 struct using little-endian byte ordering.
 * @param bytes - The 32-byte array to convert.
 * @returns A U256 struct representing the value.
 *
 * @remarks
 * This witness function is used by both Bytes32 and Field255 contracts.
 *
 * Little-endian layout:
 * - bytes[0..7]   → low.low   (least significant 64 bits)
 * - bytes[8..15]  → low.high  (next 64 bits)
 * - bytes[16..23] → high.low  (next 64 bits)
 * - bytes[24..31] → high.high (most significant 64 bits)
 */
export const wit_bytesToU256 = (bytes: Uint8Array): U256 => {
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

  return {
    low: { low: lowLow, high: lowHigh },
    high: { low: highLow, high: highHigh },
  };
};
