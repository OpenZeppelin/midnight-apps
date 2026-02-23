/**
 * @description Unpacks a Bytes<32> into 32 individual bytes (little-endian).
 * This is the witness for Bytes32.unpack.
 * @param bytes - The 32-byte array to unpack.
 * @returns A vector of 32 bytes where element 0 is the LSB.
 */
export const wit_unpackBytes32 = (bytes: Uint8Array): bigint[] => {
  if (bytes.length !== 32) {
    throw new Error(`Expected 32 bytes, got ${bytes.length}`);
  }
  return Array.from(bytes, (b) => BigInt(b));
};
