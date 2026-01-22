import { beforeEach, describe, test } from 'vitest';
import * as fc from 'fast-check';
import { Bytes32Simulator } from './Bytes32Simulator';

let bytes32Simulator: Bytes32Simulator;

const setup = () => {
  bytes32Simulator = new Bytes32Simulator();
};

// Maximum value that fits in 254 bits (field modulus constraint)
const MAX_FIELD254 = 2n ** 254n - 1n;

// Custom arbitrary for 32-byte arrays within the 254-bit field constraint
const arbBytes32InField = (): fc.Arbitrary<Uint8Array> => {
  return fc
    .bigUint({ max: MAX_FIELD254 })
    .map((value) => {
      const bytes = new Uint8Array(32);
      let remaining = value;
      // Convert bigint to bytes (little-endian)
      for (let i = 0; i < 32 && remaining > 0n; i++) {
        bytes[i] = Number(remaining & 0xffn);
        remaining = remaining >> 8n;
      }
      return bytes;
    });
};

// Custom arbitrary for any 32-byte arrays
const arbBytes32 = (): fc.Arbitrary<Uint8Array> => {
  return fc.uint8Array({ minLength: 32, maxLength: 32 });
};

// Helper to convert bytes to bigint (little-endian)
const bytesToBigInt = (bytes: Uint8Array): bigint => {
  let result = 0n;
  for (let i = bytes.length - 1; i >= 0; i--) {
    result = (result << 8n) | BigInt(bytes[i]);
  }
  return result;
};

// Helper to create bytes from bigint (little-endian)
const bigIntToBytes = (value: bigint): Uint8Array => {
  const bytes = new Uint8Array(32);
  let remaining = value;
  for (let i = 0; i < 32 && remaining > 0n; i++) {
    bytes[i] = Number(remaining & 0xffn);
    remaining = remaining >> 8n;
  }
  return bytes;
};

// Helper to check if two Uint8Arrays are equal
const bytesEqual = (a: Uint8Array, b: Uint8Array): boolean => {
  if (a.length !== b.length) return false;
  return a.every((val, idx) => val === b[idx]);
};

/**
 * Property-based fuzz tests for Bytes32 operations
 * Using fast-check for automated test case generation
 */
