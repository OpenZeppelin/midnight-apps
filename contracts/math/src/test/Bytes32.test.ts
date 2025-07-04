import { beforeEach, describe, expect, test } from 'vitest';
import { Bytes32ContractSimulator } from './Bytes32Simulator';

let bytes32Simulator: Bytes32ContractSimulator;

const setup = () => {
  bytes32Simulator = new Bytes32ContractSimulator();
};

// Helper function to create test bytes from decimal bigint
const createBytes = (value: bigint): Uint8Array => {
  const bytes = new Uint8Array(32);
  let remaining = value;

  // Convert bigint to bytes (little-endian)
  for (let i = 0; i < 32 && remaining > 0n; i++) {
    bytes[i] = Number(remaining & 0xffn);
    remaining = remaining >> 8n;
  }

  return bytes;
};

// Helper function to create bytes with specific patterns
const createPatternBytes = (pattern: number, position = 0): Uint8Array => {
  const bytes = new Uint8Array(32);
  if (position < 32) {
    bytes[position] = pattern;
  }
  return bytes;
};

// Helper function to create maximum field value (2^254 - 1)
const createMaxFieldBytes = (): Uint8Array => {
  // 2^254 - 1 = 0x3fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
  return createBytes(2n ** 254n - 1n);
};

// Helper function to create bytes just above field size
const createOverflowBytes = (): Uint8Array => {
  // 2^254 = 0x4000000000000000000000000000000000000000000000000000000000000000
  return createBytes(2n ** 254n);
};

