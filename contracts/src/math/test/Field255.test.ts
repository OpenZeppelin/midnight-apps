import { MAX_FIELD } from '@midnight-ntwrk/compact-runtime';
import { beforeEach, describe, expect, test } from 'vitest';
import type {
  DivResultField,
  U256,
} from '../../../artifacts/math/test/mocks/contracts/Field255.mock/contract/index.js';
import { Field255Simulator } from './mocks/Field255Simulator.js';

let field255Simulator: Field255Simulator;

const setup = () => {
  field255Simulator = new Field255Simulator();
};

/**
 * Boundary values for comprehensive testing.
 */
const BOUNDARY_VALUES = [0n, 1n, 2n, MAX_FIELD - 1n, MAX_FIELD];

/**
 * Powers of 2 for testing.
 */
const POWERS_OF_2 = [
  1n, // 2^0
  2n, // 2^1
  4n, // 2^2
  256n, // 2^8
  65536n, // 2^16
  2n ** 32n, // 2^32
  2n ** 64n, // 2^64
  2n ** 128n, // 2^128
  2n ** 192n, // 2^192
  2n ** 254n, // 2^254 (close to MAX_FIELD)
];

/**
 * Helper to convert U256 struct to bigint.
 */
const fromU256 = (value: U256): bigint => {
  return (
    (value.high.high << 192n) +
    (value.high.low << 128n) +
    (value.low.high << 64n) +
    value.low.low
  );
};

/**
 * Helper to convert little-endian Uint8Array to bigint.
 */
const bytesLEToBigint = (bytes: Uint8Array): bigint => {
  let result = 0n;
  for (let i = bytes.length - 1; i >= 0; i--) {
    result = (result << 8n) | BigInt(bytes[i]);
  }
  return result;
};