describe('Bytes32 - Property-Based Fuzz Tests', () => {
  beforeEach(setup);

  describe('Conversion Properties', () => {
    test('fromBytes and toBytes are inverses within field', () => {
      fc.assert(
        fc.property(
          arbBytes32InField(),
          (bytes) => {
            const field = bytes32Simulator.fromBytes(bytes);
            const reconstructed = bytes32Simulator.toBytes(field);
            return bytesEqual(bytes, reconstructed);
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('toBytes and fromBytes are inverses', () => {
      fc.assert(
        fc.property(
          fc.bigUint({ max: MAX_FIELD254 }),
          (field) => {
            const bytes = bytes32Simulator.toBytes(field);
            const reconstructed = bytes32Simulator.fromBytes(bytes);
            return reconstructed === field;
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('fromBytes produces values within field bounds', () => {
      fc.assert(
        fc.property(
          arbBytes32InField(),
          (bytes) => {
            const field = bytes32Simulator.fromBytes(bytes);
            return field >= 0n && field < 2n ** 254n;
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('fromBytes rejects values exceeding field size', () => {
      fc.assert(
        fc.property(
          fc.bigUint({ min: 2n ** 254n, max: 2n ** 256n - 1n }),
          (value) => {
            const bytes = bigIntToBytes(value);
            try {
              bytes32Simulator.fromBytes(bytes);
              // Should have thrown an error
              return false;
            } catch {
              // Expected behavior
              return true;
            }
          }
        ),
        { numRuns: 500 }
      );
    });
  });

  describe('Comparison Properties', () => {
    test('Equality is reflexive: a = a', () => {
      fc.assert(
        fc.property(
          arbBytes32InField(),
          (a) => {
            return bytes32Simulator.eq(a, a);
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('Equality is symmetric: a = b implies b = a', () => {
      fc.assert(
        fc.property(
          arbBytes32InField(),
          arbBytes32InField(),
          (a, b) => {
            const eqAB = bytes32Simulator.eq(a, b);
            const eqBA = bytes32Simulator.eq(b, a);
            return eqAB === eqBA;
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('Equality is transitive: if a = b and b = c, then a = c', () => {
      fc.assert(
        fc.property(
          arbBytes32InField(),
          (a) => {
            const b = new Uint8Array(a); // Copy of a
            const c = new Uint8Array(a); // Another copy
            
            const eqAB = bytes32Simulator.eq(a, b);
            const eqBC = bytes32Simulator.eq(b, c);
            const eqAC = bytes32Simulator.eq(a, c);
            
            return (eqAB && eqBC) ? eqAC : true;
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('Less than is transitive: if a < b and b < c, then a < c', () => {
      fc.assert(
        fc.property(
          arbBytes32InField(),
          arbBytes32InField(),
          arbBytes32InField(),
          (a, b, c) => {
            const ltAB = bytes32Simulator.lt(a, b);
            const ltBC = bytes32Simulator.lt(b, c);
            
            if (ltAB && ltBC) {
              return bytes32Simulator.lt(a, c);
            }
            return true;
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('Less than or equal is reflexive: a ≤ a', () => {
      fc.assert(
        fc.property(
          arbBytes32InField(),
          (a) => {
            return bytes32Simulator.lte(a, a);
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('Greater than is inverse of less than: a > b = b < a', () => {
      fc.assert(
        fc.property(
          arbBytes32InField(),
          arbBytes32InField(),
          (a, b) => {
            const gtAB = bytes32Simulator.gt(a, b);
            const ltBA = bytes32Simulator.lt(b, a);
            return gtAB === ltBA;
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('Greater than or equal is inverse of less than: a ≥ b = not (a < b)', () => {
      fc.assert(
        fc.property(
          arbBytes32InField(),
          arbBytes32InField(),
          (a, b) => {
            const gteAB = bytes32Simulator.gte(a, b);
            const ltAB = bytes32Simulator.lt(a, b);
            return gteAB === !ltAB;
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('Trichotomy: exactly one of a < b, a = b, a > b is true', () => {
      fc.assert(
        fc.property(
          arbBytes32InField(),
          arbBytes32InField(),
          (a, b) => {
            const lt = bytes32Simulator.lt(a, b);
            const eq = bytes32Simulator.eq(a, b);
            const gt = bytes32Simulator.gt(a, b);
            
            const count = (lt ? 1 : 0) + (eq ? 1 : 0) + (gt ? 1 : 0);
            return count === 1;
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('Consistency between comparison operators: a ≤ b ↔ (a < b or a = b)', () => {
      fc.assert(
        fc.property(
          arbBytes32InField(),
          arbBytes32InField(),
          (a, b) => {
            const lte = bytes32Simulator.lte(a, b);
            const lt = bytes32Simulator.lt(a, b);
            const eq = bytes32Simulator.eq(a, b);
            
            return lte === (lt || eq);
          }
        ),
        { numRuns: 1000 }
      );
    });
  });

  describe('Ordering Properties', () => {
    test('Anti-symmetry: if a ≤ b and b ≤ a, then a = b', () => {
      fc.assert(
        fc.property(
          arbBytes32InField(),
          arbBytes32InField(),
          (a, b) => {
            const lteAB = bytes32Simulator.lte(a, b);
            const lteBA = bytes32Simulator.lte(b, a);
            const eqAB = bytes32Simulator.eq(a, b);
            
            if (lteAB && lteBA) {
              return eqAB;
            }
            return true;
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('Totality: for any a and b, either a ≤ b or b ≤ a', () => {
      fc.assert(
        fc.property(
          arbBytes32InField(),
          arbBytes32InField(),
          (a, b) => {
            const lteAB = bytes32Simulator.lte(a, b);
            const lteBA = bytes32Simulator.lte(b, a);
            return lteAB || lteBA;
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('Comparison consistency with field values', () => {
      fc.assert(
        fc.property(
          arbBytes32InField(),
          arbBytes32InField(),
          (a, b) => {
            const aValue = bytes32Simulator.fromBytes(a);
            const bValue = bytes32Simulator.fromBytes(b);
            
            const ltBytes = bytes32Simulator.lt(a, b);
            const ltValues = aValue < bValue;
            
            return ltBytes === ltValues;
          }
        ),
        { numRuns: 1000 }
      );
    });
  });

  describe('Boundary and Edge Cases', () => {
    test('Operations with zero bytes', () => {
      fc.assert(
        fc.property(
          arbBytes32InField(),
          (a) => {
            const zero = new Uint8Array(32);
            
            // Comparisons with zero
            const eqZero = bytes32Simulator.eq(zero, zero);
            const lteZeroA = bytes32Simulator.lte(zero, a);
            
            return eqZero && lteZeroA;
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('Operations with maximum field value', () => {
      fc.assert(
        fc.property(
          arbBytes32InField(),
          (a) => {
            const maxField = bigIntToBytes(MAX_FIELD254);
            
            // All values should be less than or equal to max
            const lteMax = bytes32Simulator.lte(a, maxField);
            
            return lteMax;
          }
        ),
        { numRuns: 500 }
      );
    });

    test('Byte array structure preservation', () => {
      fc.assert(
        fc.property(
          arbBytes32InField(),
          (bytes) => {
            // Verify array length is preserved
            return bytes.length === 32;
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('Conversion handles all byte positions', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 31 }),
          fc.integer({ min: 0, max: 255 }),
          (position, value) => {
            const bytes = new Uint8Array(32);
            bytes[position] = value;
            
            // Should be within field bounds if small enough
            if (position < 31 || value < 0x40) {
              const field = bytes32Simulator.fromBytes(bytes);
              return field >= 0n;
            }
            return true;
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('Little-endian byte order consistency', () => {
      fc.assert(
        fc.property(
          fc.bigUint({ max: MAX_FIELD254 }),
          (value) => {
            const bytes = bytes32Simulator.toBytes(value);
            const reconstructed = bytesToBigInt(bytes);
            return reconstructed === value;
          }
        ),
        { numRuns: 1000 }
      );
    });
  });

  describe('Identity and Special Value Properties', () => {
    test('Zero conversion consistency', () => {
      fc.assert(
        fc.property(
          fc.constant(0n),
          (zero) => {
            const bytes = bytes32Simulator.toBytes(zero);
            const field = bytes32Simulator.fromBytes(bytes);
            return field === zero;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Powers of two conversion', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 253 }),
          (exponent) => {
            const value = 2n ** BigInt(exponent);
            const bytes = bytes32Simulator.toBytes(value);
            const reconstructed = bytes32Simulator.fromBytes(bytes);
            return reconstructed === value;
          }
        ),
        { numRuns: 254 }
      );
    });

    test('Sequential values maintain ordering', () => {
      fc.assert(
        fc.property(
          fc.bigUint({ max: MAX_FIELD254 - 1n }),
          (value) => {
            const bytes1 = bytes32Simulator.toBytes(value);
            const bytes2 = bytes32Simulator.toBytes(value + 1n);
            
            return bytes32Simulator.lt(bytes1, bytes2);
          }
        ),
        { numRuns: 1000 }
      );
    });
  });
});
