import { beforeEach, describe, expect, test } from 'vitest';
import { Bytes32Simulator } from './mocks/Bytes32Simulator.js';

let bytes32Simulator: Bytes32Simulator;

const setup = () => {
  bytes32Simulator = new Bytes32Simulator();
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

/**
 * TODO: Fix in a separate PR
 *
 * These tests are skipped because Bytes32.compact depends on Field255 which is archived
 * due to Compact Uint limitations:
 * - v0.26.0: Max Uint<254> — Field values >= 2^254 truncated
 * - v0.27.0: Max Uint<248> (31 bytes) — Field values >= 2^248 truncated
 *
 * The JubJub scalar field requires 255 bits, but Compact cannot represent values >= 2^248.
 * See Field255.compact.archive and Bytes32.compact.archive for full details.
 */
describe.skip('Bytes32', () => {
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
          'Bytes32: toField() - inputs exceed the field size',
        );
      });

      test('should handle bytes with only last byte set to 0xF', () => {
        const bytes = createPatternBytes(0xf, 31);
        expect(() => bytes32Simulator.fromBytes(bytes)).toThrow(
          'Bytes32: toField() - inputs exceed the field size',
        );
      });

      test('should handle bytes with only last byte set to 0x01', () => {
        const bytes = createPatternBytes(0x01, 31);
        expect(() => bytes32Simulator.fromBytes(bytes)).toThrow(
          'Bytes32: toField() - inputs exceed the field size',
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

      // Helper function to create test cases for overflow comparisons
      const createOverflowTestCases = () => [
        {
          name: '2^254 + 1 vs 2^254 + 1000',
          a: createBytes(2n ** 254n + 1n),
          b: createBytes(2n ** 254n + 1000n),
          expected: false,
        },
        {
          name: '2^254 + 1000 vs 2^254 + 2000',
          a: createBytes(2n ** 254n + 1000n),
          b: createBytes(2n ** 254n + 2000n),
          expected: false,
        },
        {
          name: '2^254 vs 2^254 + 1',
          a: createBytes(2n ** 254n),
          b: createBytes(2n ** 254n + 1n),
          expected: false,
        },
        {
          name: '2^254 + 1 vs 2^255',
          a: createBytes(2n ** 254n + 1n),
          b: createBytes(2n ** 255n),
          expected: false,
        },
        {
          name: '2^255 vs 2^256 - 1',
          a: createBytes(2n ** 255n),
          b: createBytes(2n ** 256n - 1n),
          expected: false,
        },
        {
          name: 'overflow with valid field value',
          a: createMaxFieldBytes(), // 2^254 - 1 (valid)
          b: createBytes(2n ** 254n), // 2^254 (overflow)
          expected: false,
        },
        {
          name: 'zero with overflow value',
          a: new Uint8Array(32),
          b: createBytes(2n ** 254n),
          expected: false,
        },
        {
          name: '2^256 - 1 with 2^254 + 1',
          a: createBytes(2n ** 256n - 1n),
          b: createBytes(2n ** 254n + 1n),
          expected: false,
        },
        {
          name: '2^256 - 1 with 2^255',
          a: createBytes(2n ** 256n - 1n),
          b: createBytes(2n ** 255n),
          expected: false,
        },
        {
          name: '2^256 - 1 with zero',
          a: createBytes(2n ** 256n - 1n),
          b: new Uint8Array(32),
          expected: false,
        },
        {
          name: '2^256 - 1 with valid field value',
          a: createBytes(2n ** 256n - 1n),
          b: createMaxFieldBytes(), // 2^254 - 1
          expected: false,
        },
        {
          name: '2^256 - 1 with 2^254',
          a: createBytes(2n ** 256n - 1n),
          b: createBytes(2n ** 254n),
          expected: false,
        },
      ];

      // Helper function to create test cases for self-comparisons
      const createSelfComparisonTestCases = () => [
        {
          name: 'overflow value with itself (2^254 + 1)',
          value: createBytes(2n ** 254n + 1n),
          expected: true,
        },
        {
          name: '2^256 - 1 with itself',
          value: createBytes(2n ** 256n - 1n),
          expected: true,
        },
      ];

      test.each(
        createOverflowTestCases(),
      )('should return $expected when comparing $name', ({
        a,
        b,
        expected,
      }) => {
        expect(bytes32Simulator.eq(a, b)).toBe(expected);
      });

      test.each(
        createSelfComparisonTestCases(),
      )('should return $expected when comparing $name', ({
        value,
        expected,
      }) => {
        expect(bytes32Simulator.eq(value, value)).toBe(expected);
      });
    });
  });

  describe('Lexicographic Comparison Functions', () => {
    describe('lt', () => {
      // Helper function to create test cases for lt comparisons
      const createLtTestCases = () => [
        {
          name: 'zero vs max256Bit',
          a: new Uint8Array(32),
          b: createBytes(2n ** 256n - 1n),
          expected: true,
          shouldThrow: false,
        },
        {
          name: 'max256Bit vs zero',
          a: createBytes(2n ** 256n - 1n),
          b: new Uint8Array(32),
          expected: false,
          shouldThrow: false,
        },
        {
          name: 'one vs max256Bit',
          a: createBytes(1n),
          b: createBytes(2n ** 256n - 1n),
          expected: true,
          shouldThrow: false,
        },
        {
          name: 'max256Bit vs one',
          a: createBytes(2n ** 256n - 1n),
          b: createBytes(1n),
          expected: false,
          shouldThrow: false,
        },
        {
          name: 'maxFieldBytes vs max256Bit',
          a: createMaxFieldBytes(),
          b: createBytes(2n ** 256n - 1n),
          expected: null,
          shouldThrow: true,
          errorMessage:
            'Bytes32: lt() - comparison invalid; one or both of the inputs exceed the field size',
        },
        {
          name: 'max256Bit vs maxFieldBytes',
          a: createBytes(2n ** 256n - 1n),
          b: createMaxFieldBytes(),
          expected: null,
          shouldThrow: true,
          errorMessage:
            'Bytes32: lt() - comparison invalid; one or both of the inputs exceed the field size',
        },
        {
          name: 'overflowBytes vs max256Bit',
          a: createOverflowBytes(),
          b: createBytes(2n ** 256n - 1n),
          expected: null,
          shouldThrow: true,
          errorMessage: 'Bytes32: toField() - inputs exceed the field size',
        },
        {
          name: 'max256Bit vs overflowBytes',
          a: createBytes(2n ** 256n - 1n),
          b: createOverflowBytes(),
          expected: null,
          shouldThrow: true,
          errorMessage: 'Bytes32: toField() - inputs exceed the field size',
        },
        {
          name: 'max256Bit vs itself',
          a: createBytes(2n ** 256n - 1n),
          b: createBytes(2n ** 256n - 1n),
          expected: false,
          shouldThrow: false,
        },
      ];

      test.each(createLtTestCases())('should handle $name', ({
        a,
        b,
        expected,
        shouldThrow,
        errorMessage,
      }) => {
        if (shouldThrow) {
          expect(() => bytes32Simulator.lt(a, b)).toThrow(errorMessage);
        } else {
          expect(() => bytes32Simulator.lt(a, b)).not.toThrow();
          expect(bytes32Simulator.lt(a, b)).toBe(expected);
          expect(typeof bytes32Simulator.lt(a, b)).toBe('boolean');
        }
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
