/**
 * @description Unpacks a Bytes<8> into 8 individual bytes (little-endian).
 * This is the witness for Bytes8.unpack.
 * @param bytes - The 8-byte array to unpack.
 * @returns A vector of 8 bytes [b0, b1, b2, b3, b4, b5, b6, b7] where b0 is the LSB.
 */
export const wit_unpackBytes8 = (
  bytes: Uint8Array,
): [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint] => {
  if (bytes.length !== 8) {
    throw new Error(`Expected 8 bytes, got ${bytes.length}`);
  }
  return [
    BigInt(bytes[0]),
    BigInt(bytes[1]),
    BigInt(bytes[2]),
    BigInt(bytes[3]),
    BigInt(bytes[4]),
    BigInt(bytes[5]),
    BigInt(bytes[6]),
    BigInt(bytes[7]),
  ];
};
