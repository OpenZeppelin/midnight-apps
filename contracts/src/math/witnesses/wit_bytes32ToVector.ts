/**
 * @description Converts a 32-byte array to a vector of 32 individual bytes.
 * This is the witness for Bytes32.toVector.
 * @param bytes - The 32-byte array to convert.
 * @returns A vector of 32 bytes [b0, b1, ..., b31] where b0 is the first byte.
 *
 * @remarks
 * This witness function simply unpacks the Uint8Array into individual bigint values
 * that can be used as a Vector<32, Uint<8>> in Compact circuits.
 */
export const wit_bytes32ToVector = (
  bytes: Uint8Array,
): [
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
] => {
  if (bytes.length !== 32) {
    throw new Error('wit_bytes32ToVector: expected 32 bytes');
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
    BigInt(bytes[8]),
    BigInt(bytes[9]),
    BigInt(bytes[10]),
    BigInt(bytes[11]),
    BigInt(bytes[12]),
    BigInt(bytes[13]),
    BigInt(bytes[14]),
    BigInt(bytes[15]),
    BigInt(bytes[16]),
    BigInt(bytes[17]),
    BigInt(bytes[18]),
    BigInt(bytes[19]),
    BigInt(bytes[20]),
    BigInt(bytes[21]),
    BigInt(bytes[22]),
    BigInt(bytes[23]),
    BigInt(bytes[24]),
    BigInt(bytes[25]),
    BigInt(bytes[26]),
    BigInt(bytes[27]),
    BigInt(bytes[28]),
    BigInt(bytes[29]),
    BigInt(bytes[30]),
    BigInt(bytes[31]),
  ];
};
