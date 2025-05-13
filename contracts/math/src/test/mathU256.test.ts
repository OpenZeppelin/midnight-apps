import { beforeEach, describe, expect, test } from 'vitest';
import type { U128, U256, DivResultU256 } from '../artifacts/Index/contract/index.d.cts';
import { MathU256Simulator } from './MathU256Simulator';

let mathSimulator: MathU256Simulator;

const MAX_U8 = 2n ** 8n - 1n;
const MAX_U16 = 2n ** 16n - 1n;
const MAX_U32 = 2n ** 32n - 1n;
const MAX_U64 = 2n ** 64n - 1n;
const MAX_U128 = 2n ** 128n - 1n;
const MAX_U256 = 2n ** 256n - 1n;

const setup = () => {
  mathSimulator = new MathU256Simulator();
};

// Helper to convert bigint to U256
const toU256 = (value: bigint): U256 => {
  const lowBigInt = value & ((1n << 128n) - 1n);
  const highBigInt = value >> 128n;
  return {
    low: { low: lowBigInt & MAX_U64, high: lowBigInt >> 64n },
    high: { low: highBigInt & MAX_U64, high: highBigInt >> 64n },
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

describe('MathU256', () => {
  beforeEach(setup);

  describe('eq', () => {
    test('should compare equal values', () => {
      const a = toU256(123n);
      const b = toU256(123n);
      expect(mathSimulator.eq(a, b)).toBe(true);
    });

    test('should compare different low parts', () => {
      const a = toU256(123n);
      const b = toU256(124n);
      expect(mathSimulator.eq(a, b)).toBe(false);
    });

    test('should compare different high parts', () => {
      const a: U256 = { low: { low: 123n, high: 0n }, high: { low: 456n, high: 0n } };
      const b: U256 = { low: { low: 123n, high: 0n }, high: { low: 457n, high: 0n } };
      expect(mathSimulator.eq(a, b)).toBe(false);
    });

    test('should compare zero values', () => {
      const zero: U256 = { low: { low: 0n, high: 0n }, high: { low: 0n, high: 0n } };
      expect(mathSimulator.eq(zero, zero)).toBe(true);
    });

    test('should compare max U256 values', () => {
      const max = toU256(MAX_U256);
      expect(mathSimulator.eq(max, max)).toBe(true);
    });
  });

  describe('le', () => {
    test('should compare small numbers', () => {
      const a = toU256(5n);
      const b = toU256(10n);
      expect(mathSimulator.le(a, b)).toBe(true);
      expect(mathSimulator.le(b, a)).toBe(false);
      expect(mathSimulator.le(a, a)).toBe(true);
    });

    test('should compare max U256 values', () => {
      const max = toU256(MAX_U256);
      const maxMinusOne = toU256(MAX_U256 - 1n);
      expect(mathSimulator.le(max, max)).toBe(true);
      expect(mathSimulator.le(maxMinusOne, max)).toBe(true);
      expect(mathSimulator.le(max, maxMinusOne)).toBe(false);
    });

    test('should handle zero', () => {
      const zero = toU256(0n);
      const one = toU256(1n);
      expect(mathSimulator.le(zero, one)).toBe(true);
      expect(mathSimulator.le(zero, zero)).toBe(true);
      expect(mathSimulator.le(one, zero)).toBe(false);
    });

    test('should compare with high parts', () => {
      const a: U256 = { low: { low: MAX_U64, high: MAX_U64 }, high: { low: 0n, high: 0n } };
      const b: U256 = { low: { low: MAX_U64, high: MAX_U64 }, high: { low: 1n, high: 0n } };
      expect(mathSimulator.le(a, b)).toBe(true);
      expect(mathSimulator.le(b, a)).toBe(false);
    });
  });

  describe('gt', () => {
    test('should compare small numbers', () => {
      const a = toU256(10n);
      const b = toU256(5n);
      expect(mathSimulator.gt(a, b)).toBe(true);
      expect(mathSimulator.gt(b, a)).toBe(false);
      expect(mathSimulator.gt(a, a)).toBe(false);
    });

    test('should compare max U256 values', () => {
      const max = toU256(MAX_U256);
      const maxMinusOne = toU256(MAX_U256 - 1n);
      expect(mathSimulator.gt(max, maxMinusOne)).toBe(true);
      expect(mathSimulator.gt(maxMinusOne, max)).toBe(false);
      expect(mathSimulator.gt(max, max)).toBe(false);
    });

    test('should handle zero', () => {
      const zero = toU256(0n);
      const one = toU256(1n);
      expect(mathSimulator.gt(one, zero)).toBe(true);
      expect(mathSimulator.gt(zero, one)).toBe(false);
      expect(mathSimulator.gt(zero, zero)).toBe(false);
    });

    test('should compare with high parts', () => {
      const a: U256 = { low: { low: MAX_U64, high: MAX_U64 }, high: { low: 1n, high: 0n } };
      const b: U256 = { low: { low: MAX_U64, high: MAX_U64 }, high: { low: 0n, high: 0n } };
      expect(mathSimulator.gt(a, b)).toBe(true);
      expect(mathSimulator.gt(b, a)).toBe(false);
    });
  });

  describe('add', () => {
    test('should add two small numbers', () => {
      const a = toU256(5n);
      const b = toU256(3n);
      const result = mathSimulator.add(a, b);
      expect(fromU256(result)).toBe(8n);
    });

    test('should add max U256 minus 1 plus 1', () => {
      const a = toU256(MAX_U256 - 1n);
      const b = toU256(1n);
      const result = mathSimulator.add(a, b);
      expect(fromU256(result)).toBe(MAX_U256);
    });

    test('should handle zero', () => {
      const zero = toU256(0n);
      const five = toU256(5n);
      const result = mathSimulator.add(zero, zero);
      expect(fromU256(result)).toBe(0n);
      const result2 = mathSimulator.add(five, zero);
      expect(fromU256(result2)).toBe(5n);
    });

    test('should throw on overflow', () => {
      const max = toU256(MAX_U256);
      const one = toU256(1n);
      expect(() => mathSimulator.add(max, one)).toThrowError('MathU256: addition overflow');
    });

    test('should handle carry from low to high', () => {
      const a: U256 = { low: { low: MAX_U64, high: MAX_U64 }, high: { low: 0n, high: 0n } };
      const b: U256 = { low: { low: 1n, high: 0n }, high: { low: 0n, high: 0n } };
      const result = mathSimulator.add(a, b);
      expect(result.low.low).toBe(0n);
      expect(result.low.high).toBe(0n);
      expect(result.high.low).toBe(1n);
      expect(result.high.high).toBe(0n);
    });
  });

  describe('sub', () => {
    test('should subtract two small numbers', () => {
      const a = toU256(10n);
      const b = toU256(4n);
      const result = mathSimulator.sub(a, b);
      expect(fromU256(result)).toBe(6n);
    });

    test('should subtract max U256 minus 1', () => {
      const a = toU256(MAX_U256);
      const b = toU256(1n);
      const result = mathSimulator.sub(a, b);
      expect(fromU256(result)).toBe(MAX_U256 - 1n);
    });

    test('should throw on underflow', () => {
      const a = toU256(3n);
      const b = toU256(5n);
      expect(() => mathSimulator.sub(a, b)).toThrowError('MathU256: subtraction underflow');
    });

    test('should handle zero', () => {
      const five = toU256(5n);
      const zero = toU256(0n);
      const result = mathSimulator.sub(five, zero);
      expect(fromU256(result)).toBe(5n);
      expect(() => mathSimulator.sub(zero, five)).toThrowError('MathU256: subtraction underflow');
    });

    test('should handle borrow from high', () => {
      const a: U256 = { low: { low: 0n, high: 0n }, high: { low: 1n, high: 0n } };
      const b: U256 = { low: { low: 1n, high: 0n }, high: { low: 0n, high: 0n } };
      const result = mathSimulator.sub(a, b);
      expect(result.low.low).toBe(MAX_U64);
      expect(result.low.high).toBe(MAX_U64);
      expect(result.high.low).toBe(0n);
      expect(result.high.high).toBe(0n);
    });
  });

  describe('mul', () => {
    test('should multiply small numbers', () => {
      const a = toU256(4n);
      const b = toU256(3n);
      const result = mathSimulator.mul(a, b);
      expect(fromU256(result)).toBe(12n);
    });

    test('should multiply max U128 by 1', () => {
      const a = toU256(MAX_U128);
      const b = toU256(1n);
      const result = mathSimulator.mul(a, b);
      expect(fromU256(result)).toBe(MAX_U128);
    });

    test('should handle large multiplication', () => {
      const a = toU256(MAX_U128);
      const b = toU256(2n);
      const result = mathSimulator.mul(a, b);
      expect(fromU256(result)).toBe(MAX_U128 * 2n);
    });

    test('should handle zero', () => {
      const five = toU256(5n);
      const zero = toU256(0n);
      const result = mathSimulator.mul(five, zero);
      expect(fromU256(result)).toBe(0n);
      const result2 = mathSimulator.mul(zero, toU256(MAX_U128));
      expect(fromU256(result2)).toBe(0n);
    });

    test('should throw on overflow', () => {
      const a = toU256(MAX_U256);
      const b = toU256(2n);
      expect(() => mathSimulator.mul(a, b)).toThrowError('MathU256: multiplication overflow');
    });
  });

  describe('div', () => {
    test('should divide small numbers', () => {
      const a = toU256(10n);
      const b = toU256(3n);
      const result = mathSimulator.div(a, b);
      expect(fromU256(result)).toBe(3n);
    });

    test('should divide max U256 by 1', () => {
      const a = toU256(MAX_U256);
      const b = toU256(1n);
      const result = mathSimulator.div(a, b);
      expect(fromU256(result)).toBe(MAX_U256);
    });

    test('should throw on division by zero', () => {
      const a = toU256(5n);
      const b = toU256(0n);
      expect(() => mathSimulator.div(a, b)).toThrowError('MathU256: division by zero');
    });

    test('should handle division with remainder', () => {
      const a = toU256(100n);
      const b = toU256(7n);
      const result = mathSimulator.div(a, b);
      expect(fromU256(result)).toBe(14n);
    });
  });

  describe('rem', () => {
    test('should compute remainder of small numbers', () => {
      const a = toU256(10n);
      const b = toU256(3n);
      const result = mathSimulator.rem(a, b);
      expect(fromU256(result)).toBe(1n);
    });

    test('should compute remainder of max U256 by 2', () => {
      const a = toU256(MAX_U256);
      const b = toU256(2n);
      const result = mathSimulator.rem(a, b);
      expect(fromU256(result)).toBe(1n);
    });

    test('should throw on division by zero', () => {
      const a = toU256(5n);
      const b = toU256(0n);
      expect(() => mathSimulator.rem(a, b)).toThrowError('MathU256: division by zero');
    });

    test('should handle zero remainder', () => {
      const a = toU256(6n);
      const b = toU256(3n);
      const result = mathSimulator.rem(a, b);
      expect(fromU256(result)).toBe(0n);
    });
  });

  describe('divRem', () => {
    test('should compute quotient and remainder of small numbers', () => {
      const a = toU256(10n);
      const b = toU256(3n);
      const result = mathSimulator.divRem(a, b);
      expect(fromU256(result.quotient)).toBe(3n);
      expect(fromU256(result.remainder)).toBe(1n);
    });

    test('should compute quotient and remainder of max U256 by 2', () => {
      const a = toU256(MAX_U256);
      const b = toU256(2n);
      const result = mathSimulator.divRem(a, b);
      expect(fromU256(result.quotient)).toBe(MAX_U256 / 2n);
      expect(fromU256(result.remainder)).toBe(1n);
    });

    test('should throw on division by zero', () => {
      const a = toU256(5n);
      const b = toU256(0n);
      expect(() => mathSimulator.divRem(a, b)).toThrowError('MathU256: division by zero');
    });

    test('should handle zero remainder', () => {
      const a = toU256(6n);
      const b = toU256(3n);
      const result = mathSimulator.divRem(a, b);
      expect(fromU256(result.quotient)).toBe(2n);
      expect(fromU256(result.remainder)).toBe(0n);
    });
  });

  describe('sqrt', () => {
    test('should compute square root of small perfect squares', () => {
      expect(mathSimulator.sqrt(toU256(4n))).toBe(2n);
      expect(mathSimulator.sqrt(toU256(9n))).toBe(3n);
      expect(mathSimulator.sqrt(toU256(16n))).toBe(4n);
    });

    test('should compute square root of small imperfect squares', () => {
      expect(mathSimulator.sqrt(toU256(2n))).toBe(1n); // floor(sqrt(2)) ≈ 1.414
      expect(mathSimulator.sqrt(toU256(3n))).toBe(1n); // floor(sqrt(3)) ≈ 1.732
      expect(mathSimulator.sqrt(toU256(5n))).toBe(2n); // floor(sqrt(5)) ≈ 2.236
    });

    test('should handle special cases', () => {
      expect(mathSimulator.sqrt(toU256(0n))).toBe(0n);
      expect(mathSimulator.sqrt(toU256(1n))).toBe(1n);
      expect(mathSimulator.sqrt(toU256(MAX_U8))).toBe(15n);
      expect(mathSimulator.sqrt(toU256(MAX_U16))).toBe(255n);
      expect(mathSimulator.sqrt(toU256(MAX_U32))).toBe(65535n);
      expect(mathSimulator.sqrt(toU256(MAX_U64))).toBe(4294967295n);
      expect(mathSimulator.sqrt(toU256(MAX_U128))).toBe(18446744073709551615n);
      expect(mathSimulator.sqrt(toU256(MAX_U256))).toBe(340282366920938463463374607431768211455n);
    });

    test('should compute square root of large numbers', () => {
      expect(mathSimulator.sqrt(toU256(1000000n))).toBe(1000n);
      expect(mathSimulator.sqrt(toU256(100000001n))).toBe(10000n); // floor(sqrt(100000001)) ≈ 10000.00005
    });
  });

  describe('min', () => {
    test('should return minimum of small numbers', () => {
      const a = toU256(5n);
      const b = toU256(3n);
      const result = mathSimulator.min(a, b);
      expect(fromU256(result)).toBe(3n);
      expect(fromU256(mathSimulator.min(b, a))).toBe(3n);
      expect(fromU256(mathSimulator.min(a, a))).toBe(5n);
    });

    test('should handle max U256', () => {
      const max = toU256(MAX_U256);
      const one = toU256(1n);
      const result = mathSimulator.min(max, one);
      expect(fromU256(result)).toBe(1n);
      expect(fromU256(mathSimulator.min(max, max))).toBe(MAX_U256);
    });

    test('should handle zero', () => {
      const zero = toU256(0n);
      const five = toU256(5n);
      const result = mathSimulator.min(zero, five);
      expect(fromU256(result)).toBe(0n);
      expect(fromU256(mathSimulator.min(five, zero))).toBe(0n);
    });
  });

  describe('max', () => {
    test('should return maximum of small numbers', () => {
      const a = toU256(5n);
      const b = toU256(3n);
      const result = mathSimulator.max(a, b);
      expect(fromU256(result)).toBe(5n);
      expect(fromU256(mathSimulator.max(b, a))).toBe(5n);
      expect(fromU256(mathSimulator.max(a, a))).toBe(5n);
    });

    test('should handle max U256', () => {
      const max = toU256(MAX_U256);
      const one = toU256(1n);
      const result = mathSimulator.max(max, one);
      expect(fromU256(result)).toBe(MAX_U256);
      expect(fromU256(mathSimulator.max(max, max))).toBe(MAX_U256);
    });

    test('should handle zero', () => {
      const zero = toU256(0n);
      const five = toU256(5n);
      const result = mathSimulator.max(zero, five);
      expect(fromU256(result)).toBe(5n);
      expect(fromU256(mathSimulator.max(five, zero))).toBe(5n);
    });
  });

  describe('isMultiple', () => {
    test('should check if small number is multiple', () => {
      expect(mathSimulator.isMultiple(toU256(6n), toU256(3n))).toBe(true);
      expect(mathSimulator.isMultiple(toU256(7n), toU256(3n))).toBe(false);
    });

    test('should check max U256 is multiple of 1', () => {
      const max = toU256(MAX_U256);
      const one = toU256(1n);
      expect(mathSimulator.isMultiple(max, one)).toBe(true);
    });

    test('should throw on division by zero', () => {
      const five = toU256(5n);
      const zero = toU256(0n);
      expect(() => mathSimulator.isMultiple(five, zero)).toThrowError('MathU256: division by zero');
    });

    test('should handle large divisors', () => {
      const max = toU256(MAX_U256);
      const maxMinusOne = toU256(MAX_U256 - 1n);
      expect(mathSimulator.isMultiple(max, max)).toBe(true);
      expect(mathSimulator.isMultiple(maxMinusOne, max)).toBe(false);
    });
  });
});