describe('Field255', () => {
  beforeEach(setup);

  describe('isZero', () => {
    test('should return true for zero', () => {
      expect(field255Simulator.isZero(0n)).toBe(true);
    });

    test('should return false for one', () => {
      expect(field255Simulator.isZero(1n)).toBe(false);
    });

    test('should return false for arbitrary non-zero values', () => {
      expect(field255Simulator.isZero(123n)).toBe(false);
    });

    test('should return false for MAX_FIELD - 1', () => {
      expect(field255Simulator.isZero(MAX_FIELD - 1n)).toBe(false);
    });

    test('should return false for MAX_FIELD', () => {
      expect(field255Simulator.isZero(MAX_FIELD)).toBe(false);
    });
  });

  describe('toBytes', () => {
    test('should convert zero Field to zero bytes', () => {
      const result = field255Simulator.toBytes(0n);
      expect(result).toEqual(new Uint8Array(32).fill(0));
    });

    test('should convert small Field to bytes with correct first byte', () => {
      const result = field255Simulator.toBytes(123n);
      expect(result[0]).toBe(123);
      expect(result.slice(1)).toEqual(new Uint8Array(31).fill(0));
    });

    test('should convert large Field to bytes and back correctly', () => {
      const value = 123456789012345678901234567890n;
      const bytes = field255Simulator.toBytes(value);
      const backToValue = bytesLEToBigint(bytes);
      expect(backToValue).toBe(value);
    });

    test('should convert powers of 2 to bytes and back correctly', () => {
      for (const value of POWERS_OF_2) {
        const bytes = field255Simulator.toBytes(value);
        const backToValue = bytesLEToBigint(bytes);
        expect(backToValue).toBe(value);
      }
    });

    test('should convert MAX_FIELD to bytes and back correctly', () => {
      const bytes = field255Simulator.toBytes(MAX_FIELD);
      const backToValue = bytesLEToBigint(bytes);
      expect(backToValue).toBe(MAX_FIELD);
    });

    test('should convert MAX_FIELD - 1 to bytes and back correctly', () => {
      const bytes = field255Simulator.toBytes(MAX_FIELD - 1n);
      const backToValue = bytesLEToBigint(bytes);
      expect(backToValue).toBe(MAX_FIELD - 1n);
    });
  });

  describe('toU256', () => {
    test('should convert zero Field to zero U256', () => {
      const result = field255Simulator.toU256(0n);
      expect(fromU256(result)).toBe(0n);
    });

    test('should convert one to U256 with only low.low set', () => {
      const u256 = field255Simulator.toU256(1n);
      expect(u256.low.low).toBe(1n);
      expect(u256.low.high).toBe(0n);
      expect(u256.high.low).toBe(0n);
      expect(u256.high.high).toBe(0n);
    });

    test('should convert small Field to U256', () => {
      const result = field255Simulator.toU256(123n);
      expect(fromU256(result)).toBe(123n);
    });

    test('should convert large Field to U256', () => {
      const value = 123456789012345678901234567890n;
      const result = field255Simulator.toU256(value);
      expect(fromU256(result)).toBe(value);
    });

    test('should convert powers of 2 to U256 and back correctly', () => {
      for (const value of POWERS_OF_2) {
        const u256 = field255Simulator.toU256(value);
        expect(fromU256(u256)).toBe(value);
      }
    });

    test('should convert MAX_FIELD to U256 and back correctly', () => {
      const u256 = field255Simulator.toU256(MAX_FIELD);
      expect(fromU256(u256)).toBe(MAX_FIELD);
    });
  });

  describe('eq', () => {
    test('should return true for equal small values', () => {
      expect(field255Simulator.eq(123n, 123n)).toBe(true);
    });

    test('should return true for zero equals zero', () => {
      expect(field255Simulator.eq(0n, 0n)).toBe(true);
    });

    test('should return true for MAX_FIELD equals MAX_FIELD', () => {
      expect(field255Simulator.eq(MAX_FIELD, MAX_FIELD)).toBe(true);
    });

    test('should return false for adjacent values', () => {
      expect(field255Simulator.eq(123n, 124n)).toBe(false);
    });

    test('should return false for zero and one', () => {
      expect(field255Simulator.eq(0n, 1n)).toBe(false);
      expect(field255Simulator.eq(1n, 0n)).toBe(false);
    });

    test('should correctly compare all boundary value combinations', () => {
      for (const a of BOUNDARY_VALUES) {
        for (const b of BOUNDARY_VALUES) {
          expect(field255Simulator.eq(a, b)).toBe(a === b);
        }
      }
    });
  });

  describe('lt', () => {
    test('should return true when first value is smaller', () => {
      expect(field255Simulator.lt(5n, 10n)).toBe(true);
    });

    test('should return false when first value is larger', () => {
      expect(field255Simulator.lt(10n, 5n)).toBe(false);
    });

    test('should return false for equal values', () => {
      expect(field255Simulator.lt(5n, 5n)).toBe(false);
    });

    test('should return true for zero compared to one', () => {
      expect(field255Simulator.lt(0n, 1n)).toBe(true);
    });

    test('should return false for zero compared to zero', () => {
      expect(field255Simulator.lt(0n, 0n)).toBe(false);
    });

    test('should return false for one compared to zero', () => {
      expect(field255Simulator.lt(1n, 0n)).toBe(false);
    });

    test('should return true for MAX_FIELD - 1 compared to MAX_FIELD', () => {
      expect(field255Simulator.lt(MAX_FIELD - 1n, MAX_FIELD)).toBe(true);
    });

    test('should return false for MAX_FIELD compared to MAX_FIELD', () => {
      expect(field255Simulator.lt(MAX_FIELD, MAX_FIELD)).toBe(false);
    });

    test('should return false for MAX_FIELD compared to MAX_FIELD - 1', () => {
      expect(field255Simulator.lt(MAX_FIELD, MAX_FIELD - 1n)).toBe(false);
    });

    test('should correctly compare all boundary value combinations', () => {
      for (const a of BOUNDARY_VALUES) {
        for (const b of BOUNDARY_VALUES) {
          expect(field255Simulator.lt(a, b)).toBe(a < b);
        }
      }
    });

    test('should be transitive: if a < b and b < c then a < c', () => {
      const a = 10n;
      const b = 100n;
      const c = 1000n;

      expect(field255Simulator.lt(a, b)).toBe(true);
      expect(field255Simulator.lt(b, c)).toBe(true);
      expect(field255Simulator.lt(a, c)).toBe(true);
    });

    test('should be inverse of gt: a < b iff b > a', () => {
      const pairs = [
        [0n, 1n],
        [1n, 2n],
        [100n, MAX_FIELD],
        [2n ** 64n, 2n ** 128n],
      ];
      for (const [a, b] of pairs) {
        expect(field255Simulator.lt(a, b)).toBe(field255Simulator.gt(b, a));
        expect(field255Simulator.gt(a, b)).toBe(field255Simulator.lt(b, a));
      }
    });
  });

  describe('lte', () => {
    test('should return true when first value is smaller', () => {
      expect(field255Simulator.lte(5n, 10n)).toBe(true);
    });

    test('should return false when first value is larger', () => {
      expect(field255Simulator.lte(10n, 5n)).toBe(false);
    });

    test('should return true for equal values', () => {
      expect(field255Simulator.lte(5n, 5n)).toBe(true);
    });

    test('should return true for zero compared to one', () => {
      expect(field255Simulator.lte(0n, 1n)).toBe(true);
    });

    test('should return true for zero compared to zero', () => {
      expect(field255Simulator.lte(0n, 0n)).toBe(true);
    });

    test('should return false for one compared to zero', () => {
      expect(field255Simulator.lte(1n, 0n)).toBe(false);
    });

    test('should correctly compare all boundary value combinations', () => {
      for (const a of BOUNDARY_VALUES) {
        for (const b of BOUNDARY_VALUES) {
          expect(field255Simulator.lte(a, b)).toBe(a <= b);
        }
      }
    });

    test('should be inverse of gte: a <= b iff b >= a', () => {
      const pairs = [
        [0n, 0n],
        [0n, 1n],
        [1n, 1n],
        [100n, MAX_FIELD],
      ];
      for (const [a, b] of pairs) {
        expect(field255Simulator.lte(a, b)).toBe(field255Simulator.gte(b, a));
        expect(field255Simulator.gte(a, b)).toBe(field255Simulator.lte(b, a));
      }
    });
  });

  describe('gt', () => {
    test('should return true when first value is larger', () => {
      expect(field255Simulator.gt(10n, 5n)).toBe(true);
    });

    test('should return false when first value is smaller', () => {
      expect(field255Simulator.gt(5n, 10n)).toBe(false);
    });

    test('should return false for equal values', () => {
      expect(field255Simulator.gt(5n, 5n)).toBe(false);
    });

    test('should return true for one compared to zero', () => {
      expect(field255Simulator.gt(1n, 0n)).toBe(true);
    });

    test('should return false for zero compared to zero', () => {
      expect(field255Simulator.gt(0n, 0n)).toBe(false);
    });

    test('should return false for zero compared to one', () => {
      expect(field255Simulator.gt(0n, 1n)).toBe(false);
    });

    test('should correctly compare all boundary value combinations', () => {
      for (const a of BOUNDARY_VALUES) {
        for (const b of BOUNDARY_VALUES) {
          expect(field255Simulator.gt(a, b)).toBe(a > b);
        }
      }
    });
  });

  describe('gte', () => {
    test('should return true when first value is larger', () => {
      expect(field255Simulator.gte(10n, 5n)).toBe(true);
    });

    test('should return false when first value is smaller', () => {
      expect(field255Simulator.gte(5n, 10n)).toBe(false);
    });

    test('should return true for equal values', () => {
      expect(field255Simulator.gte(5n, 5n)).toBe(true);
    });

    test('should return true for one compared to zero', () => {
      expect(field255Simulator.gte(1n, 0n)).toBe(true);
    });

    test('should return true for zero compared to zero', () => {
      expect(field255Simulator.gte(0n, 0n)).toBe(true);
    });

    test('should return false for zero compared to one', () => {
      expect(field255Simulator.gte(0n, 1n)).toBe(false);
    });

    test('should correctly compare all boundary value combinations', () => {
      for (const a of BOUNDARY_VALUES) {
        for (const b of BOUNDARY_VALUES) {
          expect(field255Simulator.gte(a, b)).toBe(a >= b);
        }
      }
    });
  });

  describe('add', () => {
    test('should add small numbers correctly', () => {
      expect(field255Simulator.add(5n, 3n)).toBe(8n);
    });

    test('should return zero when adding zero and zero', () => {
      expect(field255Simulator.add(0n, 0n)).toBe(0n);
    });

    test('should return the same value when adding zero (additive identity)', () => {
      const values = [0n, 1n, 123n, 2n ** 64n, MAX_FIELD];
      for (const a of values) {
        expect(field255Simulator.add(a, 0n)).toBe(a);
        expect(field255Simulator.add(0n, a)).toBe(a);
      }
    });

    test('should handle addition near MAX_FIELD boundary', () => {
      expect(field255Simulator.add(MAX_FIELD - 1n, 1n)).toBe(MAX_FIELD);
      expect(field255Simulator.add(MAX_FIELD, 0n)).toBe(MAX_FIELD);
      expect(field255Simulator.add(MAX_FIELD - 100n, 50n)).toBe(
        MAX_FIELD - 50n,
      );
    });

    test('should handle large numbers correctly', () => {
      const large1 = MAX_FIELD - 1000n;
      const large2 = 500n;
      const result = field255Simulator.add(large1, large2);
      expect(result).toBe(MAX_FIELD - 500n);
    });

    test('should add powers of 2 correctly', () => {
      expect(field255Simulator.add(2n ** 64n, 2n ** 64n)).toBe(2n ** 65n);
      expect(field255Simulator.add(2n ** 128n, 2n ** 128n)).toBe(2n ** 129n);
    });

    test('should be commutative: a + b = b + a', () => {
      const a = 123n;
      const b = 456n;
      expect(field255Simulator.add(a, b)).toBe(field255Simulator.add(b, a));
    });

    test('should be associative: (a + b) + c = a + (b + c)', () => {
      const a = 123n;
      const b = 456n;
      const c = 789n;
      const leftAssoc = field255Simulator.add(field255Simulator.add(a, b), c);
      const rightAssoc = field255Simulator.add(a, field255Simulator.add(b, c));
      expect(leftAssoc).toBe(rightAssoc);
    });

    // OVERFLOW BEHAVIOR TESTS - Safe add should throw on overflow
    describe('overflow behavior', () => {
      test('should throw on overflow when MAX_FIELD + 1', () => {
        expect(() => field255Simulator.add(MAX_FIELD, 1n)).toThrowError(
          'failed assert: Field255: addition overflow',
        );
      });

      test('should throw on overflow when MAX_FIELD + 2', () => {
        expect(() => field255Simulator.add(MAX_FIELD, 2n)).toThrowError(
          'failed assert: Field255: addition overflow',
        );
      });

      test('should throw on overflow when adding two large values', () => {
        expect(() => field255Simulator.add(MAX_FIELD - 10n, 20n)).toThrowError(
          'failed assert: Field255: addition overflow',
        );
      });

      test('should throw on overflow when adding MAX_FIELD to itself', () => {
        expect(() => field255Simulator.add(MAX_FIELD, MAX_FIELD)).toThrowError(
          'failed assert: Field255: addition overflow',
        );
      });
    });
  });

  describe('unsafeAdd', () => {
    test('should add small numbers correctly when no overflow', () => {
      expect(field255Simulator.unsafeAdd(5n, 3n)).toBe(8n);
      expect(field255Simulator.unsafeAdd(0n, 0n)).toBe(0n);
      expect(field255Simulator.unsafeAdd(1n, 0n)).toBe(1n);
    });

    test('should wrap around when MAX_FIELD + 1 (modular arithmetic)', () => {
      // MAX_FIELD + 1 should wrap to 0 due to modular arithmetic
      const result = field255Simulator.unsafeAdd(MAX_FIELD, 1n);
      expect(result).toBe(0n);
    });

    test('should wrap around when MAX_FIELD + 2 (modular arithmetic)', () => {
      // MAX_FIELD + 2 should wrap to 1 due to modular arithmetic
      const result = field255Simulator.unsafeAdd(MAX_FIELD, 2n);
      expect(result).toBe(1n);
    });

    test('should wrap around when adding two large values that overflow', () => {
      // (MAX_FIELD - 10) + 20 should wrap to 9
      const result = field255Simulator.unsafeAdd(MAX_FIELD - 10n, 20n);
      expect(result).toBe(9n);
    });

    test('should wrap when adding MAX_FIELD to itself', () => {
      // MAX_FIELD + MAX_FIELD should wrap to MAX_FIELD - 1 (modular)
      const result = field255Simulator.unsafeAdd(MAX_FIELD, MAX_FIELD);
      expect(result).toBe(MAX_FIELD - 1n);
    });
  });

  describe('sub', () => {
    test('should subtract small numbers correctly', () => {
      expect(field255Simulator.sub(10n, 3n)).toBe(7n);
    });

    test('should return zero when subtracting equal values', () => {
      const values = [0n, 1n, 123n, 2n ** 64n, MAX_FIELD];
      for (const a of values) {
        expect(field255Simulator.sub(a, a)).toBe(0n);
      }
    });

    test('should return zero when subtracting zero from zero', () => {
      expect(field255Simulator.sub(0n, 0n)).toBe(0n);
    });

    test('should return the same value when subtracting zero (subtractive identity)', () => {
      const values = [0n, 1n, 123n, 2n ** 64n, MAX_FIELD];
      for (const a of values) {
        expect(field255Simulator.sub(a, 0n)).toBe(a);
      }
    });

    test('should handle subtraction near MAX_FIELD correctly', () => {
      expect(field255Simulator.sub(MAX_FIELD, 1n)).toBe(MAX_FIELD - 1n);
      expect(field255Simulator.sub(MAX_FIELD, 0n)).toBe(MAX_FIELD);
    });

    test('should handle subtraction near zero boundary correctly', () => {
      expect(field255Simulator.sub(100n, 50n)).toBe(50n);
      expect(field255Simulator.sub(1n, 1n)).toBe(0n);
    });

    test('should throw on underflow when subtracting larger from smaller', () => {
      expect(() => field255Simulator.sub(5n, 10n)).toThrowError(
        'failed assert: Field255: subtraction underflow',
      );
    });

    test('should throw on underflow when subtracting from zero', () => {
      expect(() => field255Simulator.sub(0n, 1n)).toThrowError(
        'failed assert: Field255: subtraction underflow',
      );
    });

    test('should throw on underflow when subtracting MAX_FIELD from smaller value', () => {
      expect(() =>
        field255Simulator.sub(MAX_FIELD - 1n, MAX_FIELD),
      ).toThrowError('failed assert: Field255: subtraction underflow');
    });
  });

  describe('unsafeSub', () => {
    test('should subtract small numbers correctly when a >= b', () => {
      expect(field255Simulator.unsafeSub(10n, 3n)).toBe(7n);
      expect(field255Simulator.unsafeSub(5n, 5n)).toBe(0n);
      expect(field255Simulator.unsafeSub(0n, 0n)).toBe(0n);
    });

    test('should wrap around when subtracting larger from smaller (modular arithmetic)', () => {
      // In field arithmetic: 5 - 10 = -5 ≡ field_order - 5 (mod field_order)
      // field_order = MAX_FIELD + 1
      const result = field255Simulator.unsafeSub(5n, 10n);
      const fieldOrder = MAX_FIELD + 1n;
      const expected = fieldOrder - 5n; // This equals MAX_FIELD - 4
      expect(result).toBe(expected);
    });

    test('should wrap around when subtracting from zero', () => {
      // 0 - 1 = -1 ≡ field_order - 1 = MAX_FIELD (mod field_order)
      const result = field255Simulator.unsafeSub(0n, 1n);
      expect(result).toBe(MAX_FIELD);
    });

    test('should wrap around when subtracting MAX_FIELD from smaller value', () => {
      // (MAX_FIELD - 1) - MAX_FIELD = -1 ≡ MAX_FIELD (mod field_order)
      const result = field255Simulator.unsafeSub(MAX_FIELD - 1n, MAX_FIELD);
      expect(result).toBe(MAX_FIELD);
    });

    test('should return the same value when subtracting zero', () => {
      const values = [0n, 1n, 123n, 2n ** 64n, MAX_FIELD];
      for (const a of values) {
        expect(field255Simulator.unsafeSub(a, 0n)).toBe(a);
      }
    });

    test('should handle MAX_FIELD subtraction correctly', () => {
      expect(field255Simulator.unsafeSub(MAX_FIELD, 1n)).toBe(MAX_FIELD - 1n);
      expect(field255Simulator.unsafeSub(MAX_FIELD, MAX_FIELD)).toBe(0n);
    });
  });

  describe('mul', () => {
    test('should multiply small numbers correctly', () => {
      expect(field255Simulator.mul(5n, 3n)).toBe(15n);
    });

    test('should return zero when multiplying by zero (multiplicative zero)', () => {
      const values = [0n, 1n, 123n, 2n ** 64n, MAX_FIELD];
      for (const a of values) {
        expect(field255Simulator.mul(a, 0n)).toBe(0n);
        expect(field255Simulator.mul(0n, a)).toBe(0n);
      }
    });

    test('should return the same value when multiplying by one (multiplicative identity)', () => {
      const values = [0n, 1n, 123n, 2n ** 64n, MAX_FIELD];
      for (const a of values) {
        expect(field255Simulator.mul(a, 1n)).toBe(a);
        expect(field255Simulator.mul(1n, a)).toBe(a);
      }
    });

    test('should handle MAX_FIELD multiplied by one correctly', () => {
      expect(field255Simulator.mul(MAX_FIELD, 1n)).toBe(MAX_FIELD);
      expect(field255Simulator.mul(1n, MAX_FIELD)).toBe(MAX_FIELD);
    });

    test('should handle large numbers correctly', () => {
      const large1 = 1000n;
      const large2 = 2000n;
      const result = field255Simulator.mul(large1, large2);
      expect(result).toBe(2000000n);
    });

    test('should multiply powers of 2 correctly', () => {
      expect(field255Simulator.mul(2n ** 32n, 2n ** 32n)).toBe(2n ** 64n);
      expect(field255Simulator.mul(2n ** 64n, 2n ** 64n)).toBe(2n ** 128n);
    });

    test('should handle multiplication of values that fit in 128 bits', () => {
      const a = 2n ** 63n;
      const b = 2n ** 63n;
      expect(field255Simulator.mul(a, b)).toBe(2n ** 126n);
    });

    test('should be commutative: a * b = b * a', () => {
      const a = 123n;
      const b = 456n;
      expect(field255Simulator.mul(a, b)).toBe(field255Simulator.mul(b, a));
    });

    test('should be distributive: a * (b + c) = a * b + a * c', () => {
      const a = 123n;
      const b = 456n;
      const c = 789n;
      const leftDist = field255Simulator.mul(a, field255Simulator.add(b, c));
      const rightDist = field255Simulator.add(
        field255Simulator.mul(a, b),
        field255Simulator.mul(a, c),
      );
      expect(leftDist).toBe(rightDist);
    });

    // OVERFLOW BEHAVIOR TESTS - Safe mul should throw on overflow
    describe('overflow behavior', () => {
      test('should throw on overflow when 2 * MAX_FIELD', () => {
        expect(() => field255Simulator.mul(2n, MAX_FIELD)).toThrowError(
          'failed assert: Field255: multiplication overflow',
        );
      });

      test('should throw on overflow when squaring MAX_FIELD', () => {
        expect(() => field255Simulator.mul(MAX_FIELD, MAX_FIELD)).toThrowError(
          'failed assert: Field255: multiplication overflow',
        );
      });

      test('should throw on overflow when multiplying two mid-range values that overflow', () => {
        const sqrtMaxField = 2n ** 127n; // approximately sqrt(MAX_FIELD)
        expect(() =>
          field255Simulator.mul(sqrtMaxField, sqrtMaxField),
        ).toThrowError('failed assert: Field255: multiplication overflow');
      });

      test('should throw on overflow when product just exceeds MAX_FIELD', () => {
        expect(() => field255Simulator.mul(MAX_FIELD - 1n, 2n)).toThrowError(
          'failed assert: Field255: multiplication overflow',
        );
      });
    });
  });

  describe('unsafeMul', () => {
    test('should multiply small numbers correctly when no overflow', () => {
      expect(field255Simulator.unsafeMul(5n, 3n)).toBe(15n);
      expect(field255Simulator.unsafeMul(0n, 5n)).toBe(0n);
      expect(field255Simulator.unsafeMul(1n, 5n)).toBe(5n);
    });

    test('should return zero when multiplying by zero', () => {
      expect(field255Simulator.unsafeMul(MAX_FIELD, 0n)).toBe(0n);
      expect(field255Simulator.unsafeMul(0n, MAX_FIELD)).toBe(0n);
    });

    test('should wrap around when multiplying causes overflow', () => {
      // 2 * MAX_FIELD should wrap
      const result = field255Simulator.unsafeMul(2n, MAX_FIELD);
      // Expected: (2 * MAX_FIELD) mod (MAX_FIELD + 1) = MAX_FIELD - 1
      expect(result).toBe(MAX_FIELD - 1n);
    });

    test('should wrap around when squaring a large value', () => {
      // (MAX_FIELD) * (MAX_FIELD) should wrap
      const result = field255Simulator.unsafeMul(MAX_FIELD, MAX_FIELD);
      // Expected: MAX_FIELD^2 mod (MAX_FIELD + 1) = 1
      expect(result).toBe(1n);
    });

    test('should wrap when multiplying two mid-range values that overflow', () => {
      // sqrt(MAX_FIELD) * sqrt(MAX_FIELD) should overflow
      const sqrtMaxField = 2n ** 127n; // approximately sqrt(MAX_FIELD)
      const result = field255Simulator.unsafeMul(sqrtMaxField, sqrtMaxField);
      // Expected: 2^254 mod (MAX_FIELD + 1)
      const expected = 2n ** 254n % (MAX_FIELD + 1n);
      expect(result).toBe(expected);
    });

    test('should wrap when product just exceeds MAX_FIELD', () => {
      // (MAX_FIELD - 1) * 2 should wrap
      const result = field255Simulator.unsafeMul(MAX_FIELD - 1n, 2n);
      // Expected: (2*MAX_FIELD - 2) mod (MAX_FIELD + 1) = MAX_FIELD - 3
      expect(result).toBe(MAX_FIELD - 3n);
    });
  });

  describe('div', () => {
    test('should divide small numbers correctly', () => {
      expect(field255Simulator.div(10n, 2n)).toBe(5n);
      expect(field255Simulator.div(15n, 3n)).toBe(5n);
    });

    test('should return zero when dividing zero by any non-zero value', () => {
      expect(field255Simulator.div(0n, 5n)).toBe(0n);
      expect(field255Simulator.div(0n, 1n)).toBe(0n);
      expect(field255Simulator.div(0n, MAX_FIELD)).toBe(0n);
    });

    test('should return the same value when dividing by one', () => {
      expect(field255Simulator.div(123n, 1n)).toBe(123n);
      expect(field255Simulator.div(0n, 1n)).toBe(0n);
      expect(field255Simulator.div(1n, 1n)).toBe(1n);
      expect(field255Simulator.div(MAX_FIELD, 1n)).toBe(MAX_FIELD);
    });

    test('should return one when dividing a value by itself', () => {
      expect(field255Simulator.div(5n, 5n)).toBe(1n);
      expect(field255Simulator.div(MAX_FIELD, MAX_FIELD)).toBe(1n);
    });

    test('should return zero when dividend is less than divisor', () => {
      expect(field255Simulator.div(3n, 5n)).toBe(0n);
      expect(field255Simulator.div(1n, MAX_FIELD)).toBe(0n);
    });

    test('should handle exact division correctly', () => {
      expect(field255Simulator.div(100n, 10n)).toBe(10n);
      expect(field255Simulator.div(100n, 25n)).toBe(4n);
    });

    test('should return floor of quotient for division with remainder', () => {
      expect(field255Simulator.div(10n, 3n)).toBe(3n);
      expect(field255Simulator.div(11n, 3n)).toBe(3n);
    });

    test('should handle division with MAX_FIELD as divisor correctly', () => {
      expect(field255Simulator.div(MAX_FIELD, MAX_FIELD)).toBe(1n);
      expect(field255Simulator.div(MAX_FIELD - 1n, MAX_FIELD)).toBe(0n);
    });

    test('should handle division with large dividend and small divisor', () => {
      expect(field255Simulator.div(MAX_FIELD, 2n)).toBe(MAX_FIELD / 2n);
      expect(field255Simulator.div(2n ** 200n, 2n ** 100n)).toBe(2n ** 100n);
    });

    test('should divide powers of 2 correctly', () => {
      expect(field255Simulator.div(2n ** 64n, 2n ** 32n)).toBe(2n ** 32n);
      expect(field255Simulator.div(2n ** 128n, 2n ** 64n)).toBe(2n ** 64n);
    });

    test('should throw on division by zero', () => {
      expect(() => field255Simulator.div(0n, 0n)).toThrow();
      expect(() => field255Simulator.div(1n, 0n)).toThrow();
      expect(() => field255Simulator.div(5n, 0n)).toThrow();
      expect(() => field255Simulator.div(MAX_FIELD, 0n)).toThrow();
    });
  });

  describe('rem', () => {
    test('should compute remainder for small numbers correctly', () => {
      expect(field255Simulator.rem(10n, 3n)).toBe(1n);
      expect(field255Simulator.rem(11n, 3n)).toBe(2n);
      expect(field255Simulator.rem(12n, 3n)).toBe(0n);
    });

    test('should return zero when dividend is zero', () => {
      expect(field255Simulator.rem(0n, 5n)).toBe(0n);
      expect(field255Simulator.rem(0n, 1n)).toBe(0n);
      expect(field255Simulator.rem(0n, MAX_FIELD)).toBe(0n);
    });

    test('should return zero when dividing by one', () => {
      expect(field255Simulator.rem(0n, 1n)).toBe(0n);
      expect(field255Simulator.rem(MAX_FIELD, 1n)).toBe(0n);
    });

    test('should return zero when dividend equals divisor', () => {
      expect(field255Simulator.rem(5n, 5n)).toBe(0n);
      expect(field255Simulator.rem(MAX_FIELD, MAX_FIELD)).toBe(0n);
    });

    test('should return the dividend when dividend is less than divisor', () => {
      expect(field255Simulator.rem(3n, 5n)).toBe(3n);
      expect(field255Simulator.rem(1n, MAX_FIELD)).toBe(1n);
    });

    test('should return zero for exact division', () => {
      expect(field255Simulator.rem(100n, 10n)).toBe(0n);
      expect(field255Simulator.rem(100n, 25n)).toBe(0n);
    });

    test('should handle remainder with MAX_FIELD as divisor correctly', () => {
      expect(field255Simulator.rem(MAX_FIELD, MAX_FIELD)).toBe(0n);
      expect(field255Simulator.rem(MAX_FIELD - 1n, MAX_FIELD)).toBe(
        MAX_FIELD - 1n,
      );
    });

    test('should throw on remainder by zero', () => {
      expect(() => field255Simulator.rem(0n, 0n)).toThrow();
      expect(() => field255Simulator.rem(1n, 0n)).toThrow();
      expect(() => field255Simulator.rem(5n, 0n)).toThrow();
      expect(() => field255Simulator.rem(MAX_FIELD, 0n)).toThrow();
    });
  });

  describe('divRem', () => {
    test('should compute both quotient and remainder correctly', () => {
      const result: DivResultField = field255Simulator.divRem(10n, 3n);
      expect(result.quotient).toBe(3n);
      expect(result.remainder).toBe(1n);
    });

    test('should return zero remainder for exact division', () => {
      const result: DivResultField = field255Simulator.divRem(100n, 10n);
      expect(result.quotient).toBe(10n);
      expect(result.remainder).toBe(0n);
    });

    test('should match separate div and rem results', () => {
      const a = 17n;
      const b = 5n;
      const divResult = field255Simulator.div(a, b);
      const remResult = field255Simulator.rem(a, b);
      const divRemResult: DivResultField = field255Simulator.divRem(a, b);

      expect(divRemResult.quotient).toBe(divResult);
      expect(divRemResult.remainder).toBe(remResult);
    });

    test('should satisfy quotient * divisor + remainder = dividend', () => {
      const testCases = [
        { a: 0n, b: 1n },
        { a: 1n, b: 1n },
        { a: 10n, b: 3n },
        { a: 100n, b: 7n },
        { a: 1000n, b: 17n },
        { a: 2n ** 64n, b: 2n ** 32n },
        { a: MAX_FIELD, b: 2n },
        { a: MAX_FIELD, b: MAX_FIELD },
        { a: MAX_FIELD - 1n, b: MAX_FIELD },
      ];

      for (const { a, b } of testCases) {
        const result = field255Simulator.divRem(a, b);
        const reconstructed = field255Simulator.add(
          field255Simulator.mul(result.quotient, b),
          result.remainder,
        );
        expect(reconstructed).toBe(a);
      }
    });

    test('should ensure remainder is less than divisor', () => {
      const testCases = [
        { a: 0n, b: 1n },
        { a: 10n, b: 3n },
        { a: MAX_FIELD, b: 2n },
        { a: MAX_FIELD - 1n, b: MAX_FIELD },
      ];

      for (const { a, b } of testCases) {
        const result = field255Simulator.divRem(a, b);
        expect(field255Simulator.lt(result.remainder, b)).toBe(true);
      }
    });

    test('should throw on divRem by zero', () => {
      expect(() => field255Simulator.divRem(0n, 0n)).toThrow();
      expect(() => field255Simulator.divRem(1n, 0n)).toThrow();
      expect(() => field255Simulator.divRem(MAX_FIELD, 0n)).toThrow();
    });
  });

  describe('sqrt', () => {
    test('should compute square root of zero correctly', () => {
      expect(field255Simulator.sqrt(0n)).toBe(0n);
    });

    test('should compute square root of one correctly', () => {
      expect(field255Simulator.sqrt(1n)).toBe(1n);
    });

    test('should compute square root of small perfect squares correctly', () => {
      expect(field255Simulator.sqrt(4n)).toBe(2n);
      expect(field255Simulator.sqrt(9n)).toBe(3n);
      expect(field255Simulator.sqrt(16n)).toBe(4n);
      expect(field255Simulator.sqrt(25n)).toBe(5n);
    });

    test('should compute floor of square root for non-perfect squares', () => {
      expect(field255Simulator.sqrt(2n)).toBe(1n);
      expect(field255Simulator.sqrt(3n)).toBe(1n);
      expect(field255Simulator.sqrt(5n)).toBe(2n);
      expect(field255Simulator.sqrt(6n)).toBe(2n);
      expect(field255Simulator.sqrt(7n)).toBe(2n);
      expect(field255Simulator.sqrt(8n)).toBe(2n);
      expect(field255Simulator.sqrt(10n)).toBe(3n);
    });

    test('should compute floor of square root for values just above perfect squares', () => {
      expect(field255Simulator.sqrt(2n)).toBe(1n); // sqrt(2) = 1 (floor)
      expect(field255Simulator.sqrt(5n)).toBe(2n); // sqrt(5) = 2 (floor)
      expect(field255Simulator.sqrt(10n)).toBe(3n); // sqrt(10) = 3 (floor)
      expect(field255Simulator.sqrt(17n)).toBe(4n); // sqrt(17) = 4 (floor)
      expect(field255Simulator.sqrt(26n)).toBe(5n); // sqrt(26) = 5 (floor)
    });

    test('should compute floor of square root for values just below perfect squares', () => {
      expect(field255Simulator.sqrt(3n)).toBe(1n); // sqrt(3) = 1 (floor)
      expect(field255Simulator.sqrt(8n)).toBe(2n); // sqrt(8) = 2 (floor)
      expect(field255Simulator.sqrt(15n)).toBe(3n); // sqrt(15) = 3 (floor)
      expect(field255Simulator.sqrt(24n)).toBe(4n); // sqrt(24) = 4 (floor)
      expect(field255Simulator.sqrt(35n)).toBe(5n); // sqrt(35) = 5 (floor)
    });

    test('should handle large numbers correctly', () => {
      expect(field255Simulator.sqrt(10000n)).toBe(100n);
      expect(field255Simulator.sqrt(1000000n)).toBe(1000n);
    });

    test('should compute square root of powers of 2 correctly', () => {
      expect(field255Simulator.sqrt(1n)).toBe(1n);
      expect(field255Simulator.sqrt(4n)).toBe(2n);
      expect(field255Simulator.sqrt(16n)).toBe(4n);
      expect(field255Simulator.sqrt(256n)).toBe(16n);
      expect(field255Simulator.sqrt(65536n)).toBe(256n);
      expect(field255Simulator.sqrt(2n ** 32n)).toBe(2n ** 16n);
      expect(field255Simulator.sqrt(2n ** 64n)).toBe(2n ** 32n);
      expect(field255Simulator.sqrt(2n ** 128n)).toBe(2n ** 64n);
    });

    test('should compute square root of large perfect squares correctly', () => {
      expect(field255Simulator.sqrt((10n ** 20n) ** 2n)).toBe(10n ** 20n);
    });

    test('should satisfy root^2 <= radicand < (root+1)^2', () => {
      const testValues = [2n, 3n, 5n, 10n, 100n, 1000n, 2n ** 64n + 1n];

      for (const value of testValues) {
        const root = field255Simulator.sqrt(value);
        const rootSquared = field255Simulator.mul(root, root);
        const nextSquared = field255Simulator.mul(
          field255Simulator.add(root, 1n),
          field255Simulator.add(root, 1n),
        );

        expect(field255Simulator.lte(rootSquared, value)).toBe(true);
        expect(field255Simulator.gt(nextSquared, value)).toBe(true);
      }
    });
  });

  describe('min', () => {
    test('should return the smaller of two different values', () => {
      expect(field255Simulator.min(5n, 10n)).toBe(5n);
      expect(field255Simulator.min(10n, 5n)).toBe(5n);
    });

    test('should return the same value when both values are equal', () => {
      const values = [0n, 1n, 123n, 2n ** 64n, MAX_FIELD];
      for (const a of values) {
        expect(field255Simulator.min(a, a)).toBe(a);
      }
    });

    test('should return zero when comparing with zero', () => {
      expect(field255Simulator.min(0n, 1n)).toBe(0n);
      expect(field255Simulator.min(1n, 0n)).toBe(0n);
      expect(field255Simulator.min(0n, 0n)).toBe(0n);
    });

    test('should handle large numbers correctly', () => {
      expect(field255Simulator.min(MAX_FIELD, MAX_FIELD - 1n)).toBe(
        MAX_FIELD - 1n,
      );
      expect(field255Simulator.min(MAX_FIELD - 1n, MAX_FIELD)).toBe(
        MAX_FIELD - 1n,
      );
    });

    test('should satisfy min(a, b) + (max(a, b) - min(a, b)) = max(a, b)', () => {
      const pairs = [
        [0n, 1n],
        [1n, MAX_FIELD],
        [123n, 456n],
        [2n ** 64n, 2n ** 128n],
      ];
      for (const [a, b] of pairs) {
        const minVal = field255Simulator.min(a, b);
        const maxVal = field255Simulator.max(a, b);
        expect(
          field255Simulator.add(minVal, field255Simulator.sub(maxVal, minVal)),
        ).toBe(maxVal);
      }
    });
  });

  describe('max', () => {
    test('should return the larger of two different values', () => {
      expect(field255Simulator.max(5n, 10n)).toBe(10n);
      expect(field255Simulator.max(10n, 5n)).toBe(10n);
    });

    test('should return the same value when both values are equal', () => {
      const values = [0n, 1n, 123n, 2n ** 64n, MAX_FIELD];
      for (const a of values) {
        expect(field255Simulator.max(a, a)).toBe(a);
      }
    });

    test('should return the non-zero value when comparing with zero', () => {
      expect(field255Simulator.max(0n, 1n)).toBe(1n);
      expect(field255Simulator.max(1n, 0n)).toBe(1n);
      expect(field255Simulator.max(0n, 0n)).toBe(0n);
    });

    test('should handle large numbers correctly', () => {
      expect(field255Simulator.max(MAX_FIELD, MAX_FIELD - 1n)).toBe(MAX_FIELD);
      expect(field255Simulator.max(MAX_FIELD - 1n, MAX_FIELD)).toBe(MAX_FIELD);
    });
  });
});
