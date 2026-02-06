import type { U256 } from '@src/artifacts/math/test/mocks/contracts/Bytes32.mock/contract/index.js';
import { Bytes32Simulator } from '@src/math/test/mocks/Bytes32Simulator.js';
import {
  MAX_UINT64,
  MAX_UINT128,
  MAX_UINT256,
} from '@src/math/utils/consts.js';
import { beforeEach, describe, expect, test } from 'vitest';

let bytes32Simulator: Bytes32Simulator;

const setup = () => {
  bytes32Simulator = new Bytes32Simulator();
};

// Helper to convert U256 to bigint
const fromU256 = (value: U256): bigint => {
  return (
    (value.high.high << 192n) +
    (value.high.low << 128n) +
    (value.low.high << 64n) +
    value.low.low
  );
};

// Helper to convert bigint to little-endian Uint8Array
const bigintToBytesLE = (value: bigint): Uint8Array => {
  const bytes = new Uint8Array(32);
  let remaining = value;
  for (let i = 0; i < 32; i++) {
    bytes[i] = Number(remaining & 0xffn);
    remaining >>= 8n;
  }
  return bytes;
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

  describe('toU256 (little-endian)', () => {
    test('should convert zero bytes to zero U256', () => {
      const bytes = new Uint8Array(32).fill(0);
      const result = bytes32Simulator.toU256(bytes);
      expect(fromU256(result)).toBe(0n);
    });

    test('should convert single byte value', () => {
      const bytes = new Uint8Array(32).fill(0);
      bytes[0] = 123;
      const result = bytes32Simulator.toU256(bytes);
      expect(result.low.low).toBe(123n);
      expect(result.low.high).toBe(0n);
      expect(result.high.low).toBe(0n);
      expect(result.high.high).toBe(0n);
    });

    test('should convert max byte value at position 0', () => {
      const bytes = new Uint8Array(32).fill(0);
      bytes[0] = 255;
      const result = bytes32Simulator.toU256(bytes);
      expect(result.low.low).toBe(255n);
    });

    test('should convert max U256 bytes', () => {
      const bytes = new Uint8Array(32).fill(255);
      const result = bytes32Simulator.toU256(bytes);
      expect(fromU256(result)).toBe(MAX_UINT256);
    });

    test('should handle value at 2^64 boundary (second limb)', () => {
      const bytes = new Uint8Array(32).fill(0);
      bytes[8] = 1; // Position 8 = 2^64
      const result = bytes32Simulator.toU256(bytes);
      expect(result.low.low).toBe(0n);
      expect(result.low.high).toBe(1n);
      expect(result.high.low).toBe(0n);
      expect(result.high.high).toBe(0n);
      expect(fromU256(result)).toBe(2n ** 64n);
    });

    test('should handle value at 2^128 boundary (third limb)', () => {
      const bytes = new Uint8Array(32).fill(0);
      bytes[16] = 1; // Position 16 = 2^128
      const result = bytes32Simulator.toU256(bytes);
      expect(result.low.low).toBe(0n);
      expect(result.low.high).toBe(0n);
      expect(result.high.low).toBe(1n);
      expect(result.high.high).toBe(0n);
      expect(fromU256(result)).toBe(2n ** 128n);
    });

    test('should handle value at 2^192 boundary (fourth limb)', () => {
      const bytes = new Uint8Array(32).fill(0);
      bytes[24] = 1; // Position 24 = 2^192
      const result = bytes32Simulator.toU256(bytes);
      expect(result.low.low).toBe(0n);
      expect(result.low.high).toBe(0n);
      expect(result.high.low).toBe(0n);
      expect(result.high.high).toBe(1n);
      expect(fromU256(result)).toBe(2n ** 192n);
    });

    test('should handle multi-byte value within first limb', () => {
      const bytes = new Uint8Array(32).fill(0);
      bytes[0] = 0xff;
      bytes[1] = 0xff; // 0xFFFF = 65535
      const result = bytes32Simulator.toU256(bytes);
      expect(result.low.low).toBe(65535n);
    });

    test('should handle value spanning limb boundary', () => {
      const bytes = new Uint8Array(32).fill(0);
      bytes[7] = 0xff; // End of first limb
      bytes[8] = 0x01; // Start of second limb
      const result = bytes32Simulator.toU256(bytes);
      expect(result.low.low).toBe(0xff00000000000000n);
      expect(result.low.high).toBe(1n);
    });

    test('should correctly convert arbitrary value', () => {
      const value = 123456789012345678901234567890n;
      const bytes = bigintToBytesLE(value);
      const result = bytes32Simulator.toU256(bytes);
      expect(fromU256(result)).toBe(value);
    });

    test('should correctly convert MAX_UINT64', () => {
      const bytes = bigintToBytesLE(MAX_UINT64);
      const result = bytes32Simulator.toU256(bytes);
      expect(result.low.low).toBe(MAX_UINT64);
      expect(result.low.high).toBe(0n);
    });

    test('should correctly convert MAX_UINT128', () => {
      const bytes = bigintToBytesLE(MAX_UINT128);
      const result = bytes32Simulator.toU256(bytes);
      expect(result.low.low).toBe(MAX_UINT64);
      expect(result.low.high).toBe(MAX_UINT64);
      expect(result.high.low).toBe(0n);
      expect(result.high.high).toBe(0n);
    });

    test('should handle all limbs non-zero', () => {
      const bytes = new Uint8Array(32);
      bytes[0] = 1; // low.low
      bytes[8] = 2; // low.high
      bytes[16] = 3; // high.low
      bytes[24] = 4; // high.high
      const result = bytes32Simulator.toU256(bytes);
      expect(result.low.low).toBe(1n);
      expect(result.low.high).toBe(2n);
      expect(result.high.low).toBe(3n);
      expect(result.high.high).toBe(4n);
    });

    test('should convert small values correctly', () => {
      const values = [1n, 127n, 255n, 256n, 1000n];
      for (const value of values) {
        const bytes = bigintToBytesLE(value);
        const result = bytes32Simulator.toU256(bytes);
        expect(fromU256(result)).toBe(value);
      }
    });

    test('should convert limb boundary values correctly', () => {
      const values = [
        MAX_UINT64,
        MAX_UINT64 + 1n,
        MAX_UINT128,
        MAX_UINT128 + 1n,
        2n ** 192n,
        2n ** 192n - 1n,
      ];
      for (const value of values) {
        const bytes = bigintToBytesLE(value);
        const result = bytes32Simulator.toU256(bytes);
        expect(fromU256(result)).toBe(value);
      }
    });

    test('should convert large values correctly', () => {
      const values = [
        2n ** 200n + 2n ** 100n + 1n,
        MAX_UINT256 - 1n,
        MAX_UINT256,
      ];
      for (const value of values) {
        const bytes = bigintToBytesLE(value);
        const result = bytes32Simulator.toU256(bytes);
        expect(fromU256(result)).toBe(value);
      }
    });

    test('should convert powers of 2 correctly', () => {
      for (let i = 0; i < 256; i += 32) {
        const value = 2n ** BigInt(i);
        const bytes = bigintToBytesLE(value);
        const result = bytes32Simulator.toU256(bytes);
        expect(fromU256(result)).toBe(value);
      }
    });
  });

  describe('toVector', () => {
    test('should convert zero bytes to zero vector', () => {
      const bytes = new Uint8Array(32).fill(0);
      const result = bytes32Simulator.toVector(bytes);
      expect(result).toHaveLength(32);
      expect(result.every((b) => b === 0n)).toBe(true);
    });

    test('should convert single byte to vector', () => {
      const bytes = new Uint8Array(32).fill(0);
      bytes[0] = 123;
      const result = bytes32Simulator.toVector(bytes);
      expect(result).toHaveLength(32);
      expect(result[0]).toBe(123n);
      expect(result.slice(1).every((b) => b === 0n)).toBe(true);
    });

    test('should convert max bytes to all-0xFF vector', () => {
      const bytes = new Uint8Array(32).fill(255);
      const result = bytes32Simulator.toVector(bytes);
      expect(result).toHaveLength(32);
      expect(result.every((b) => b === 255n)).toBe(true);
    });

    test('should roundtrip with toU256', () => {
      const value = 123456789012345678901234567890n;
      const bytes = bigintToBytesLE(value);
      const vec = bytes32Simulator.toVector(bytes);
      const reconstructed = new Uint8Array(vec.map((b) => Number(b)));
      expect(reconstructed).toEqual(bytes);
      const u256 = bytes32Simulator.toU256(reconstructed);
      expect(fromU256(u256)).toBe(value);
    });
  });

  describe('isZero', () => {
    test('should return true for zero bytes', () => {
      const bytes = new Uint8Array(32).fill(0);
      expect(bytes32Simulator.isZero(bytes)).toBe(true);
    });

    test('should return false for non-zero bytes', () => {
      const bytes = createBytes(1234567890123456789012345678901234567890n);
      expect(bytes32Simulator.isZero(bytes)).toBe(false);
    });

    test('should return false when single bit is set', () => {
      const bytes = new Uint8Array(32).fill(0);
      bytes[0] = 1;
      expect(bytes32Simulator.isZero(bytes)).toBe(false);
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
          expected: true, // 2^254 - 1 < 2^256 - 1
          shouldThrow: false,
        },
        {
          name: 'max256Bit vs maxFieldBytes',
          a: createBytes(2n ** 256n - 1n),
          b: createMaxFieldBytes(),
          expected: false, // 2^256 - 1 > 2^254 - 1
          shouldThrow: false,
        },
        {
          name: 'overflowBytes vs max256Bit',
          a: createOverflowBytes(),
          b: createBytes(2n ** 256n - 1n),
          expected: true, // 2^254 < 2^256 - 1
          shouldThrow: false,
        },
        {
          name: 'max256Bit vs overflowBytes',
          a: createBytes(2n ** 256n - 1n),
          b: createOverflowBytes(),
          expected: false, // 2^256 - 1 > 2^254
          shouldThrow: false,
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
      }) => {
        expect(() => bytes32Simulator.lt(a, b)).not.toThrow();
        expect(bytes32Simulator.lt(a, b)).toBe(expected);
        expect(typeof bytes32Simulator.lt(a, b)).toBe('boolean');
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

        expect(() => bytes32Simulator.toU256(bytes32)).not.toThrow();
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
            const bytes = bigintToBytesLE(boundary);
            const result = bytes32Simulator.toU256(bytes);
            expect(fromU256(result)).toBe(boundary);
          }).not.toThrow();
        }
      });
    });
  });
});