describe('Bytes32', () => {
  beforeEach(setup);

  describe('Type Conversion Functions', () => {
    describe('fromBytes', () => {
      test('should convert bytes to field', () => {
        const bytes = createBytes(1n);
        const field = bytes32Simulator.fromBytes(bytes);
        expect(typeof field).toBe('bigint');
        expect(field).toBeGreaterThanOrEqual(0n);
      });

      test('should convert zero bytes to zero field', () => {
        const bytes = new Uint8Array(32);
        const field = bytes32Simulator.fromBytes(bytes);
        expect(field).toBe(0n);
      });

      test('should convert large bytes to field', () => {
        const bytes = createBytes(2n ** 256n - 1n);
        const field = bytes32Simulator.fromBytes(bytes);
        expect(field).toBeGreaterThan(0n);
      });

      test('should handle bytes with mixed values', () => {
        const bytes = createBytes(1234567890123456789012345678901234567890n);
        const field = bytes32Simulator.fromBytes(bytes);
        expect(field).toBeGreaterThan(0n);
      });

      test('should handle maximum field value bytes', () => {
        const bytes = createMaxFieldBytes();
        const field = bytes32Simulator.fromBytes(bytes);
        expect(typeof field).toBe('bigint');
        expect(field).toBeGreaterThan(0n);
        // Field should be within 254-bit range
        expect(field).toBeLessThan(2n ** 254n);
      });

      test('should handle bytes with only first byte set', () => {
        const bytes = createPatternBytes(0xff, 0);
        const field = bytes32Simulator.fromBytes(bytes);
        expect(typeof field).toBe('bigint');
        expect(field).toBeGreaterThan(0n);
      });

      test('should handle bytes just above field size', () => {
        const bytes = createOverflowBytes();
        expect(() => bytes32Simulator.fromBytes(bytes)).toThrow(
          'failed assert: Bytes32: toField() - inputs exceed the field size',
        );
      });

      test('should handle bytes with only last byte set to 0xF', () => {
        const bytes = createPatternBytes(0xf, 31);
        expect(() => bytes32Simulator.fromBytes(bytes)).toThrow(
          'failed assert: Bytes32: toField() - inputs exceed the field size',
        );
      });

      test('should handle bytes with only last byte set to 0x01', () => {
        const bytes = createPatternBytes(0x01, 31);
        expect(() => bytes32Simulator.fromBytes(bytes)).toThrow(
          'failed assert: Bytes32: toField() - inputs exceed the field size',
        );
      });

      test('should handle bytes with only last byte set to 0x00', () => {
        const bytes = createPatternBytes(0x00, 31);
        const field = bytes32Simulator.fromBytes(bytes);
        expect(typeof field).toBe('bigint');
        // When the last byte is set to 0x00, all bytes are zero,
        // so fromBytes returns 0
        expect(field).toBe(0n);
      });

      test('should handle bytes with alternating pattern', () => {
        const bytes = new Uint8Array(32);
        for (let i = 0; i < 32; i++) {
          bytes[i] = i % 2 === 0 ? 0xff : 0x00;
        }
        const field = bytes32Simulator.fromBytes(bytes);
        expect(typeof field).toBe('bigint');
        expect(field).toBeGreaterThan(0n);
      });
    });

    describe('toBytes', () => {
      test('should convert field to bytes', () => {
        const field = 1n;
        const bytes = bytes32Simulator.toBytes(field);
        expect(bytes).toBeInstanceOf(Uint8Array);
        expect(bytes.length).toBe(32);
      });

      test('should convert zero field to zero bytes', () => {
        const field = 0n;
        const bytes = bytes32Simulator.toBytes(field);
        expect(bytes).toBeInstanceOf(Uint8Array);
        expect(bytes.length).toBe(32);
        // Check that all bytes are zero
        for (let i = 0; i < 32; i++) {
          expect(bytes[i]).toBe(0);
        }
      });

      test('should convert large field to bytes', () => {
        const field = 123456789n;
        const bytes = bytes32Simulator.toBytes(field);
        expect(bytes).toBeInstanceOf(Uint8Array);
        expect(bytes.length).toBe(32);
      });

      test('should convert maximum field value to bytes', () => {
        const maxField = 2n ** 254n - 1n;
        const bytes = bytes32Simulator.toBytes(maxField);
        expect(bytes).toBeInstanceOf(Uint8Array);
        expect(bytes.length).toBe(32);
      });

      test('should handle field values near maximum', () => {
        const nearMaxField = 2n ** 254n - 1000n;
        const bytes = bytes32Simulator.toBytes(nearMaxField);
        expect(bytes).toBeInstanceOf(Uint8Array);
        expect(bytes.length).toBe(32);
      });

      test('should round-trip conversion work for small values', () => {
        const originalBytes = createBytes(1n);
        const field = bytes32Simulator.fromBytes(originalBytes);
        const convertedBytes = bytes32Simulator.toBytes(field);
        expect(convertedBytes).toBeInstanceOf(Uint8Array);
        expect(convertedBytes.length).toBe(32);
      });

      test('should round-trip conversion work for maximum field value', () => {
        const maxField = 2n ** 254n - 1n;
        const bytes = bytes32Simulator.toBytes(maxField);
        const field = bytes32Simulator.fromBytes(bytes);
        expect(typeof field).toBe('bigint');
        expect(field).toBeGreaterThan(0n);
      });

      test('should handle small field values', () => {
        const smallField = 1n;
        const bytes = bytes32Simulator.toBytes(smallField);
        expect(bytes).toBeInstanceOf(Uint8Array);
        expect(bytes.length).toBe(32);
      });

      test('should handle medium field values', () => {
        const mediumField = 1000000n;
        const bytes = bytes32Simulator.toBytes(mediumField);
        expect(bytes).toBeInstanceOf(Uint8Array);
        expect(bytes.length).toBe(32);
      });

      test('should handle large field values', () => {
        const largeField = 2n ** 128n - 1n;
        const bytes = bytes32Simulator.toBytes(largeField);
        expect(bytes).toBeInstanceOf(Uint8Array);
        expect(bytes.length).toBe(32);
      });

      test('should handle field values at field boundary', () => {
        const boundaryField = 2n ** 254n;
        const bytes = bytes32Simulator.toBytes(boundaryField);
        expect(bytes).toBeInstanceOf(Uint8Array);
        expect(bytes.length).toBe(32);
      });
    });
  });

  describe('Equality Comparison Functions', () => {
    describe('eq', () => {
      test('should return true for equal bytes', () => {
        const a = createBytes(1234567890123456789012345678901234567890n);
        const b = createBytes(1234567890123456789012345678901234567890n);
        expect(bytes32Simulator.eq(a, b)).toBe(true);
      });

      test('should return false for different bytes', () => {
        const a = createBytes(1234567890123456789012345678901234567890n);
        const b = createBytes(1234567890123456789012345678901234567891n);
        expect(bytes32Simulator.eq(a, b)).toBe(false);
      });

      test('should return true for zero bytes', () => {
        const a = new Uint8Array(32);
        const b = new Uint8Array(32);
        expect(bytes32Simulator.eq(a, b)).toBe(true);
      });

      test('should return false when comparing zero with non-zero', () => {
        const a = new Uint8Array(32);
        const b = createBytes(1n);
        expect(bytes32Simulator.eq(a, b)).toBe(false);
      });

      test('should handle maximum value comparisons', () => {
        const maxBytes = createMaxFieldBytes();
        const maxBytesCopy = createMaxFieldBytes();
        expect(bytes32Simulator.eq(maxBytes, maxBytesCopy)).toBe(true);
      });

      test('should handle overflow value comparisons', () => {
        const overflowBytes = createOverflowBytes();
        const overflowBytesCopy = createOverflowBytes();
        expect(bytes32Simulator.eq(overflowBytes, overflowBytesCopy)).toBe(
          true,
        );
      });

      test('should handle single byte differences', () => {
        const a = createPatternBytes(0x01, 0);
        const b = createPatternBytes(0x02, 0);
        expect(bytes32Simulator.eq(a, b)).toBe(false);
      });

      test('should handle last byte differences', () => {
        const a = createPatternBytes(0xff, 31);
        const b = createPatternBytes(0xfe, 31);
        expect(bytes32Simulator.eq(a, b)).toBe(false);
      });

      test('should return false when comparing different overflow values (2^254 + 1 vs 2^254 + 1000)', () => {
        const overflow1 = createBytes(2n ** 254n + 1n);
        const overflow2 = createBytes(2n ** 254n + 1000n);

        expect(bytes32Simulator.eq(overflow1, overflow2)).toBe(false);
      });

      test('should return false when comparing different overflow values (2^254 + 1000 vs 2^254 + 2000)', () => {
        const overflow1 = createBytes(2n ** 254n + 1000n);
        const overflow2 = createBytes(2n ** 254n + 2000n);

        expect(bytes32Simulator.eq(overflow1, overflow2)).toBe(false);
      });

      test('should return false when comparing 2^254 vs 2^254 + 1', () => {
        const overflow = createBytes(2n ** 254n);
        const overflowPlusOne = createBytes(2n ** 254n + 1n);

        expect(bytes32Simulator.eq(overflow, overflowPlusOne)).toBe(false);
      });

      test('should return false when comparing 2^254 + 1 vs 2^255', () => {
        const overflowPlusOne = createBytes(2n ** 254n + 1n);
        const twoTo255 = createBytes(2n ** 255n);

        expect(bytes32Simulator.eq(overflowPlusOne, twoTo255)).toBe(false);
      });

      test('should return false when comparing 2^255 vs 2^256 - 1', () => {
        const twoTo255 = createBytes(2n ** 255n);
        const max256Bit = createBytes(2n ** 256n - 1n);

        expect(bytes32Simulator.eq(twoTo255, max256Bit)).toBe(false);
      });

      test('should return false when comparing overflow with valid field value', () => {
        const validField = createMaxFieldBytes(); // 2^254 - 1 (valid)
        const overflow = createBytes(2n ** 254n); // 2^254 (overflow)

        expect(bytes32Simulator.eq(validField, overflow)).toBe(false);
      });

      test('should return false when comparing zero with overflow value', () => {
        const zero = new Uint8Array(32);
        const overflow = createBytes(2n ** 254n);

        expect(bytes32Simulator.eq(zero, overflow)).toBe(false);
      });

      test('should return true when comparing overflow value with itself', () => {
        const overflow = createBytes(2n ** 254n + 1n);

        expect(bytes32Simulator.eq(overflow, overflow)).toBe(true);
      });

      test('should return false when comparing 2^256 - 1 with 2^254 + 1', () => {
        const max256Bit = createBytes(2n ** 256n - 1n);
        const overflowPlusOne = createBytes(2n ** 254n + 1n);

        expect(bytes32Simulator.eq(max256Bit, overflowPlusOne)).toBe(false);
      });

      test('should return false when comparing 2^256 - 1 with 2^255', () => {
        const max256Bit = createBytes(2n ** 256n - 1n);
        const twoTo255 = createBytes(2n ** 255n);

        expect(bytes32Simulator.eq(max256Bit, twoTo255)).toBe(false);
      });

      test('should return true when comparing 2^256 - 1 with itself', () => {
        const max256Bit = createBytes(2n ** 256n - 1n);

        expect(bytes32Simulator.eq(max256Bit, max256Bit)).toBe(true);
      });

      test('should return false when comparing 2^256 - 1 with zero', () => {
        const max256Bit = createBytes(2n ** 256n - 1n);
        const zero = new Uint8Array(32);

        expect(bytes32Simulator.eq(max256Bit, zero)).toBe(false);
      });

      test('should return false when comparing 2^256 - 1 with valid field value', () => {
        const max256Bit = createBytes(2n ** 256n - 1n);
        const validField = createMaxFieldBytes(); // 2^254 - 1

        expect(bytes32Simulator.eq(max256Bit, validField)).toBe(false);
      });

      test('should return false when comparing 2^256 - 1 with 2^254', () => {
        const max256Bit = createBytes(2n ** 256n - 1n);
        const overflow = createBytes(2n ** 254n);

        expect(bytes32Simulator.eq(max256Bit, overflow)).toBe(false);
      });
    });
  });

  describe('Lexicographic Comparison Functions', () => {
    describe('lt', () => {
      test('should handle full 256-bit range comparisons', () => {
        // Test maximum possible 256-bit value (2^256 - 1)
        const max256BitBytes = createBytes(2n ** 256n - 1n);

        // Test various other values for comparison
        const zeroBytes = new Uint8Array(32);
        const oneBytes = createBytes(1n);
        const maxFieldBytes = createMaxFieldBytes();
        const overflowBytes = createOverflowBytes();

        // Test that the function doesn't throw with full 256-bit values
        expect(() =>
          bytes32Simulator.lt(zeroBytes, max256BitBytes),
        ).not.toThrow();
        expect(bytes32Simulator.lt(zeroBytes, max256BitBytes)).toBe(true);

        expect(() =>
          bytes32Simulator.lt(max256BitBytes, zeroBytes),
        ).not.toThrow();
        expect(bytes32Simulator.lt(max256BitBytes, zeroBytes)).toBe(false);

        expect(() =>
          bytes32Simulator.lt(oneBytes, max256BitBytes),
        ).not.toThrow();
        expect(bytes32Simulator.lt(oneBytes, max256BitBytes)).toBe(true);

        expect(() =>
          bytes32Simulator.lt(max256BitBytes, oneBytes),
        ).not.toThrow();
        expect(bytes32Simulator.lt(max256BitBytes, oneBytes)).toBe(false);

        expect(() =>
          bytes32Simulator.lt(maxFieldBytes, max256BitBytes),
        ).toThrow(
          'failed assert: Bytes32: lt() - comparison invalid; one or both of the inputs exceed the field size',
        );

        expect(() =>
          bytes32Simulator.lt(max256BitBytes, maxFieldBytes),
        ).toThrow(
          'failed assert: Bytes32: lt() - comparison invalid; one or both of the inputs exceed the field size',
        );

        expect(() =>
          bytes32Simulator.lt(overflowBytes, max256BitBytes),
        ).toThrow(
          'failed assert: Bytes32: toField() - inputs exceed the field size',
        );

        expect(() =>
          bytes32Simulator.lt(max256BitBytes, overflowBytes),
        ).toThrow(
          'failed assert: Bytes32: toField() - inputs exceed the field size',
        );

        // Test that the function returns a boolean
        expect(typeof bytes32Simulator.lt(zeroBytes, max256BitBytes)).toBe(
          'boolean',
        );
        expect(typeof bytes32Simulator.lt(max256BitBytes, zeroBytes)).toBe(
          'boolean',
        );

        // Test comparison with itself (should be false for lt)
        expect(bytes32Simulator.lt(max256BitBytes, max256BitBytes)).toBe(false);
      });
    });
  });

  describe('Comprehensive Tests', () => {
    describe('comparison consistency', () => {
      test('should provide consistent comparison results', () => {
        const a = createBytes(1n);
        const b = createBytes(2n);

        const lt = bytes32Simulator.lt(a, b);
        const lte = bytes32Simulator.lte(a, b);
        const gt = bytes32Simulator.gt(a, b);
        const gte = bytes32Simulator.gte(a, b);

        // The comparison should be consistent, even if not lexicographic
        expect(lt).toBe(!gt);
        expect(lte).toBe(!gt);
        expect(gte).toBe(!lt);
      });

      test('should handle equal values correctly', () => {
        const a = createBytes(1234567890123456789012345678901234567890n);
        const b = createBytes(1234567890123456789012345678901234567890n);

        const lt = bytes32Simulator.lt(a, b);
        const lte = bytes32Simulator.lte(a, b);
        const gt = bytes32Simulator.gt(a, b);
        const gte = bytes32Simulator.gte(a, b);

        expect(lt).toBe(false);
        expect(lte).toBe(true);
        expect(gt).toBe(false);
        expect(gte).toBe(true);
      });

      test('should handle comparison consistency across different byte patterns', () => {
        const patterns = [createBytes(1n), createBytes(2n)];

        for (let i = 0; i < patterns.length; i++) {
          for (let j = 0; j < patterns.length; j++) {
            const a = patterns[i];
            const b = patterns[j];

            expect(() => {
              const eq = bytes32Simulator.eq(a, b);
              const lt = bytes32Simulator.lt(a, b);
              const lte = bytes32Simulator.lte(a, b);
              const gt = bytes32Simulator.gt(a, b);
              const gte = bytes32Simulator.gte(a, b);

              expect(typeof eq).toBe('boolean');
              expect(typeof lt).toBe('boolean');
              expect(typeof lte).toBe('boolean');
              expect(typeof gt).toBe('boolean');
              expect(typeof gte).toBe('boolean');

              // Consistency checks
              if (i === j) {
                expect(eq).toBe(true);
                expect(lt).toBe(false);
                expect(gt).toBe(false);
                expect(lte).toBe(true);
                expect(gte).toBe(true);
              } else {
                expect(eq).toBe(false);
                expect(lt !== gt).toBe(true);
                expect(lte !== gt).toBe(true);
                expect(gte !== lt).toBe(true);
              }
            }).not.toThrow();
          }
        }
      });
    });

    describe('size and boundary tests', () => {
      test('should handle all 32-byte size constraints', () => {
        // Test that all operations work with exactly 32 bytes
        const bytes32 = new Uint8Array(32);
        bytes32.fill(0xff);

        expect(() => bytes32Simulator.fromBytes(bytes32)).not.toThrow();
        expect(() => bytes32Simulator.toBytes(1n)).not.toThrow();
        expect(() => bytes32Simulator.eq(bytes32, bytes32)).not.toThrow();
        expect(() => bytes32Simulator.lt(bytes32, bytes32)).not.toThrow();
        expect(() => bytes32Simulator.lte(bytes32, bytes32)).not.toThrow();
        expect(() => bytes32Simulator.gt(bytes32, bytes32)).not.toThrow();
        expect(() => bytes32Simulator.gte(bytes32, bytes32)).not.toThrow();
      });

      test('should handle field arithmetic boundaries', () => {
        // Test field values at various boundaries
        const boundaries = [
          0n,
          1n,
          2n ** 64n - 1n,
          2n ** 128n - 1n,
          2n ** 254n - 1n,
          2n ** 254n,
        ];

        for (const boundary of boundaries) {
          expect(() => {
            const bytes = bytes32Simulator.toBytes(boundary);
            expect(bytes).toBeInstanceOf(Uint8Array);
            expect(bytes.length).toBe(32);
          }).not.toThrow();
        }
      });
    });
  });
});
