import { beforeEach, describe, expect, test } from 'vitest';
import type { U256 } from '../artifacts/Index/contract/index.d.cts';
import { MAX_UINT64 } from '../utils/consts';
import { Field254Simulator } from './Field254Simulator';

let fieldSimulator: Field254Simulator;

const setup = () => {
  fieldSimulator = new Field254Simulator();
};

// Helper to convert bigint to U256
const toU256 = (value: bigint): U256 => {
  const lowBigInt = value & ((1n << 128n) - 1n);
  const highBigInt = value >> 128n;
  return {
    low: { low: lowBigInt & MAX_UINT64, high: lowBigInt >> 64n },
    high: { low: highBigInt & MAX_UINT64, high: highBigInt >> 64n },
  };
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

// Field modulus (2^254 - 1)
const FIELD_MODULUS = 2n ** 254n - 1n;

describe('Field254', () => {
  beforeEach(setup);

  describe('isZero', () => {
    test('should return true for zero', () => {
      expect(fieldSimulator.isZero(0n)).toBe(true);
    });

    test('should return false for non-zero values', () => {
      expect(fieldSimulator.isZero(1n)).toBe(false);
      expect(fieldSimulator.isZero(123n)).toBe(false);
      expect(fieldSimulator.isZero(FIELD_MODULUS)).toBe(false);
    });
  });

  describe('fromField and toField', () => {
    test('should convert field values correctly', () => {
      const testValues = [0n, 1n, 123n, 1000n, FIELD_MODULUS];

      for (const value of testValues) {
        const u256 = fieldSimulator.fromField(value);
        const backToField = fieldSimulator.toField(u256);
        expect(backToField).toBe(value);
      }
    });

    test('should handle U256 conversion correctly', () => {
      const u256 = toU256(123n);
      const field = fieldSimulator.toField(u256);
      const backToU256 = fieldSimulator.fromField(field);
      expect(fromU256(backToU256)).toBe(123n);
    });
  });

  describe('eq', () => {
    test('should compare equal values', () => {
      expect(fieldSimulator.eq(123n, 123n)).toBe(true);
      expect(fieldSimulator.eq(0n, 0n)).toBe(true);
      expect(fieldSimulator.eq(FIELD_MODULUS, FIELD_MODULUS)).toBe(true);
    });

    test('should compare different values', () => {
      expect(fieldSimulator.eq(123n, 124n)).toBe(false);
      expect(fieldSimulator.eq(0n, 1n)).toBe(false);
      expect(fieldSimulator.eq(1n, 0n)).toBe(false);
    });
  });

  describe('lt', () => {
    test('should compare small numbers', () => {
      expect(fieldSimulator.lt(5n, 10n)).toBe(true);
      expect(fieldSimulator.lt(10n, 5n)).toBe(false);
      expect(fieldSimulator.lt(5n, 5n)).toBe(false);
    });

    test('should handle zero', () => {
      expect(fieldSimulator.lt(0n, 1n)).toBe(true);
      expect(fieldSimulator.lt(0n, 0n)).toBe(false);
      expect(fieldSimulator.lt(1n, 0n)).toBe(false);
    });

    test('should handle field modulus', () => {
      expect(fieldSimulator.lt(FIELD_MODULUS - 1n, FIELD_MODULUS)).toBe(true);
      expect(fieldSimulator.lt(FIELD_MODULUS, FIELD_MODULUS)).toBe(false);
      expect(fieldSimulator.lt(FIELD_MODULUS, FIELD_MODULUS - 1n)).toBe(false);
    });
  });

  describe('lte', () => {
    test('should compare small numbers', () => {
      expect(fieldSimulator.lte(5n, 10n)).toBe(true);
      expect(fieldSimulator.lte(10n, 5n)).toBe(false);
      expect(fieldSimulator.lte(5n, 5n)).toBe(true);
    });

    test('should handle zero', () => {
      expect(fieldSimulator.lte(0n, 1n)).toBe(true);
      expect(fieldSimulator.lte(0n, 0n)).toBe(true);
      expect(fieldSimulator.lte(1n, 0n)).toBe(false);
    });
  });

  describe('gt', () => {
    test('should compare small numbers', () => {
      expect(fieldSimulator.gt(10n, 5n)).toBe(true);
      expect(fieldSimulator.gt(5n, 10n)).toBe(false);
      expect(fieldSimulator.gt(5n, 5n)).toBe(false);
    });

    test('should handle zero', () => {
      expect(fieldSimulator.gt(1n, 0n)).toBe(true);
      expect(fieldSimulator.gt(0n, 0n)).toBe(false);
      expect(fieldSimulator.gt(0n, 1n)).toBe(false);
    });
  });

  describe('gte', () => {
    test('should compare small numbers', () => {
      expect(fieldSimulator.gte(10n, 5n)).toBe(true);
      expect(fieldSimulator.gte(5n, 10n)).toBe(false);
      expect(fieldSimulator.gte(5n, 5n)).toBe(true);
    });

    test('should handle zero', () => {
      expect(fieldSimulator.gte(1n, 0n)).toBe(true);
      expect(fieldSimulator.gte(0n, 0n)).toBe(true);
      expect(fieldSimulator.gte(0n, 1n)).toBe(false);
    });
  });

  describe('add', () => {
    test('should add small numbers', () => {
      expect(fieldSimulator.add(5n, 3n)).toBe(8n);
      expect(fieldSimulator.add(0n, 0n)).toBe(0n);
      expect(fieldSimulator.add(1n, 0n)).toBe(1n);
      expect(fieldSimulator.add(0n, 1n)).toBe(1n);
    });

    test('should handle field arithmetic', () => {
      // Test addition that doesn't overflow field
      expect(fieldSimulator.add(FIELD_MODULUS - 1n, 1n)).toBe(FIELD_MODULUS);
      expect(fieldSimulator.add(FIELD_MODULUS, 0n)).toBe(FIELD_MODULUS);
    });

    test('should handle large numbers', () => {
      const large1 = FIELD_MODULUS - 1000n;
      const large2 = 500n;
      const result = fieldSimulator.add(large1, large2);
      expect(result).toBe(FIELD_MODULUS - 500n);
    });
  });

  describe('sub', () => {
    test('should subtract small numbers', () => {
      expect(fieldSimulator.sub(10n, 3n)).toBe(7n);
      expect(fieldSimulator.sub(5n, 5n)).toBe(0n);
      expect(fieldSimulator.sub(0n, 0n)).toBe(0n);
    });

    test('should handle field arithmetic', () => {
      expect(fieldSimulator.sub(FIELD_MODULUS, 1n)).toBe(FIELD_MODULUS - 1n);
      expect(fieldSimulator.sub(FIELD_MODULUS, 0n)).toBe(FIELD_MODULUS);
    });

    test('should throw on underflow', () => {
      expect(() => fieldSimulator.sub(5n, 10n)).toThrow();
    });
  });

  describe('mul', () => {
    test('should multiply small numbers', () => {
      expect(fieldSimulator.mul(5n, 3n)).toBe(15n);
      expect(fieldSimulator.mul(0n, 5n)).toBe(0n);
      expect(fieldSimulator.mul(5n, 0n)).toBe(0n);
      expect(fieldSimulator.mul(1n, 5n)).toBe(5n);
      expect(fieldSimulator.mul(5n, 1n)).toBe(5n);
    });

    test('should handle field arithmetic', () => {
      expect(fieldSimulator.mul(FIELD_MODULUS, 1n)).toBe(FIELD_MODULUS);
      expect(fieldSimulator.mul(1n, FIELD_MODULUS)).toBe(FIELD_MODULUS);
    });

    test('should handle large numbers', () => {
      const large1 = 1000n;
      const large2 = 2000n;
      const result = fieldSimulator.mul(large1, large2);
      expect(result).toBe(2000000n);
    });
  });

  describe('div', () => {
    test('should divide small numbers', () => {
      expect(fieldSimulator.div(10n, 2n)).toBe(5n);
      expect(fieldSimulator.div(15n, 3n)).toBe(5n);
      expect(fieldSimulator.div(0n, 5n)).toBe(0n);
    });

    test('should handle division by one', () => {
      expect(fieldSimulator.div(123n, 1n)).toBe(123n);
      expect(fieldSimulator.div(FIELD_MODULUS, 1n)).toBe(FIELD_MODULUS);
    });

    test('should throw on division by zero', () => {
      expect(() => fieldSimulator.div(5n, 0n)).toThrow();
    });

    test('should handle exact division', () => {
      expect(fieldSimulator.div(100n, 10n)).toBe(10n);
      expect(fieldSimulator.div(100n, 25n)).toBe(4n);
    });

    test('should handle division with remainder', () => {
      expect(fieldSimulator.div(10n, 3n)).toBe(3n);
      expect(fieldSimulator.div(11n, 3n)).toBe(3n);
    });
  });

  describe('rem', () => {
    test('should compute remainder for small numbers', () => {
      expect(fieldSimulator.rem(10n, 3n)).toBe(1n);
      expect(fieldSimulator.rem(11n, 3n)).toBe(2n);
      expect(fieldSimulator.rem(12n, 3n)).toBe(0n);
    });

    test('should handle remainder with zero', () => {
      expect(fieldSimulator.rem(0n, 5n)).toBe(0n);
    });

    test('should throw on division by zero', () => {
      expect(() => fieldSimulator.rem(5n, 0n)).toThrow();
    });

    test('should handle exact division remainder', () => {
      expect(fieldSimulator.rem(100n, 10n)).toBe(0n);
      expect(fieldSimulator.rem(100n, 25n)).toBe(0n);
    });
  });

  describe('divRem', () => {
    test('should compute both quotient and remainder', () => {
      const result = fieldSimulator.divRem(10n, 3n);
      expect(fromU256(result.quotient)).toBe(3n);
      expect(fromU256(result.remainder)).toBe(1n);
    });

    test('should handle exact division', () => {
      const result = fieldSimulator.divRem(100n, 10n);
      expect(fromU256(result.quotient)).toBe(10n);
      expect(fromU256(result.remainder)).toBe(0n);
    });

    test('should verify divRem = div + rem', () => {
      const a = 17n;
      const b = 5n;
      const divResult = fieldSimulator.div(a, b);
      const remResult = fieldSimulator.rem(a, b);
      const divRemResult = fieldSimulator.divRem(a, b);

      expect(fromU256(divRemResult.quotient)).toBe(divResult);
      expect(fromU256(divRemResult.remainder)).toBe(remResult);
    });
  });

  describe('sqrt', () => {
    test('should compute square root of perfect squares', () => {
      expect(fieldSimulator.sqrt(0n)).toBe(0n);
      expect(fieldSimulator.sqrt(1n)).toBe(1n);
      expect(fieldSimulator.sqrt(4n)).toBe(2n);
      expect(fieldSimulator.sqrt(9n)).toBe(3n);
      expect(fieldSimulator.sqrt(16n)).toBe(4n);
      expect(fieldSimulator.sqrt(25n)).toBe(5n);
    });

    test('should compute floor of square root for non-perfect squares', () => {
      expect(fieldSimulator.sqrt(2n)).toBe(1n);
      expect(fieldSimulator.sqrt(3n)).toBe(1n);
      expect(fieldSimulator.sqrt(5n)).toBe(2n);
      expect(fieldSimulator.sqrt(6n)).toBe(2n);
      expect(fieldSimulator.sqrt(7n)).toBe(2n);
      expect(fieldSimulator.sqrt(8n)).toBe(2n);
      expect(fieldSimulator.sqrt(10n)).toBe(3n);
    });

    test('should handle large numbers', () => {
      expect(fieldSimulator.sqrt(10000n)).toBe(100n);
      expect(fieldSimulator.sqrt(1000000n)).toBe(1000n);
    });
  });

  describe('min', () => {
    test('should return minimum of two values', () => {
      expect(fieldSimulator.min(5n, 10n)).toBe(5n);
      expect(fieldSimulator.min(10n, 5n)).toBe(5n);
      expect(fieldSimulator.min(5n, 5n)).toBe(5n);
    });

    test('should handle zero', () => {
      expect(fieldSimulator.min(0n, 1n)).toBe(0n);
      expect(fieldSimulator.min(1n, 0n)).toBe(0n);
      expect(fieldSimulator.min(0n, 0n)).toBe(0n);
    });

    test('should handle large numbers', () => {
      expect(fieldSimulator.min(FIELD_MODULUS, FIELD_MODULUS - 1n)).toBe(
        FIELD_MODULUS - 1n,
      );
      expect(fieldSimulator.min(FIELD_MODULUS - 1n, FIELD_MODULUS)).toBe(
        FIELD_MODULUS - 1n,
      );
    });
  });

  describe('max', () => {
    test('should return maximum of two values', () => {
      expect(fieldSimulator.max(5n, 10n)).toBe(10n);
      expect(fieldSimulator.max(10n, 5n)).toBe(10n);
      expect(fieldSimulator.max(5n, 5n)).toBe(5n);
    });

    test('should handle zero', () => {
      expect(fieldSimulator.max(0n, 1n)).toBe(1n);
      expect(fieldSimulator.max(1n, 0n)).toBe(1n);
      expect(fieldSimulator.max(0n, 0n)).toBe(0n);
    });

    test('should handle large numbers', () => {
      expect(fieldSimulator.max(FIELD_MODULUS, FIELD_MODULUS - 1n)).toBe(
        FIELD_MODULUS,
      );
      expect(fieldSimulator.max(FIELD_MODULUS - 1n, FIELD_MODULUS)).toBe(
        FIELD_MODULUS,
      );
    });
  });

  describe('field arithmetic properties', () => {
    test('should maintain field arithmetic properties', () => {
      const a = 123n;
      const b = 456n;
      const c = 789n;

      // Commutativity of addition
      expect(fieldSimulator.add(a, b)).toBe(fieldSimulator.add(b, a));

      // Commutativity of multiplication
      expect(fieldSimulator.mul(a, b)).toBe(fieldSimulator.mul(b, a));

      // Associativity of addition
      const leftAssoc = fieldSimulator.add(fieldSimulator.add(a, b), c);
      const rightAssoc = fieldSimulator.add(a, fieldSimulator.add(b, c));
      expect(leftAssoc).toBe(rightAssoc);

      // Distributivity
      const leftDist = fieldSimulator.mul(a, fieldSimulator.add(b, c));
      const rightDist = fieldSimulator.add(
        fieldSimulator.mul(a, b),
        fieldSimulator.mul(a, c),
      );
      expect(leftDist).toBe(rightDist);
    });

    test('should handle division and multiplication inverse', () => {
      const a = 100n;
      const b = 5n;

      const quotient = fieldSimulator.div(a, b);
      const remainder = fieldSimulator.rem(a, b);
      const reconstructed = fieldSimulator.add(
        fieldSimulator.mul(quotient, b),
        remainder,
      );

      expect(reconstructed).toBe(a);
    });
  });
});
