import { beforeEach, describe, expect, test } from 'vitest';
import type { U128, U256 } from '../artifacts/Index/contract/index.d.cts';
import {
  MAX_UINT8,
  MAX_UINT16,
  MAX_UINT32,
  MAX_UINT64,
  MAX_UINT128,
} from '../utils/consts';
import {
  MathU128Simulator,
  createMaliciousSimulator,
} from './MathU128Simulator';

let mathSimulator: MathU128Simulator;

const setup = () => {
  mathSimulator = new MathU128Simulator();
};

describe('MathU128', () => {
  beforeEach(setup);

  test('MODULUS', () => {
    const result = mathSimulator.MODULUS();
    expect(result).toBe(MAX_UINT64 + 1n);
  });

  test('ZERO_U128', () => {
    const result = mathSimulator.ZERO_U128();
    expect(result).toEqual({ low: 0n, high: 0n });
  });

  describe('toU128', () => {
    test('should convert small Uint<128> to U128', () => {
      const value = 123n;
      const result = mathSimulator.toU128(value);
      expect(result.low).toBe(value);
      expect(result.high).toBe(0n);
    });

    test('should convert max Uint<128> to U128', () => {
      const result = mathSimulator.toU128(MAX_UINT128);
      expect(result.low).toBe(MAX_UINT64);
      expect(result.high).toBe(MAX_UINT64);
    });

    test('should handle zero', () => {
      const result = mathSimulator.toU128(0n);
      expect(result.low).toBe(0n);
      expect(result.high).toBe(0n);
    });

    test('should fail when reconstruction is invalid', () => {
      const badSimulator = createMaliciousSimulator({
        mockDiv: () => ({ quotient: 1n, remainder: 1n }),
      });
      expect(() => badSimulator.toU128(123n)).toThrow(
        'MathU128: conversion invalid',
      );
    });
  });

  describe('fromU128', () => {
    test('should convert U128 to small Uint<128>', () => {
      const u128: U128 = { low: 123n, high: 0n };
      expect(mathSimulator.fromU128(u128)).toBe(123n);
    });

    test('should convert U128 to max Uint<128>', () => {
      const u128: U128 = { low: MAX_UINT64, high: MAX_UINT64 };
      expect(mathSimulator.fromU128(u128)).toBe(MAX_UINT128);
    });

    test('should handle zero U128', () => {
      const u128: U128 = { low: 0n, high: 0n };
      expect(mathSimulator.fromU128(u128)).toBe(0n);
    });
  });

  describe('isZero', () => {
    test('should return true for zero', () => {
      expect(mathSimulator.isZero(0n)).toBe(true);
    });

    test('should return false for non-zero', () => {
      expect(mathSimulator.isZero(1n)).toBe(false);
    });
  });

  describe('isZeroU128', () => {
    test('should return true for zero U128', () => {
      const a: U128 = { low: 0n, high: 0n };
      expect(mathSimulator.isZeroU128(a)).toBe(true);
    });

    test('should return false for non-zero U128', () => {
      const b: U128 = { low: 1n, high: 0n };
      expect(mathSimulator.isZeroU128(b)).toBe(false);
    });
  });

  describe('eq', () => {
    test('should return true for equal numbers', () => {
      expect(mathSimulator.eq(5n, 5n)).toBe(true);
    });

    test('should return false for non-equal numbers', () => {
      expect(mathSimulator.eq(5n, 10n)).toBe(false);
    });
  });

  describe('eqU128', () => {
    test('should return true for equal U128 numbers', () => {
      const a: U128 = { low: 5n, high: 0n };
      expect(mathSimulator.eqU128(a, a)).toBe(true);
    });

    test('should return false for non-equal U128 numbers', () => {
      const a: U128 = { low: 5n, high: 0n };
      const b: U128 = { low: 10n, high: 0n };
      expect(mathSimulator.eqU128(a, b)).toBe(false);
    });
  });

  describe('le', () => {
    test('should compare small numbers', () => {
      expect(mathSimulator.le(5n, 10n)).toBe(true);
      expect(mathSimulator.le(10n, 5n)).toBe(false);
      expect(mathSimulator.le(5n, 5n)).toBe(true);
    });

    test('should compare max Uint<128>', () => {
      expect(mathSimulator.le(MAX_UINT128, MAX_UINT128)).toBe(true);
      expect(mathSimulator.le(MAX_UINT128 - 1n, MAX_UINT128)).toBe(true);
    });

    test('should handle zero', () => {
      expect(mathSimulator.le(0n, 1n)).toBe(true);
      expect(mathSimulator.le(0n, 0n)).toBe(true);
    });
  });

  describe('leU128', () => {
    test('should compare small U128 numbers', () => {
      const a: U128 = { low: 5n, high: 0n };
      const b: U128 = { low: 10n, high: 0n };
      expect(mathSimulator.leU128(a, b)).toBe(true);
      expect(mathSimulator.leU128(b, a)).toBe(false);
      expect(mathSimulator.leU128(a, a)).toBe(true);
    });

    test('should compare U128 with high parts', () => {
      const a: U128 = { low: MAX_UINT64, high: MAX_UINT64 - 1n };
      const b: U128 = { low: MAX_UINT64, high: MAX_UINT64 };
      expect(mathSimulator.leU128(a, b)).toBe(true);
    });

    test('should return true for equal U128 numbers', () => {
      const a: U128 = { low: 5n, high: 0n };
      expect(mathSimulator.leU128(a, a)).toBe(true);
    });
  });

  describe('gt', () => {
    test('should compare small numbers', () => {
      expect(mathSimulator.gt(10n, 5n)).toBe(true);
      expect(mathSimulator.gt(5n, 10n)).toBe(false);
      expect(mathSimulator.gt(5n, 5n)).toBe(false);
    });

    test('should compare max Uint<128>', () => {
      expect(mathSimulator.gt(MAX_UINT128, MAX_UINT128 - 1n)).toBe(true);
      expect(mathSimulator.gt(MAX_UINT128, MAX_UINT128)).toBe(false);
    });

    test('should handle zero', () => {
      expect(mathSimulator.gt(1n, 0n)).toBe(true);
      expect(mathSimulator.gt(0n, 0n)).toBe(false);
    });
  });

  describe('gtU128', () => {
    test('should compare small U128 numbers', () => {
      const a: U128 = { low: 10n, high: 0n };
      const b: U128 = { low: 5n, high: 0n };
      expect(mathSimulator.gtU128(a, b)).toBe(true);
      expect(mathSimulator.gtU128(b, a)).toBe(false);
      expect(mathSimulator.gtU128(a, a)).toBe(false);
    });

    test('should compare U128 with high parts', () => {
      const a: U128 = { low: MAX_UINT64, high: MAX_UINT64 };
      const b: U128 = { low: MAX_UINT64, high: MAX_UINT64 - 1n };
      expect(mathSimulator.gtU128(a, b)).toBe(true);
    });

    test('should return false for equal U128 numbers', () => {
      const a: U128 = { low: 5n, high: 0n };
      expect(mathSimulator.gtU128(a, a)).toBe(false);
    });
  });

  describe('add', () => {
    test('should add two small numbers', () => {
      const result: U256 = mathSimulator.add(5n, 3n);
      expect(result.low.low).toBe(8n);
      expect(result.low.high).toBe(0n);
      expect(result.high.low).toBe(0n);
      expect(result.high.high).toBe(0n);
    });

    test('should handle zero addition', () => {
      const result: U256 = mathSimulator.add(0n, 0n);
      expect(result.low.low).toBe(0n);
      expect(result.low.high).toBe(0n);
      expect(result.high.low).toBe(0n);
      expect(result.high.high).toBe(0n);
      const result2: U256 = mathSimulator.add(5n, 0n);
      expect(result2.low.low).toBe(5n);
      expect(result2.low.high).toBe(0n);
      expect(result2.high.low).toBe(0n);
      expect(result2.high.high).toBe(0n);
      const result3: U256 = mathSimulator.add(0n, 5n);
      expect(result3.low.low).toBe(5n);
      expect(result3.low.high).toBe(0n);
      expect(result3.high.low).toBe(0n);
      expect(result3.high.high).toBe(0n);
    });

    test('should handle equal values', () => {
      const result: U256 = mathSimulator.add(5n, 5n);
      expect(result.low.low).toBe(10n);
      expect(result.low.high).toBe(0n);
      expect(result.high.low).toBe(0n);
      expect(result.high.high).toBe(0n);
    });

    test('should handle max U128 minus 1 plus 1', () => {
      const result: U256 = mathSimulator.add(MAX_UINT128 - 1n, 1n);
      expect(result.low.low).toBe(MAX_UINT64);
      expect(result.low.high).toBe(MAX_UINT64);
      expect(result.high.low).toBe(0n);
      expect(result.high.high).toBe(0n);
    });

    test('should handle max U128 plus 1', () => {
      const result: U256 = mathSimulator.add(MAX_UINT128, 1n);
      expect(result.low.low).toBe(0n);
      expect(result.low.high).toBe(0n);
      expect(result.high.low).toBe(1n);
      expect(result.high.high).toBe(0n);
    });
  });

  describe('addU128', () => {
    test('should add two small U128 numbers', () => {
      const a: U128 = { low: 5n, high: 0n };
      const b: U128 = { low: 3n, high: 0n };
      const result: U256 = mathSimulator.addU128(a, b);
      expect(result.low.low).toBe(8n);
      expect(result.low.high).toBe(0n);
      expect(result.high.low).toBe(0n);
      expect(result.high.high).toBe(0n);
    });

    test('should handle zero addition', () => {
      const zero: U128 = { low: 0n, high: 0n };
      const five: U128 = { low: 5n, high: 0n };
      const result: U256 = mathSimulator.addU128(zero, zero);
      expect(result.low.low).toBe(0n);
      expect(result.low.high).toBe(0n);
      expect(result.high.low).toBe(0n);
      expect(result.high.high).toBe(0n);

      const result2: U256 = mathSimulator.addU128(five, zero);
      expect(result2.low.low).toBe(5n);
      expect(result2.low.high).toBe(0n);
      expect(result2.high.low).toBe(0n);
      expect(result2.high.high).toBe(0n);

      const result3: U256 = mathSimulator.addU128(zero, five);
      expect(result3.low.low).toBe(5n);
      expect(result3.low.high).toBe(0n);
      expect(result3.high.low).toBe(0n);
      expect(result3.high.high).toBe(0n);
    });

    test('should handle equal U128 values', () => {
      const a: U128 = { low: 5n, high: 0n };
      const result: U256 = mathSimulator.addU128(a, a);
      expect(result.low.low).toBe(10n);
      expect(result.low.high).toBe(0n);
      expect(result.high.low).toBe(0n);
      expect(result.high.high).toBe(0n);
    });

    test('should handle max U128 plus one', () => {
      const a: U128 = { low: MAX_UINT64, high: MAX_UINT64 };
      const b: U128 = { low: 1n, high: 0n };
      const result: U256 = mathSimulator.addU128(a, b);
      expect(result.low.low).toBe(0n);
      expect(result.low.high).toBe(0n);
      expect(result.high.low).toBe(1n);
      expect(result.high.high).toBe(0n);
    });

    test('should handle addition with carry', () => {
      const a: U128 = { low: MAX_UINT64, high: 0n };
      const b: U128 = { low: 1n, high: 0n };
      const result: U256 = mathSimulator.addU128(a, b);
      expect(result.low.low).toBe(0n);
      expect(result.low.high).toBe(1n);
      expect(result.high.low).toBe(0n);
      expect(result.high.high).toBe(0n);
    });
  });

  describe('sub', () => {
    test('should subtract two small numbers', () => {
      const result = mathSimulator.sub(10n, 4n);
      expect(result).toBe(6n);
    });

    test('should handle equal values', () => {
      const result = mathSimulator.sub(4n, 4n);
      expect(result).toBe(0n);
    });

    test('should handle zero subtraction', () => {
      const result = mathSimulator.sub(5n, 0n);
      expect(result).toBe(5n);
    });

    test('should handle max U128 minus one', () => {
      const result = mathSimulator.sub(MAX_UINT128, 1n);
      expect(result).toBe(MAX_UINT128 - 1n);
    });

    test('should fail on underflow', () => {
      expect(() => mathSimulator.sub(3n, 5n)).toThrowError(
        'MathU128: subtraction underflow',
      );
      expect(() => mathSimulator.sub(0n, 1n)).toThrowError(
        'MathU128: subtraction underflow',
      );
    });
  });

  describe('subU128', () => {
    test('should subtract two small U128 numbers', () => {
      const a: U128 = { low: 10n, high: 0n };
      const b: U128 = { low: 4n, high: 0n };
      const result = mathSimulator.subU128(a, b);
      expect(result.low).toBe(6n);
      expect(result.high).toBe(0n);
    });

    test('should handle equal U128 values', () => {
      const a: U128 = { low: 4n, high: 0n };
      const result = mathSimulator.subU128(a, a);
      expect(result.low).toBe(0n);
      expect(result.high).toBe(0n);
    });

    test('should handle zero subtraction', () => {
      const a: U128 = { low: 5n, high: 0n };
      const b: U128 = { low: 0n, high: 0n };
      const result = mathSimulator.subU128(a, b);
      expect(result.low).toBe(5n);
      expect(result.high).toBe(0n);
    });

    test('should handle max U128 minus one', () => {
      const a: U128 = { low: MAX_UINT64, high: MAX_UINT64 };
      const b: U128 = { low: 1n, high: 0n };
      const result = mathSimulator.subU128(a, b);
      expect(result.low).toBe(MAX_UINT64 - 1n);
      expect(result.high).toBe(MAX_UINT64);
    });

    test('should subtract with borrow', () => {
      const a: U128 = { low: 0n, high: 1n };
      const b: U128 = { low: 1n, high: 0n };
      const result = mathSimulator.subU128(a, b);
      expect(result.low).toBe(MAX_UINT64);
      expect(result.high).toBe(0n);
    });

    test('should fail on underflow', () => {
      const a: U128 = { low: 3n, high: 0n };
      const b: U128 = { low: 5n, high: 0n };
      expect(() => mathSimulator.subU128(a, b)).toThrowError(
        'MathU128: subtraction underflow',
      );
    });
  });

  describe('mul', () => {
    test('should multiply small numbers', () => {
      const result: U256 = mathSimulator.mul(4n, 3n);
      expect(result.low.low).toBe(12n);
      expect(result.low.high).toBe(0n);
      expect(result.high.low).toBe(0n);
      expect(result.high.high).toBe(0n);
    });

    test('should handle zero multiplication', () => {
      const result: U256 = mathSimulator.mul(5n, 0n);
      expect(result.low.low).toBe(0n);
      expect(result.low.high).toBe(0n);
      expect(result.high.low).toBe(0n);
      expect(result.high.high).toBe(0n);

      const result2: U256 = mathSimulator.mul(0n, MAX_UINT128);
      expect(result2.low.low).toBe(0n);
      expect(result2.low.high).toBe(0n);
      expect(result2.high.low).toBe(0n);
      expect(result2.high.high).toBe(0n);
    });

    test('should handle multiplication by one', () => {
      const result: U256 = mathSimulator.mul(1n, 5n);
      expect(result.low.low).toBe(5n);
      expect(result.low.high).toBe(0n);
      expect(result.high.low).toBe(0n);
      expect(result.high.high).toBe(0n);

      const result2: U256 = mathSimulator.mul(5n, 1n);
      expect(result2.low.low).toBe(5n);
      expect(result2.low.high).toBe(0n);
      expect(result2.high.low).toBe(0n);
      expect(result2.high.high).toBe(0n);
    });

    test('should handle equal values', () => {
      const result: U256 = mathSimulator.mul(5n, 5n);
      expect(result.low.low).toBe(25n);
      expect(result.low.high).toBe(0n);
      expect(result.high.low).toBe(0n);
      expect(result.high.high).toBe(0n);
    });

    test('should handle max U128 by one', () => {
      const result: U256 = mathSimulator.mul(MAX_UINT128, 1n);
      expect(result.low.low).toBe(MAX_UINT64);
      expect(result.low.high).toBe(MAX_UINT64);
      expect(result.high.low).toBe(0n);
      expect(result.high.high).toBe(0n);
    });

    test('should handle max U128 by two', () => {
      const result: U256 = mathSimulator.mul(MAX_UINT128, 2n);
      expect(result.low.low).toBe(MAX_UINT64 - 1n);
      expect(result.low.high).toBe(MAX_UINT64);
      expect(result.high.low).toBe(1n);
      expect(result.high.high).toBe(0n);
    });
  });

  describe('mulU128', () => {
    test('should multiply small U128 numbers', () => {
      const a: U128 = { low: 4n, high: 0n };
      const b: U128 = { low: 3n, high: 0n };
      const result: U256 = mathSimulator.mulU128(a, b);
      expect(result.low.low).toBe(12n);
      expect(result.low.high).toBe(0n);
      expect(result.high.low).toBe(0n);
      expect(result.high.high).toBe(0n);
    });

    test('should handle zero multiplication', () => {
      const zero: U128 = { low: 0n, high: 0n };
      const five: U128 = { low: 5n, high: 0n };
      const result: U256 = mathSimulator.mulU128(five, zero);
      expect(result.low.low).toBe(0n);
      expect(result.low.high).toBe(0n);
      expect(result.high.low).toBe(0n);
      expect(result.high.high).toBe(0n);

      const result2: U256 = mathSimulator.mulU128(zero, five);
      expect(result2.low.low).toBe(0n);
      expect(result2.low.high).toBe(0n);
      expect(result2.high.low).toBe(0n);
      expect(result2.high.high).toBe(0n);
    });

    test('should handle multiplication by one', () => {
      const one: U128 = { low: 1n, high: 0n };
      const five: U128 = { low: 5n, high: 0n };
      const result: U256 = mathSimulator.mulU128(one, five);
      expect(result.low.low).toBe(5n);
      expect(result.low.high).toBe(0n);
      expect(result.high.low).toBe(0n);
      expect(result.high.high).toBe(0n);

      const result2: U256 = mathSimulator.mulU128(five, one);
      expect(result2.low.low).toBe(5n);
      expect(result2.low.high).toBe(0n);
      expect(result2.high.low).toBe(0n);
      expect(result2.high.high).toBe(0n);
    });

    test('should handle equal U128 values', () => {
      const a: U128 = { low: 5n, high: 0n };
      const result: U256 = mathSimulator.mulU128(a, a);
      expect(result.low.low).toBe(25n);
      expect(result.low.high).toBe(0n);
      expect(result.high.low).toBe(0n);
      expect(result.high.high).toBe(0n);
    });

    test('should handle max U128 by two', () => {
      const a: U128 = { low: MAX_UINT64, high: MAX_UINT64 };
      const b: U128 = { low: 2n, high: 0n };
      const result: U256 = mathSimulator.mulU128(a, b);
      expect(result.low.low).toBe(MAX_UINT64 - 1n);
      expect(result.low.high).toBe(MAX_UINT64);
      expect(result.high.low).toBe(1n);
      expect(result.high.high).toBe(0n);
    });

    test('should handle multiplication with high part contribution', () => {
      const a: U128 = { low: 0n, high: 1n };
      const b: U128 = { low: 1n, high: 0n };
      const result: U256 = mathSimulator.mulU128(a, b);
      expect(result.low.low).toBe(0n);
      expect(result.low.high).toBe(1n);
      expect(result.high.low).toBe(0n);
      expect(result.high.high).toBe(0n);
    });
  });

  describe('div', () => {
    test('should divide small numbers', () => {
      const result = mathSimulator.div(10n, 3n);
      expect(result).toBe(3n);
    });

    test('should handle dividend is zero', () => {
      const result = mathSimulator.div(0n, 5n);
      expect(result).toBe(0n);
    });

    test('should handle divisor is one', () => {
      const result = mathSimulator.div(10n, 1n);
      expect(result).toBe(10n);
    });

    test('should handle dividend equals divisor', () => {
      const result = mathSimulator.div(5n, 5n);
      expect(result).toBe(1n);
    });

    test('should handle dividend less than divisor', () => {
      const result = mathSimulator.div(3n, 5n);
      expect(result).toBe(0n);
    });

    test('should handle max U128 by one', () => {
      const result = mathSimulator.div(MAX_UINT128, 1n);
      expect(result).toBe(MAX_UINT128);
    });

    test('should handle division with remainder', () => {
      const result = mathSimulator.div(100n, 7n);
      expect(result).toBe(14n);
    });

    test('should fail on division by zero', () => {
      expect(() => mathSimulator.div(5n, 0n)).toThrowError(
        'MathU128: division by zero',
      );
    });

    test('should fail when remainder >= divisor', () => {
      const sim = createMaliciousSimulator({
        mockDiv: () => ({
          quotient: 1n,
          remainder: 5n, // invalid: remainder == divisor
        }),
      });

      expect(() => sim.div(10n, 5n)).toThrow('MathU128: conversion invalid');
    });
  });

  describe('divU128', () => {
    test('should divide small U128 numbers', () => {
      const a: U128 = { low: 10n, high: 0n };
      const b: U128 = { low: 3n, high: 0n };
      const result = mathSimulator.divU128(a, b);
      expect(result.low).toBe(3n);
      expect(result.high).toBe(0n);
    });

    test('should handle dividend is zero', () => {
      const a: U128 = { low: 0n, high: 0n };
      const b: U128 = { low: 5n, high: 0n };
      const result = mathSimulator.divU128(a, b);
      expect(result.low).toBe(0n);
      expect(result.high).toBe(0n);
    });

    test('should handle divisor is one', () => {
      const a: U128 = { low: 10n, high: 0n };
      const b: U128 = { low: 1n, high: 0n };
      const result = mathSimulator.divU128(a, b);
      expect(result.low).toBe(10n);
      expect(result.high).toBe(0n);
    });

    test('should handle dividend equals divisor', () => {
      const a: U128 = { low: 5n, high: 0n };
      const b: U128 = { low: 5n, high: 0n };
      const result = mathSimulator.divU128(a, b);
      expect(result.low).toBe(1n);
      expect(result.high).toBe(0n);
    });

    test('should handle dividend less than divisor', () => {
      const a: U128 = { low: 3n, high: 0n };
      const b: U128 = { low: 5n, high: 0n };
      const result = mathSimulator.divU128(a, b);
      expect(result.low).toBe(0n);
      expect(result.high).toBe(0n);
    });

    test('should handle max U128 by one', () => {
      const a: U128 = { low: MAX_UINT64, high: MAX_UINT64 };
      const b: U128 = { low: 1n, high: 0n };
      const result = mathSimulator.divU128(a, b);
      expect(result.low).toBe(MAX_UINT64);
      expect(result.high).toBe(MAX_UINT64);
    });

    test('should fail on division by zero', () => {
      const a: U128 = { low: 5n, high: 0n };
      const b: U128 = { low: 0n, high: 0n };
      expect(() => mathSimulator.divU128(a, b)).toThrowError(
        'MathU128: division by zero',
      );
    });

    test('should fail when remainder >= divisor', () => {
      const sim = createMaliciousSimulator({
        mockDiv: () => ({
          quotient: 1n,
          remainder: 5n, // divisor = 5n, remainder == 5n → invalid
        }),
      });

      const a: U128 = { low: 10n, high: 0n };
      const b: U128 = { low: 5n, high: 0n };
      expect(() => sim.divU128(a, b)).toThrow('MathU128: conversion invalid');
    });
  });

  describe('rem', () => {
    test('should compute remainder of small numbers', () => {
      const remainder = mathSimulator.rem(10n, 3n);
      expect(remainder).toBe(1n);
    });

    test('should handle dividend is zero', () => {
      const remainder = mathSimulator.rem(0n, 5n);
      expect(remainder).toBe(0n);
    });

    test('should handle divisor is one', () => {
      const remainder = mathSimulator.rem(10n, 1n);
      expect(remainder).toBe(0n);
    });

    test('should handle dividend equals divisor', () => {
      const remainder = mathSimulator.rem(5n, 5n);
      expect(remainder).toBe(0n);
    });

    test('should handle dividend less than divisor', () => {
      const remainder = mathSimulator.rem(3n, 5n);
      expect(remainder).toBe(3n);
    });

    test('should compute remainder of max U128 by 2', () => {
      const remainder = mathSimulator.rem(MAX_UINT128, 2n);
      expect(remainder).toBe(1n);
    });

    test('should handle zero remainder', () => {
      const remainder = mathSimulator.rem(6n, 3n);
      expect(remainder).toBe(0n);
    });

    test('should fail on division by zero', () => {
      expect(() => mathSimulator.rem(5n, 0n)).toThrowError(
        'MathU128: division by zero',
      );
    });

    test('should fail when remainder >= divisor', () => {
      const sim = createMaliciousSimulator({
        mockDiv: () => ({
          quotient: 1n,
          remainder: 10n, // too big
        }),
      });

      expect(() => sim.rem(20n, 10n)).toThrow('MathU128: conversion invalid');
    });
  });

  describe('remU128', () => {
    test('should compute remainder of small U128 numbers', () => {
      const a: U128 = { low: 10n, high: 0n };
      const b: U128 = { low: 3n, high: 0n };
      const result = mathSimulator.remU128(a, b);
      expect(result.low).toBe(1n);
      expect(result.high).toBe(0n);
    });

    test('should handle dividend is zero', () => {
      const a: U128 = { low: 0n, high: 0n };
      const b: U128 = { low: 5n, high: 0n };
      const result = mathSimulator.remU128(a, b);
      expect(result.low).toBe(0n);
      expect(result.high).toBe(0n);
    });

    test('should handle divisor is one', () => {
      const a: U128 = { low: 10n, high: 0n };
      const b: U128 = { low: 1n, high: 0n };
      const result = mathSimulator.remU128(a, b);
      expect(result.low).toBe(0n);
      expect(result.high).toBe(0n);
    });

    test('should handle dividend equals divisor', () => {
      const a: U128 = { low: 5n, high: 0n };
      const b: U128 = { low: 5n, high: 0n };
      const result = mathSimulator.remU128(a, b);
      expect(result.low).toBe(0n);
      expect(result.high).toBe(0n);
    });

    test('should handle dividend less than divisor', () => {
      const a: U128 = { low: 3n, high: 0n };
      const b: U128 = { low: 5n, high: 0n };
      const result = mathSimulator.remU128(a, b);
      expect(result.low).toBe(3n);
      expect(result.high).toBe(0n);
    });

    test('should compute remainder of max U128 by 2', () => {
      const a: U128 = { low: MAX_UINT64, high: MAX_UINT64 };
      const b: U128 = { low: 2n, high: 0n };
      const result = mathSimulator.remU128(a, b);
      expect(result.low).toBe(1n);
      expect(result.high).toBe(0n);
    });

    test('should fail on division by zero', () => {
      const a: U128 = { low: 5n, high: 0n };
      const b: U128 = { low: 0n, high: 0n };
      expect(() => mathSimulator.remU128(a, b)).toThrowError(
        'MathU128: division by zero',
      );
    });

    test('remU128 should fail when remainder >= divisor', () => {
      const sim = createMaliciousSimulator({
        mockDiv: () => ({
          quotient: 1n,
          remainder: 10n, // too big
        }),
      });

      const a: U128 = { low: 20n, high: 0n };
      const b: U128 = { low: 10n, high: 0n };
      expect(() => sim.remU128(a, b)).toThrow('MathU128: conversion invalid');
    });
  });
  describe('divRem', () => {
    test('should handle basic division with remainder', () => {
      const result = mathSimulator.divRem(17n, 5n);
      expect(result.quotient.low).toBe(3n);
      expect(result.quotient.high).toBe(0n);
      expect(result.remainder.low).toBe(2n);
      expect(result.remainder.high).toBe(0n);
    });

    test('should handle division without remainder', () => {
      const result = mathSimulator.divRem(15n, 3n);
      expect(result.quotient.low).toBe(5n);
      expect(result.quotient.high).toBe(0n);
      expect(result.remainder.low).toBe(0n);
      expect(result.remainder.high).toBe(0n);
    });

    test('should handle dividend equals divisor', () => {
      const result = mathSimulator.divRem(5n, 5n);
      expect(result.quotient.low).toBe(1n);
      expect(result.quotient.high).toBe(0n);
      expect(result.remainder.low).toBe(0n);
      expect(result.remainder.high).toBe(0n);
    });

    test('should handle dividend less than divisor', () => {
      const result = mathSimulator.divRem(3n, 5n);
      expect(result.quotient.low).toBe(0n);
      expect(result.quotient.high).toBe(0n);
      expect(result.remainder.low).toBe(3n);
      expect(result.remainder.high).toBe(0n);
    });

    test('should compute division of max U128 by 2', () => {
      const result = mathSimulator.divRem(MAX_UINT128, 2n);
      expect(result.quotient.low).toBe(MAX_UINT64);
      expect(result.quotient.high).toBe(MAX_UINT64 >> 1n);
      expect(result.remainder.low).toBe(1n);
      expect(result.remainder.high).toBe(0n);
    });

    test('should fail on division by zero', () => {
      expect(() => mathSimulator.divRem(5n, 0n)).toThrowError(
        'MathU128: division by zero',
      );
    });
  });

  describe('divRemU128', () => {
    test('should handle basic division with remainder', () => {
      const a: U128 = { low: 17n, high: 0n };
      const b: U128 = { low: 5n, high: 0n };
      const result = mathSimulator.divRemU128(a, b);
      expect(result.quotient.low).toBe(3n);
      expect(result.quotient.high).toBe(0n);
      expect(result.remainder.low).toBe(2n);
      expect(result.remainder.high).toBe(0n);
    });

    test('should handle division without remainder', () => {
      const a: U128 = { low: 15n, high: 0n };
      const b: U128 = { low: 3n, high: 0n };
      const result = mathSimulator.divRemU128(a, b);
      expect(result.quotient.low).toBe(5n);
      expect(result.quotient.high).toBe(0n);
      expect(result.remainder.low).toBe(0n);
      expect(result.remainder.high).toBe(0n);
    });

    test('should handle dividend equals divisor', () => {
      const a: U128 = { low: 5n, high: 0n };
      const b: U128 = { low: 5n, high: 0n };
      const result = mathSimulator.divRemU128(a, b);
      expect(result.quotient.low).toBe(1n);
      expect(result.quotient.high).toBe(0n);
      expect(result.remainder.low).toBe(0n);
      expect(result.remainder.high).toBe(0n);
    });

    test('should handle dividend less than divisor', () => {
      const a: U128 = { low: 3n, high: 0n };
      const b: U128 = { low: 5n, high: 0n };
      const result = mathSimulator.divRemU128(a, b);
      expect(result.quotient.low).toBe(0n);
      expect(result.quotient.high).toBe(0n);
      expect(result.remainder.low).toBe(3n);
      expect(result.remainder.high).toBe(0n);
    });

    test('should compute division of max U128 by 2', () => {
      const a: U128 = { low: MAX_UINT64, high: MAX_UINT64 };
      const b: U128 = { low: 2n, high: 0n };
      const result = mathSimulator.divRemU128(a, b);
      expect(result.quotient.low).toBe(MAX_UINT64);
      expect(result.quotient.high).toBe(MAX_UINT64 >> 1n);
      expect(result.remainder.low).toBe(1n);
      expect(result.remainder.high).toBe(0n);
    });

    test('should fail on division by zero', () => {
      const a: U128 = { low: 5n, high: 0n };
      const b: U128 = { low: 0n, high: 0n };
      expect(() => mathSimulator.divRemU128(a, b)).toThrowError(
        'MathU128: division by zero',
      );
    });
  });

  describe('sqrt', () => {
    test('should handle zero', () => {
      expect(mathSimulator.sqrt(0n)).toBe(0n);
    });

    test('should handle one', () => {
      expect(mathSimulator.sqrt(1n)).toBe(1n);
    });

    test('should handle small non-perfect squares', () => {
      expect(mathSimulator.sqrt(2n)).toBe(1n); // floor(sqrt(2)) ≈ 1.414
      expect(mathSimulator.sqrt(3n)).toBe(1n); // floor(sqrt(3)) ≈ 1.732
      expect(mathSimulator.sqrt(5n)).toBe(2n); // floor(sqrt(5)) ≈ 2.236
    });

    test('should handle small perfect squares', () => {
      expect(mathSimulator.sqrt(4n)).toBe(2n);
      expect(mathSimulator.sqrt(9n)).toBe(3n);
      expect(mathSimulator.sqrt(16n)).toBe(4n);
    });

    test('should handle maximum values', () => {
      expect(mathSimulator.sqrt(MAX_UINT8)).toBe(15n);
      expect(mathSimulator.sqrt(MAX_UINT16)).toBe(255n);
      expect(mathSimulator.sqrt(MAX_UINT32)).toBe(65535n);
      expect(mathSimulator.sqrt(MAX_UINT64)).toBe(4294967295n);
      expect(mathSimulator.sqrt(MAX_UINT128)).toBe(MAX_UINT64);
    });

    test('should handle large perfect square', () => {
      expect(mathSimulator.sqrt(1000000n)).toBe(1000n);
    });

    test('should handle large non-perfect square', () => {
      expect(mathSimulator.sqrt(100000001n)).toBe(10000n); // floor(sqrt(100000001)) ≈ 10000.00005
    });

    test('should fail if sqrt witness overestimates (root^2 > radicand)', () => {
      const sim = createMaliciousSimulator({
        mockSqrt: () => 11n, // 11^2 = 121 > 100
      });
      expect(() => sim.sqrt(100n)).toThrow('MathU128: sqrt overestimate');
    });

    test('should fail if sqrt witness underestimates (next^2 <= radicand)', () => {
      const sim = createMaliciousSimulator({
        mockSqrt: () => 9n, // (9+1)^2 = 100 <= 100
      });
      expect(() => sim.sqrt(100n)).toThrow('MathU128: sqrt underestimate');
    });
  });

  describe('sqrtU128', () => {
    test('should handle zero', () => {
      const zero: U128 = { low: 0n, high: 0n };
      expect(mathSimulator.sqrtU128(zero)).toBe(0n);
    });

    test('should handle one', () => {
      const one: U128 = { low: 1n, high: 0n };
      expect(mathSimulator.sqrtU128(one)).toBe(1n);
    });

    test('should handle small non-perfect squares', () => {
      const two: U128 = { low: 2n, high: 0n };
      const three: U128 = { low: 3n, high: 0n };
      const five: U128 = { low: 5n, high: 0n };
      expect(mathSimulator.sqrtU128(two)).toBe(1n); // floor(sqrt(2)) ≈ 1.414
      expect(mathSimulator.sqrtU128(three)).toBe(1n); // floor(sqrt(3)) ≈ 1.732
      expect(mathSimulator.sqrtU128(five)).toBe(2n); // floor(sqrt(5)) ≈ 2.236
    });

    test('should handle small perfect squares', () => {
      const four: U128 = { low: 4n, high: 0n };
      const nine: U128 = { low: 9n, high: 0n };
      const sixteen: U128 = { low: 16n, high: 0n };
      expect(mathSimulator.sqrtU128(four)).toBe(2n);
      expect(mathSimulator.sqrtU128(nine)).toBe(3n);
      expect(mathSimulator.sqrtU128(sixteen)).toBe(4n);
    });

    test('should handle maximum values', () => {
      const maxU8: U128 = { low: MAX_UINT8, high: 0n };
      const maxU16: U128 = { low: MAX_UINT16, high: 0n };
      const maxU32: U128 = { low: MAX_UINT32, high: 0n };
      const maxU64: U128 = { low: MAX_UINT64, high: 0n };
      const maxU128: U128 = { low: MAX_UINT64, high: MAX_UINT64 };
      expect(mathSimulator.sqrtU128(maxU8)).toBe(15n);
      expect(mathSimulator.sqrtU128(maxU16)).toBe(255n);
      expect(mathSimulator.sqrtU128(maxU32)).toBe(65535n);
      expect(mathSimulator.sqrtU128(maxU64)).toBe(4294967295n);
      expect(mathSimulator.sqrtU128(maxU128)).toBe(MAX_UINT64);
    });

    test('should handle large perfect square', () => {
      const large: U128 = { low: 1000000n, high: 0n };
      expect(mathSimulator.sqrtU128(large)).toBe(1000n);
    });

    test('should handle large non-perfect square', () => {
      const large: U128 = { low: 100000001n, high: 0n };
      expect(mathSimulator.sqrtU128(large)).toBe(10000n); // floor(sqrt(100000001)) ≈ 10000.00005
    });
  });

  describe('min', () => {
    test('should return minimum of small numbers', () => {
      expect(mathSimulator.min(5n, 3n)).toBe(3n);
      expect(mathSimulator.min(3n, 5n)).toBe(3n);
      expect(mathSimulator.min(5n, 5n)).toBe(5n);
    });

    test('should handle max Uint<128>', () => {
      expect(mathSimulator.min(MAX_UINT128, 1n)).toBe(1n);
      expect(mathSimulator.min(MAX_UINT128, MAX_UINT128)).toBe(MAX_UINT128);
    });

    test('should handle zero', () => {
      expect(mathSimulator.min(0n, 5n)).toBe(0n);
      expect(mathSimulator.min(5n, 0n)).toBe(0n);
    });
  });

  describe('minU128', () => {
    test('should return minimum of small U128 numbers', () => {
      const a: U128 = { low: 5n, high: 0n };
      const b: U128 = { low: 3n, high: 0n };
      const result = mathSimulator.minU128(a, b);
      expect(result.low).toBe(3n);
      expect(result.high).toBe(0n);
    });

    test('should handle large U128 numbers', () => {
      const a: U128 = { low: MAX_UINT64, high: MAX_UINT64 };
      const b: U128 = { low: 1n, high: 0n };
      const result = mathSimulator.minU128(a, b);
      expect(result.low).toBe(1n);
      expect(result.high).toBe(0n);
    });
  });

  describe('max', () => {
    test('should return maximum of small numbers', () => {
      expect(mathSimulator.max(5n, 3n)).toBe(5n);
      expect(mathSimulator.max(3n, 5n)).toBe(5n);
      expect(mathSimulator.max(5n, 5n)).toBe(5n);
    });

    test('should handle max Uint<128>', () => {
      expect(mathSimulator.max(MAX_UINT128, 1n)).toBe(MAX_UINT128);
      expect(mathSimulator.max(MAX_UINT128, MAX_UINT128)).toBe(MAX_UINT128);
    });

    test('should handle zero', () => {
      expect(mathSimulator.max(0n, 5n)).toBe(5n);
      expect(mathSimulator.max(5n, 0n)).toBe(5n);
    });
  });

  describe('maxU128', () => {
    test('should return maximum of small U128 numbers', () => {
      const a: U128 = { low: 5n, high: 0n };
      const b: U128 = { low: 3n, high: 0n };
      const result = mathSimulator.maxU128(a, b);
      expect(result.low).toBe(5n);
      expect(result.high).toBe(0n);
    });

    test('should handle large U128 numbers', () => {
      const a: U128 = { low: MAX_UINT64, high: MAX_UINT64 };
      const b: U128 = { low: 1n, high: 0n };
      const result = mathSimulator.maxU128(a, b);
      expect(result.low).toBe(MAX_UINT64);
      expect(result.high).toBe(MAX_UINT64);
    });
  });

  describe('isMultiple', () => {
    test('should check if small number is multiple', () => {
      expect(mathSimulator.isMultiple(6n, 3n)).toBe(true);
      expect(mathSimulator.isMultiple(7n, 3n)).toBe(false);
    });

    test('should check max Uint<128> is multiple of 1', () => {
      expect(mathSimulator.isMultiple(MAX_UINT128, 1n)).toBe(true);
    });

    test('should fail on division by zero', () => {
      expect(() => mathSimulator.isMultiple(5n, 0n)).toThrowError(
        'MathU128: division by zero',
      );
    });

    test('should handle large divisors', () => {
      expect(mathSimulator.isMultiple(MAX_UINT128, MAX_UINT128)).toBe(true);
      expect(mathSimulator.isMultiple(MAX_UINT128 - 1n, MAX_UINT128)).toBe(
        false,
      );
    });
  });

  describe('isMultipleU128', () => {
    test('should check if small U128 number is multiple', () => {
      const a: U128 = { low: 6n, high: 0n };
      const b: U128 = { low: 3n, high: 0n };
      expect(mathSimulator.isMultipleU128(a, b)).toBe(true);
    });

    test('should check large U128 numbers', () => {
      const a: U128 = { low: MAX_UINT64, high: MAX_UINT64 };
      const b: U128 = { low: 1n, high: 0n };
      expect(mathSimulator.isMultipleU128(a, b)).toBe(true);
    });

    test('should fail on division by zero', () => {
      const a: U128 = { low: 5n, high: 0n };
      const b: U128 = { low: 0n, high: 0n };
      expect(() => mathSimulator.isMultipleU128(a, b)).toThrowError(
        'MathU128: division by zero',
      );
    });
  });
});
