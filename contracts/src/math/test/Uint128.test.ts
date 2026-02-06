import type {
  U128,
  U256,
} from '@src/artifacts/math/test/mocks/contracts/Uint128.mock/contract/index.d.ts';
import { beforeEach, describe, expect, test } from 'vitest';
import {
  MAX_UINT8,
  MAX_UINT16,
  MAX_UINT32,
  MAX_UINT64,
  MAX_UINT128,
} from '../utils/consts.js';
import { Uint128Simulator } from './mocks/Uint128Simulator.js';

let uint128Simulator: Uint128Simulator;

const setup = () => {
  uint128Simulator = new Uint128Simulator();
};

describe('Uint128', () => {
  beforeEach(setup);

  test('MODULUS', () => {
    const result = uint128Simulator.MODULUS();
    expect(result).toBe(MAX_UINT64 + 1n);
  });

  test('ZERO_U128', () => {
    const result = uint128Simulator.ZERO_U128();
    expect(result).toEqual({ low: 0n, high: 0n });
  });

  describe('toU128', () => {
    test('should convert small Uint<128> to U128', () => {
      const value = 123n;
      const result = uint128Simulator.toU128(value);
      expect(result.low).toBe(value);
      expect(result.high).toBe(0n);
    });

    test('should convert max Uint<128> to U128', () => {
      const result = uint128Simulator.toU128(MAX_UINT128);
      expect(result.low).toBe(MAX_UINT64);
      expect(result.high).toBe(MAX_UINT64);
    });

    test('should handle zero', () => {
      const result = uint128Simulator.toU128(0n);
      expect(result.low).toBe(0n);
      expect(result.high).toBe(0n);
    });

    test('should fail when reconstruction is invalid', () => {
      uint128Simulator.overrideWitness('divUint128Locally', (context) => [
        context.privateState,
        { quotient: { low: 1n, high: 0n }, remainder: { low: 1n, high: 0n } },
      ]);
      expect(() => uint128Simulator.toU128(123n)).toThrow(
        'failed assert: MathU128: conversion invalid',
      );
    });
  });

  describe('fromU128', () => {
    test('should convert U128 to small Uint<128>', () => {
      const u128: U128 = { low: 123n, high: 0n };
      expect(uint128Simulator.fromU128(u128)).toBe(123n);
    });

    test('should convert U128 to max Uint<128>', () => {
      const u128: U128 = { low: MAX_UINT64, high: MAX_UINT64 };
      expect(uint128Simulator.fromU128(u128)).toBe(MAX_UINT128);
    });

    test('should handle zero U128', () => {
      const u128: U128 = { low: 0n, high: 0n };
      expect(uint128Simulator.fromU128(u128)).toBe(0n);
    });
  });

  describe('isZero', () => {
    test('should return true for zero', () => {
      expect(uint128Simulator.isZero(0n)).toBe(true);
    });

    test('should return false for non-zero', () => {
      expect(uint128Simulator.isZero(1n)).toBe(false);
    });
  });

  describe('isZeroU128', () => {
    test('should return true for zero U128', () => {
      const a: U128 = { low: 0n, high: 0n };
      expect(uint128Simulator.isZeroU128(a)).toBe(true);
    });

    test('should return false for non-zero U128', () => {
      const b: U128 = { low: 1n, high: 0n };
      expect(uint128Simulator.isZeroU128(b)).toBe(false);
    });
  });

  describe('eq', () => {
    test('should return true for equal numbers', () => {
      expect(uint128Simulator.eq(5n, 5n)).toBe(true);
    });

    test('should return false for non-equal numbers', () => {
      expect(uint128Simulator.eq(5n, 10n)).toBe(false);
    });
  });

  describe('eqU128', () => {
    test('should return true for equal U128 numbers', () => {
      const a: U128 = { low: 5n, high: 0n };
      expect(uint128Simulator.eqU128(a, a)).toBe(true);
    });

    test('should return false for non-equal U128 numbers', () => {
      const a: U128 = { low: 5n, high: 0n };
      const b: U128 = { low: 10n, high: 0n };
      expect(uint128Simulator.eqU128(a, b)).toBe(false);
    });
  });

  describe('lte', () => {
    test('should compare small numbers', () => {
      expect(uint128Simulator.lte(5n, 10n)).toBe(true);
      expect(uint128Simulator.lte(10n, 5n)).toBe(false);
      expect(uint128Simulator.lte(5n, 5n)).toBe(true);
    });

    test('should compare max Uint<128>', () => {
      expect(uint128Simulator.lte(MAX_UINT128, MAX_UINT128)).toBe(true);
      expect(uint128Simulator.lte(MAX_UINT128 - 1n, MAX_UINT128)).toBe(true);
    });

    test('should handle zero', () => {
      expect(uint128Simulator.lte(0n, 1n)).toBe(true);
      expect(uint128Simulator.lte(0n, 0n)).toBe(true);
    });
  });

  describe('lteU128', () => {
    test('should compare small U128 numbers', () => {
      const a: U128 = { low: 5n, high: 0n };
      const b: U128 = { low: 10n, high: 0n };
      expect(uint128Simulator.lteU128(a, b)).toBe(true);
      expect(uint128Simulator.lteU128(b, a)).toBe(false);
      expect(uint128Simulator.lteU128(a, a)).toBe(true);
    });

    test('should compare U128 with high parts', () => {
      const a: U128 = { low: MAX_UINT64, high: MAX_UINT64 - 1n };
      const b: U128 = { low: MAX_UINT64, high: MAX_UINT64 };
      expect(uint128Simulator.lteU128(a, b)).toBe(true);
    });

    test('should return true for equal U128 numbers', () => {
      const a: U128 = { low: 5n, high: 0n };
      expect(uint128Simulator.lteU128(a, a)).toBe(true);
    });
  });

  describe('lt', () => {
    test('should compare small numbers', () => {
      expect(uint128Simulator.lt(5n, 10n)).toBe(true);
      expect(uint128Simulator.lt(10n, 5n)).toBe(false);
      expect(uint128Simulator.lt(5n, 5n)).toBe(false);
    });

    test('should compare max Uint<128>', () => {
      expect(uint128Simulator.lt(MAX_UINT128, MAX_UINT128)).toBe(false);
      expect(uint128Simulator.lt(MAX_UINT128 - 1n, MAX_UINT128)).toBe(true);
    });

    test('should handle zero', () => {
      expect(uint128Simulator.lt(0n, 1n)).toBe(true);
      expect(uint128Simulator.lt(0n, 0n)).toBe(false);
    });
  });

  describe('ltU128', () => {
    test('should compare small U128 numbers', () => {
      const a: U128 = { low: 5n, high: 0n };
      const b: U128 = { low: 10n, high: 0n };
      expect(uint128Simulator.ltU128(a, b)).toBe(true);
      expect(uint128Simulator.ltU128(b, a)).toBe(false);
      expect(uint128Simulator.ltU128(a, a)).toBe(false);
    });

    test('should compare U128 with high parts', () => {
      const a: U128 = { low: MAX_UINT64, high: MAX_UINT64 - 1n };
      const b: U128 = { low: MAX_UINT64, high: MAX_UINT64 };
      expect(uint128Simulator.ltU128(a, b)).toBe(true);
    });

    test('should return false for equal U128 numbers', () => {
      const a: U128 = { low: 5n, high: 0n };
      expect(uint128Simulator.ltU128(a, a)).toBe(false);
    });
  });

  describe('gt', () => {
    test('should compare small numbers', () => {
      expect(uint128Simulator.gt(10n, 5n)).toBe(true);
      expect(uint128Simulator.gt(5n, 10n)).toBe(false);
      expect(uint128Simulator.gt(5n, 5n)).toBe(false);
    });

    test('should compare max Uint<128>', () => {
      expect(uint128Simulator.gt(MAX_UINT128, MAX_UINT128 - 1n)).toBe(true);
      expect(uint128Simulator.gt(MAX_UINT128, MAX_UINT128)).toBe(false);
    });

    test('should handle zero', () => {
      expect(uint128Simulator.gt(1n, 0n)).toBe(true);
      expect(uint128Simulator.gt(0n, 0n)).toBe(false);
    });
  });

  describe('gtU128', () => {
    test('should compare small U128 numbers', () => {
      const a: U128 = { low: 10n, high: 0n };
      const b: U128 = { low: 5n, high: 0n };
      expect(uint128Simulator.gtU128(a, b)).toBe(true);
      expect(uint128Simulator.gtU128(b, a)).toBe(false);
      expect(uint128Simulator.gtU128(a, a)).toBe(false);
    });

    test('should compare U128 with high parts', () => {
      const a: U128 = { low: MAX_UINT64, high: MAX_UINT64 };
      const b: U128 = { low: MAX_UINT64, high: MAX_UINT64 - 1n };
      expect(uint128Simulator.gtU128(a, b)).toBe(true);
    });

    test('should return false for equal U128 numbers', () => {
      const a: U128 = { low: 5n, high: 0n };
      expect(uint128Simulator.gtU128(a, a)).toBe(false);
    });
  });

  describe('gte', () => {
    test('should compare small numbers', () => {
      expect(uint128Simulator.gte(10n, 5n)).toBe(true);
      expect(uint128Simulator.gte(5n, 10n)).toBe(false);
      expect(uint128Simulator.gte(5n, 5n)).toBe(true);
    });

    test('should compare max Uint<128>', () => {
      expect(uint128Simulator.gte(MAX_UINT128, MAX_UINT128 - 1n)).toBe(true);
      expect(uint128Simulator.gte(MAX_UINT128, MAX_UINT128)).toBe(true);
    });

    test('should handle zero', () => {
      expect(uint128Simulator.gte(1n, 0n)).toBe(true);
      expect(uint128Simulator.gte(0n, 0n)).toBe(true);
    });
  });

  describe('gteU128', () => {
    test('should compare small U128 numbers', () => {
      const a: U128 = { low: 10n, high: 0n };
      const b: U128 = { low: 5n, high: 0n };
      expect(uint128Simulator.gteU128(a, b)).toBe(true);
      expect(uint128Simulator.gteU128(b, a)).toBe(false);
      expect(uint128Simulator.gteU128(a, a)).toBe(true);
    });

    test('should compare U128 with high parts', () => {
      const a: U128 = { low: MAX_UINT64, high: MAX_UINT64 };
      const b: U128 = { low: MAX_UINT64, high: MAX_UINT64 - 1n };
      expect(uint128Simulator.gteU128(a, b)).toBe(true);
    });

    test('should return true for equal U128 numbers', () => {
      const a: U128 = { low: 5n, high: 0n };
      expect(uint128Simulator.gteU128(a, a)).toBe(true);
    });
  });

  describe('add', () => {
    test('should add two small numbers', () => {
      const result: U256 = uint128Simulator.add(5n, 3n);
      expect(result.low.low).toBe(8n);
      expect(result.low.high).toBe(0n);
      expect(result.high.low).toBe(0n);
      expect(result.high.high).toBe(0n);
    });

    test('should handle zero addition', () => {
      const result: U256 = uint128Simulator.add(0n, 0n);
      expect(result.low.low).toBe(0n);
      expect(result.low.high).toBe(0n);
      expect(result.high.low).toBe(0n);
      expect(result.high.high).toBe(0n);
      const result2: U256 = uint128Simulator.add(5n, 0n);
      expect(result2.low.low).toBe(5n);
      expect(result2.low.high).toBe(0n);
      expect(result2.high.low).toBe(0n);
      expect(result2.high.high).toBe(0n);
      const result3: U256 = uint128Simulator.add(0n, 5n);
      expect(result3.low.low).toBe(5n);
      expect(result3.low.high).toBe(0n);
      expect(result3.high.low).toBe(0n);
      expect(result3.high.high).toBe(0n);
    });

    test('should handle equal values', () => {
      const result: U256 = uint128Simulator.add(5n, 5n);
      expect(result.low.low).toBe(10n);
      expect(result.low.high).toBe(0n);
      expect(result.high.low).toBe(0n);
      expect(result.high.high).toBe(0n);
    });

    test('should handle max U128 minus 1 plus 1', () => {
      const result: U256 = uint128Simulator.add(MAX_UINT128 - 1n, 1n);
      expect(result.low.low).toBe(MAX_UINT64);
      expect(result.low.high).toBe(MAX_UINT64);
      expect(result.high.low).toBe(0n);
      expect(result.high.high).toBe(0n);
    });

    test('should handle max U128 plus 1', () => {
      const result: U256 = uint128Simulator.add(MAX_UINT128, 1n);
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
      const result: U256 = uint128Simulator.addU128(a, b);
      expect(result.low.low).toBe(8n);
      expect(result.low.high).toBe(0n);
      expect(result.high.low).toBe(0n);
      expect(result.high.high).toBe(0n);
    });

    test('should handle zero addition', () => {
      const zero: U128 = { low: 0n, high: 0n };
      const five: U128 = { low: 5n, high: 0n };
      const result: U256 = uint128Simulator.addU128(zero, zero);
      expect(result.low.low).toBe(0n);
      expect(result.low.high).toBe(0n);
      expect(result.high.low).toBe(0n);
      expect(result.high.high).toBe(0n);

      const result2: U256 = uint128Simulator.addU128(five, zero);
      expect(result2.low.low).toBe(5n);
      expect(result2.low.high).toBe(0n);
      expect(result2.high.low).toBe(0n);
      expect(result2.high.high).toBe(0n);

      const result3: U256 = uint128Simulator.addU128(zero, five);
      expect(result3.low.low).toBe(5n);
      expect(result3.low.high).toBe(0n);
      expect(result3.high.low).toBe(0n);
      expect(result3.high.high).toBe(0n);
    });

    test('should handle equal U128 values', () => {
      const a: U128 = { low: 5n, high: 0n };
      const result: U256 = uint128Simulator.addU128(a, a);
      expect(result.low.low).toBe(10n);
      expect(result.low.high).toBe(0n);
      expect(result.high.low).toBe(0n);
      expect(result.high.high).toBe(0n);
    });

    test('should handle max U128 plus one', () => {
      const a: U128 = { low: MAX_UINT64, high: MAX_UINT64 };
      const b: U128 = { low: 1n, high: 0n };
      const result: U256 = uint128Simulator.addU128(a, b);
      expect(result.low.low).toBe(0n);
      expect(result.low.high).toBe(0n);
      expect(result.high.low).toBe(1n);
      expect(result.high.high).toBe(0n);
    });

    test('should handle addition with carry', () => {
      const a: U128 = { low: MAX_UINT64, high: 0n };
      const b: U128 = { low: 1n, high: 0n };
      const result: U256 = uint128Simulator.addU128(a, b);
      expect(result.low.low).toBe(0n);
      expect(result.low.high).toBe(1n);
      expect(result.high.low).toBe(0n);
      expect(result.high.high).toBe(0n);
    });
  });

  describe('sub', () => {
    test('should subtract two small numbers', () => {
      const result = uint128Simulator.sub(10n, 4n);
      expect(result).toBe(6n);
    });

    test('should handle equal values', () => {
      const result = uint128Simulator.sub(4n, 4n);
      expect(result).toBe(0n);
    });

    test('should handle zero subtraction', () => {
      const result = uint128Simulator.sub(5n, 0n);
      expect(result).toBe(5n);
    });

    test('should handle max U128 minus one', () => {
      const result = uint128Simulator.sub(MAX_UINT128, 1n);
      expect(result).toBe(MAX_UINT128 - 1n);
    });

    test('should fail on underflow', () => {
      expect(() => uint128Simulator.sub(3n, 5n)).toThrowError(
        'failed assert: MathU128: subtraction underflow',
      );
      expect(() => uint128Simulator.sub(0n, 1n)).toThrowError(
        'failed assert: MathU128: subtraction underflow',
      );
    });
  });

  describe('subU128', () => {
    test('should subtract two small U128 numbers', () => {
      const a: U128 = { low: 10n, high: 0n };
      const b: U128 = { low: 4n, high: 0n };
      const result = uint128Simulator.subU128(a, b);
      expect(result.low).toBe(6n);
      expect(result.high).toBe(0n);
    });

    test('should handle equal U128 values', () => {
      const a: U128 = { low: 4n, high: 0n };
      const result = uint128Simulator.subU128(a, a);
      expect(result.low).toBe(0n);
      expect(result.high).toBe(0n);
    });

    test('should handle zero subtraction', () => {
      const a: U128 = { low: 5n, high: 0n };
      const b: U128 = { low: 0n, high: 0n };
      const result = uint128Simulator.subU128(a, b);
      expect(result.low).toBe(5n);
      expect(result.high).toBe(0n);
    });

    test('should handle max U128 minus one', () => {
      const a: U128 = { low: MAX_UINT64, high: MAX_UINT64 };
      const b: U128 = { low: 1n, high: 0n };
      const result = uint128Simulator.subU128(a, b);
      expect(result.low).toBe(MAX_UINT64 - 1n);
      expect(result.high).toBe(MAX_UINT64);
    });

    test('should subtract with borrow', () => {
      const a: U128 = { low: 0n, high: 1n };
      const b: U128 = { low: 1n, high: 0n };
      const result = uint128Simulator.subU128(a, b);
      expect(result.low).toBe(MAX_UINT64);
      expect(result.high).toBe(0n);
    });

    test('should fail on underflow', () => {
      const a: U128 = { low: 3n, high: 0n };
      const b: U128 = { low: 5n, high: 0n };
      expect(() => uint128Simulator.subU128(a, b)).toThrowError(
        'failed assert: MathU128: subtraction underflow',
      );
    });
  });

  describe('mul', () => {
    test('should multiply small numbers', () => {
      const result: U256 = uint128Simulator.mul(4n, 3n);
      expect(result.low.low).toBe(12n);
      expect(result.low.high).toBe(0n);
      expect(result.high.low).toBe(0n);
      expect(result.high.high).toBe(0n);
    });

    test('should handle zero multiplication', () => {
      const result: U256 = uint128Simulator.mul(5n, 0n);
      expect(result.low.low).toBe(0n);
      expect(result.low.high).toBe(0n);
      expect(result.high.low).toBe(0n);
      expect(result.high.high).toBe(0n);

      const result2: U256 = uint128Simulator.mul(0n, MAX_UINT128);
      expect(result2.low.low).toBe(0n);
      expect(result2.low.high).toBe(0n);
      expect(result2.high.low).toBe(0n);
      expect(result2.high.high).toBe(0n);
    });

    test('should handle multiplication by one', () => {
      const result: U256 = uint128Simulator.mul(1n, 5n);
      expect(result.low.low).toBe(5n);
      expect(result.low.high).toBe(0n);
      expect(result.high.low).toBe(0n);
      expect(result.high.high).toBe(0n);

      const result2: U256 = uint128Simulator.mul(5n, 1n);
      expect(result2.low.low).toBe(5n);
      expect(result2.low.high).toBe(0n);
      expect(result2.high.low).toBe(0n);
      expect(result2.high.high).toBe(0n);
    });

    test('should handle equal values', () => {
      const result: U256 = uint128Simulator.mul(5n, 5n);
      expect(result.low.low).toBe(25n);
      expect(result.low.high).toBe(0n);
      expect(result.high.low).toBe(0n);
      expect(result.high.high).toBe(0n);
    });

    test('should handle max U128 by one', () => {
      const result: U256 = uint128Simulator.mul(MAX_UINT128, 1n);
      expect(result.low.low).toBe(MAX_UINT64);
      expect(result.low.high).toBe(MAX_UINT64);
      expect(result.high.low).toBe(0n);
      expect(result.high.high).toBe(0n);
    });

    test('should handle max U128 by two', () => {
      const result: U256 = uint128Simulator.mul(MAX_UINT128, 2n);
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
      const result: U256 = uint128Simulator.mulU128(a, b);
      expect(result.low.low).toBe(12n);
      expect(result.low.high).toBe(0n);
      expect(result.high.low).toBe(0n);
      expect(result.high.high).toBe(0n);
    });

    test('should handle zero multiplication', () => {
      const zero: U128 = { low: 0n, high: 0n };
      const five: U128 = { low: 5n, high: 0n };
      const result: U256 = uint128Simulator.mulU128(five, zero);
      expect(result.low.low).toBe(0n);
      expect(result.low.high).toBe(0n);
      expect(result.high.low).toBe(0n);
      expect(result.high.high).toBe(0n);

      const result2: U256 = uint128Simulator.mulU128(zero, five);
      expect(result2.low.low).toBe(0n);
      expect(result2.low.high).toBe(0n);
      expect(result2.high.low).toBe(0n);
      expect(result2.high.high).toBe(0n);
    });

    test('should handle multiplication by one', () => {
      const one: U128 = { low: 1n, high: 0n };
      const five: U128 = { low: 5n, high: 0n };
      const result: U256 = uint128Simulator.mulU128(one, five);
      expect(result.low.low).toBe(5n);
      expect(result.low.high).toBe(0n);
      expect(result.high.low).toBe(0n);
      expect(result.high.high).toBe(0n);

      const result2: U256 = uint128Simulator.mulU128(five, one);
      expect(result2.low.low).toBe(5n);
      expect(result2.low.high).toBe(0n);
      expect(result2.high.low).toBe(0n);
      expect(result2.high.high).toBe(0n);
    });

    test('should handle equal U128 values', () => {
      const a: U128 = { low: 5n, high: 0n };
      const result: U256 = uint128Simulator.mulU128(a, a);
      expect(result.low.low).toBe(25n);
      expect(result.low.high).toBe(0n);
      expect(result.high.low).toBe(0n);
      expect(result.high.high).toBe(0n);
    });

    test('should handle max U128 by two', () => {
      const a: U128 = { low: MAX_UINT64, high: MAX_UINT64 };
      const b: U128 = { low: 2n, high: 0n };
      const result: U256 = uint128Simulator.mulU128(a, b);
      expect(result.low.low).toBe(MAX_UINT64 - 1n);
      expect(result.low.high).toBe(MAX_UINT64);
      expect(result.high.low).toBe(1n);
      expect(result.high.high).toBe(0n);
    });

    test('should handle multiplication with high part contribution', () => {
      const a: U128 = { low: 0n, high: 1n };
      const b: U128 = { low: 1n, high: 0n };
      const result: U256 = uint128Simulator.mulU128(a, b);
      expect(result.low.low).toBe(0n);
      expect(result.low.high).toBe(1n);
      expect(result.high.low).toBe(0n);
      expect(result.high.high).toBe(0n);
    });
  });

  describe('div', () => {
    test('should divide small numbers', () => {
      const result = uint128Simulator.div(10n, 3n);
      expect(result).toBe(3n);
    });

    test('should handle dividend is zero', () => {
      const result = uint128Simulator.div(0n, 5n);
      expect(result).toBe(0n);
    });

    test('should handle divisor is one', () => {
      const result = uint128Simulator.div(10n, 1n);
      expect(result).toBe(10n);
    });

    test('should handle dividend equals divisor', () => {
      const result = uint128Simulator.div(5n, 5n);
      expect(result).toBe(1n);
    });

    test('should handle dividend less than divisor', () => {
      const result = uint128Simulator.div(3n, 5n);
      expect(result).toBe(0n);
    });

    test('should handle max U128 by one', () => {
      const result = uint128Simulator.div(MAX_UINT128, 1n);
      expect(result).toBe(MAX_UINT128);
    });

    test('should handle division with remainder', () => {
      const result = uint128Simulator.div(100n, 7n);
      expect(result).toBe(14n);
    });

    test('should fail on division by zero', () => {
      expect(() => uint128Simulator.div(5n, 0n)).toThrowError(
        'failed assert: MathU128: division by zero',
      );
    });

    test('should fail when remainder >= divisor', () => {
      uint128Simulator.overrideWitness('divUint128Locally', (context) => [
        context.privateState,
        { quotient: { low: 1n, high: 0n }, remainder: { low: 5n, high: 0n } },
      ]);
      expect(() => uint128Simulator.div(10n, 5n)).toThrow(
        'failed assert: MathU128: conversion invalid',
      );
    });
  });

  describe('divU128', () => {
    test('should divide small U128 numbers', () => {
      const a: U128 = { low: 10n, high: 0n };
      const b: U128 = { low: 3n, high: 0n };
      const result = uint128Simulator.divU128(a, b);
      expect(result.low).toBe(3n);
      expect(result.high).toBe(0n);
    });

    test('should handle dividend is zero', () => {
      const a: U128 = { low: 0n, high: 0n };
      const b: U128 = { low: 5n, high: 0n };
      const result = uint128Simulator.divU128(a, b);
      expect(result.low).toBe(0n);
      expect(result.high).toBe(0n);
    });

    test('should handle divisor is one', () => {
      const a: U128 = { low: 10n, high: 0n };
      const b: U128 = { low: 1n, high: 0n };
      const result = uint128Simulator.divU128(a, b);
      expect(result.low).toBe(10n);
      expect(result.high).toBe(0n);
    });

    test('should handle dividend equals divisor', () => {
      const a: U128 = { low: 5n, high: 0n };
      const b: U128 = { low: 5n, high: 0n };
      const result = uint128Simulator.divU128(a, b);
      expect(result.low).toBe(1n);
      expect(result.high).toBe(0n);
    });

    test('should handle dividend less than divisor', () => {
      const a: U128 = { low: 3n, high: 0n };
      const b: U128 = { low: 5n, high: 0n };
      const result = uint128Simulator.divU128(a, b);
      expect(result.low).toBe(0n);
      expect(result.high).toBe(0n);
    });

    test('should handle max U128 by one', () => {
      const a: U128 = { low: MAX_UINT64, high: MAX_UINT64 };
      const b: U128 = { low: 1n, high: 0n };
      const result = uint128Simulator.divU128(a, b);
      expect(result.low).toBe(MAX_UINT64);
      expect(result.high).toBe(MAX_UINT64);
    });

    test('should fail on division by zero', () => {
      const a: U128 = { low: 5n, high: 0n };
      const b: U128 = { low: 0n, high: 0n };
      expect(() => uint128Simulator.divU128(a, b)).toThrowError(
        'failed assert: MathU128: division by zero',
      );
    });

    test('should fail when remainder >= divisor', () => {
      uint128Simulator.overrideWitness('divU128Locally', (context) => [
        context.privateState,
        { quotient: { low: 1n, high: 0n }, remainder: { low: 5n, high: 0n } },
      ]);
      const a: U128 = { low: 10n, high: 0n };
      const b: U128 = { low: 5n, high: 0n };
      expect(() => uint128Simulator.divU128(a, b)).toThrow(
        'failed assert: MathU128: remainder error',
      );
    });
  });

  describe('rem', () => {
    test('should compute remainder of small numbers', () => {
      const remainder = uint128Simulator.rem(10n, 3n);
      expect(remainder).toBe(1n);
    });

    test('should handle dividend is zero', () => {
      const remainder = uint128Simulator.rem(0n, 5n);
      expect(remainder).toBe(0n);
    });

    test('should handle divisor is one', () => {
      const remainder = uint128Simulator.rem(10n, 1n);
      expect(remainder).toBe(0n);
    });

    test('should handle dividend equals divisor', () => {
      const remainder = uint128Simulator.rem(5n, 5n);
      expect(remainder).toBe(0n);
    });

    test('should handle dividend less than divisor', () => {
      const remainder = uint128Simulator.rem(3n, 5n);
      expect(remainder).toBe(3n);
    });

    test('should compute remainder of max U128 by 2', () => {
      const remainder = uint128Simulator.rem(MAX_UINT128, 2n);
      expect(remainder).toBe(1n);
    });

    test('should handle zero remainder', () => {
      const remainder = uint128Simulator.rem(6n, 3n);
      expect(remainder).toBe(0n);
    });

    test('should fail on division by zero', () => {
      expect(() => uint128Simulator.rem(5n, 0n)).toThrowError(
        'failed assert: MathU128: division by zero',
      );
    });

    test('should fail when remainder >= divisor', () => {
      uint128Simulator.overrideWitness('divUint128Locally', (context) => [
        context.privateState,
        { quotient: { low: 1n, high: 0n }, remainder: { low: 10n, high: 0n } },
      ]);
      expect(() => uint128Simulator.rem(20n, 10n)).toThrow(
        'failed assert: MathU128: conversion invalid',
      );
    });
  });

  describe('remU128', () => {
    test('should compute remainder of small U128 numbers', () => {
      const a: U128 = { low: 10n, high: 0n };
      const b: U128 = { low: 3n, high: 0n };
      const result = uint128Simulator.remU128(a, b);
      expect(result.low).toBe(1n);
      expect(result.high).toBe(0n);
    });

    test('should handle dividend is zero', () => {
      const a: U128 = { low: 0n, high: 0n };
      const b: U128 = { low: 5n, high: 0n };
      const result = uint128Simulator.remU128(a, b);
      expect(result.low).toBe(0n);
      expect(result.high).toBe(0n);
    });

    test('should handle divisor is one', () => {
      const a: U128 = { low: 10n, high: 0n };
      const b: U128 = { low: 1n, high: 0n };
      const result = uint128Simulator.remU128(a, b);
      expect(result.low).toBe(0n);
      expect(result.high).toBe(0n);
    });

    test('should handle dividend equals divisor', () => {
      const a: U128 = { low: 5n, high: 0n };
      const b: U128 = { low: 5n, high: 0n };
      const result = uint128Simulator.remU128(a, b);
      expect(result.low).toBe(0n);
      expect(result.high).toBe(0n);
    });

    test('should handle dividend less than divisor', () => {
      const a: U128 = { low: 3n, high: 0n };
      const b: U128 = { low: 5n, high: 0n };
      const result = uint128Simulator.remU128(a, b);
      expect(result.low).toBe(3n);
      expect(result.high).toBe(0n);
    });

    test('should compute remainder of max U128 by 2', () => {
      const a: U128 = { low: MAX_UINT64, high: MAX_UINT64 };
      const b: U128 = { low: 2n, high: 0n };
      const result = uint128Simulator.remU128(a, b);
      expect(result.low).toBe(1n);
      expect(result.high).toBe(0n);
    });

    test('should fail on division by zero', () => {
      const a: U128 = { low: 5n, high: 0n };
      const b: U128 = { low: 0n, high: 0n };
      expect(() => uint128Simulator.remU128(a, b)).toThrowError(
        'failed assert: MathU128: division by zero',
      );
    });

    test('remU128 should fail when remainder >= divisor', () => {
      uint128Simulator.overrideWitness('divU128Locally', (context) => [
        context.privateState,
        { quotient: { low: 1n, high: 0n }, remainder: { low: 10n, high: 0n } },
      ]);
      const a: U128 = { low: 20n, high: 0n };
      const b: U128 = { low: 10n, high: 0n };
      expect(() => uint128Simulator.remU128(a, b)).toThrow(
        'failed assert: MathU128: remainder error',
      );
    });
  });
  describe('divRem', () => {
    test('should handle basic division with remainder', () => {
      const result = uint128Simulator.divRem(17n, 5n);
      expect(result.quotient.low).toBe(3n);
      expect(result.quotient.high).toBe(0n);
      expect(result.remainder.low).toBe(2n);
      expect(result.remainder.high).toBe(0n);
    });

    test('should handle division without remainder', () => {
      const result = uint128Simulator.divRem(15n, 3n);
      expect(result.quotient.low).toBe(5n);
      expect(result.quotient.high).toBe(0n);
      expect(result.remainder.low).toBe(0n);
      expect(result.remainder.high).toBe(0n);
    });

    test('should handle dividend equals divisor', () => {
      const result = uint128Simulator.divRem(5n, 5n);
      expect(result.quotient.low).toBe(1n);
      expect(result.quotient.high).toBe(0n);
      expect(result.remainder.low).toBe(0n);
      expect(result.remainder.high).toBe(0n);
    });

    test('should handle dividend less than divisor', () => {
      const result = uint128Simulator.divRem(3n, 5n);
      expect(result.quotient.low).toBe(0n);
      expect(result.quotient.high).toBe(0n);
      expect(result.remainder.low).toBe(3n);
      expect(result.remainder.high).toBe(0n);
    });

    test('should compute division of max U128 by 2', () => {
      const result = uint128Simulator.divRem(MAX_UINT128, 2n);
      expect(result.quotient.low).toBe(MAX_UINT64);
      expect(result.quotient.high).toBe(MAX_UINT64 >> 1n);
      expect(result.remainder.low).toBe(1n);
      expect(result.remainder.high).toBe(0n);
    });

    test('should fail on division by zero', () => {
      expect(() => uint128Simulator.divRem(5n, 0n)).toThrowError(
        'failed assert: MathU128: division by zero',
      );
    });
  });

  describe('divRemU128', () => {
    test('should handle basic division with remainder', () => {
      const a: U128 = { low: 17n, high: 0n };
      const b: U128 = { low: 5n, high: 0n };
      const result = uint128Simulator.divRemU128(a, b);
      expect(result.quotient.low).toBe(3n);
      expect(result.quotient.high).toBe(0n);
      expect(result.remainder.low).toBe(2n);
      expect(result.remainder.high).toBe(0n);
    });

    test('should handle division without remainder', () => {
      const a: U128 = { low: 15n, high: 0n };
      const b: U128 = { low: 3n, high: 0n };
      const result = uint128Simulator.divRemU128(a, b);
      expect(result.quotient.low).toBe(5n);
      expect(result.quotient.high).toBe(0n);
      expect(result.remainder.low).toBe(0n);
      expect(result.remainder.high).toBe(0n);
    });

    test('should handle dividend equals divisor', () => {
      const a: U128 = { low: 5n, high: 0n };
      const b: U128 = { low: 5n, high: 0n };
      const result = uint128Simulator.divRemU128(a, b);
      expect(result.quotient.low).toBe(1n);
      expect(result.quotient.high).toBe(0n);
      expect(result.remainder.low).toBe(0n);
      expect(result.remainder.high).toBe(0n);
    });

    test('should handle dividend less than divisor', () => {
      const a: U128 = { low: 3n, high: 0n };
      const b: U128 = { low: 5n, high: 0n };
      const result = uint128Simulator.divRemU128(a, b);
      expect(result.quotient.low).toBe(0n);
      expect(result.quotient.high).toBe(0n);
      expect(result.remainder.low).toBe(3n);
      expect(result.remainder.high).toBe(0n);
    });

    test('should compute division of max U128 by 2', () => {
      const a: U128 = { low: MAX_UINT64, high: MAX_UINT64 };
      const b: U128 = { low: 2n, high: 0n };
      const result = uint128Simulator.divRemU128(a, b);
      expect(result.quotient.low).toBe(MAX_UINT64);
      expect(result.quotient.high).toBe(MAX_UINT64 >> 1n);
      expect(result.remainder.low).toBe(1n);
      expect(result.remainder.high).toBe(0n);
    });

    test('should fail on division by zero', () => {
      const a: U128 = { low: 5n, high: 0n };
      const b: U128 = { low: 0n, high: 0n };
      expect(() => uint128Simulator.divRemU128(a, b)).toThrowError(
        'failed assert: MathU128: division by zero',
      );
    });
  });

  describe('sqrt', () => {
    test('should handle zero', () => {
      expect(uint128Simulator.sqrt(0n)).toBe(0n);
    });

    test('should handle one', () => {
      expect(uint128Simulator.sqrt(1n)).toBe(1n);
    });

    test('should handle small non-perfect squares', () => {
      expect(uint128Simulator.sqrt(2n)).toBe(1n); // floor(sqrt(2)) ≈ 1.414
      expect(uint128Simulator.sqrt(3n)).toBe(1n); // floor(sqrt(3)) ≈ 1.732
      expect(uint128Simulator.sqrt(5n)).toBe(2n); // floor(sqrt(5)) ≈ 2.236
    });

    test('should handle small perfect squares', () => {
      expect(uint128Simulator.sqrt(4n)).toBe(2n);
      expect(uint128Simulator.sqrt(9n)).toBe(3n);
      expect(uint128Simulator.sqrt(16n)).toBe(4n);
    });

    test('should handle maximum values', () => {
      expect(uint128Simulator.sqrt(MAX_UINT8)).toBe(15n);
      expect(uint128Simulator.sqrt(MAX_UINT16)).toBe(255n);
      expect(uint128Simulator.sqrt(MAX_UINT32)).toBe(65535n);
      expect(uint128Simulator.sqrt(MAX_UINT64)).toBe(4294967295n);
      expect(uint128Simulator.sqrt(MAX_UINT128)).toBe(MAX_UINT64);
    });

    test('should handle large perfect square', () => {
      expect(uint128Simulator.sqrt(1000000n)).toBe(1000n);
    });

    test('should handle large non-perfect square', () => {
      expect(uint128Simulator.sqrt(100000001n)).toBe(10000n); // floor(sqrt(100000001)) ≈ 10000.00005
    });

    test('should fail if sqrt witness overestimates (root^2 > radicand)', () => {
      uint128Simulator.overrideWitness('sqrtU128Locally', (context) => [
        context.privateState,
        11n,
      ]);
      expect(() => uint128Simulator.sqrt(100n)).toThrow(
        'failed assert: MathU128: sqrt overestimate',
      );
    });

    test('should fail if sqrt witness underestimates (next^2 <= radicand)', () => {
      uint128Simulator.overrideWitness('sqrtU128Locally', (context) => [
        context.privateState,
        9n,
      ]);
      expect(() => uint128Simulator.sqrt(100n)).toThrow(
        'failed assert: MathU128: sqrt underestimate',
      );
    });
  });

  describe('sqrtU128', () => {
    test('should handle zero', () => {
      const zero: U128 = { low: 0n, high: 0n };
      expect(uint128Simulator.sqrtU128(zero)).toBe(0n);
    });

    test('should handle one', () => {
      const one: U128 = { low: 1n, high: 0n };
      expect(uint128Simulator.sqrtU128(one)).toBe(1n);
    });

    test('should handle small non-perfect squares', () => {
      const two: U128 = { low: 2n, high: 0n };
      const three: U128 = { low: 3n, high: 0n };
      const five: U128 = { low: 5n, high: 0n };
      expect(uint128Simulator.sqrtU128(two)).toBe(1n); // floor(sqrt(2)) ≈ 1.414
      expect(uint128Simulator.sqrtU128(three)).toBe(1n); // floor(sqrt(3)) ≈ 1.732
      expect(uint128Simulator.sqrtU128(five)).toBe(2n); // floor(sqrt(5)) ≈ 2.236
    });

    test('should handle small perfect squares', () => {
      const four: U128 = { low: 4n, high: 0n };
      const nine: U128 = { low: 9n, high: 0n };
      const sixteen: U128 = { low: 16n, high: 0n };
      expect(uint128Simulator.sqrtU128(four)).toBe(2n);
      expect(uint128Simulator.sqrtU128(nine)).toBe(3n);
      expect(uint128Simulator.sqrtU128(sixteen)).toBe(4n);
    });

    test('should handle maximum values', () => {
      const maxU8: U128 = { low: MAX_UINT8, high: 0n };
      const maxU16: U128 = { low: MAX_UINT16, high: 0n };
      const maxU32: U128 = { low: MAX_UINT32, high: 0n };
      const maxU64: U128 = { low: MAX_UINT64, high: 0n };
      const maxU128: U128 = { low: MAX_UINT64, high: MAX_UINT64 };
      expect(uint128Simulator.sqrtU128(maxU8)).toBe(15n);
      expect(uint128Simulator.sqrtU128(maxU16)).toBe(255n);
      expect(uint128Simulator.sqrtU128(maxU32)).toBe(65535n);
      expect(uint128Simulator.sqrtU128(maxU64)).toBe(4294967295n);
      expect(uint128Simulator.sqrtU128(maxU128)).toBe(MAX_UINT64);
    });

    test('should handle large perfect square', () => {
      const large: U128 = { low: 1000000n, high: 0n };
      expect(uint128Simulator.sqrtU128(large)).toBe(1000n);
    });

    test('should handle large non-perfect square', () => {
      const large: U128 = { low: 100000001n, high: 0n };
      expect(uint128Simulator.sqrtU128(large)).toBe(10000n); // floor(sqrt(100000001)) ≈ 10000.00005
    });
  });

  describe('min', () => {
    test('should return minimum of small numbers', () => {
      expect(uint128Simulator.min(5n, 3n)).toBe(3n);
      expect(uint128Simulator.min(3n, 5n)).toBe(3n);
      expect(uint128Simulator.min(5n, 5n)).toBe(5n);
    });

    test('should handle max Uint<128>', () => {
      expect(uint128Simulator.min(MAX_UINT128, 1n)).toBe(1n);
      expect(uint128Simulator.min(MAX_UINT128, MAX_UINT128)).toBe(MAX_UINT128);
    });

    test('should handle zero', () => {
      expect(uint128Simulator.min(0n, 5n)).toBe(0n);
      expect(uint128Simulator.min(5n, 0n)).toBe(0n);
    });
  });

  describe('minU128', () => {
    test('should return minimum of small U128 numbers', () => {
      const a: U128 = { low: 5n, high: 0n };
      const b: U128 = { low: 3n, high: 0n };
      const result = uint128Simulator.minU128(a, b);
      expect(result.low).toBe(3n);
      expect(result.high).toBe(0n);
    });

    test('should handle large U128 numbers', () => {
      const a: U128 = { low: MAX_UINT64, high: MAX_UINT64 };
      const b: U128 = { low: 1n, high: 0n };
      const result = uint128Simulator.minU128(a, b);
      expect(result.low).toBe(1n);
      expect(result.high).toBe(0n);
    });
  });

  describe('max', () => {
    test('should return maximum of small numbers', () => {
      expect(uint128Simulator.max(5n, 3n)).toBe(5n);
      expect(uint128Simulator.max(3n, 5n)).toBe(5n);
      expect(uint128Simulator.max(5n, 5n)).toBe(5n);
    });

    test('should handle max Uint<128>', () => {
      expect(uint128Simulator.max(MAX_UINT128, 1n)).toBe(MAX_UINT128);
      expect(uint128Simulator.max(MAX_UINT128, MAX_UINT128)).toBe(MAX_UINT128);
    });

    test('should handle zero', () => {
      expect(uint128Simulator.max(0n, 5n)).toBe(5n);
      expect(uint128Simulator.max(5n, 0n)).toBe(5n);
    });
  });

  describe('maxU128', () => {
    test('should return maximum of small U128 numbers', () => {
      const a: U128 = { low: 5n, high: 0n };
      const b: U128 = { low: 3n, high: 0n };
      const result = uint128Simulator.maxU128(a, b);
      expect(result.low).toBe(5n);
      expect(result.high).toBe(0n);
    });

    test('should handle large U128 numbers', () => {
      const a: U128 = { low: MAX_UINT64, high: MAX_UINT64 };
      const b: U128 = { low: 1n, high: 0n };
      const result = uint128Simulator.maxU128(a, b);
      expect(result.low).toBe(MAX_UINT64);
      expect(result.high).toBe(MAX_UINT64);
    });
  });

  describe('isMultiple', () => {
    test('should check if small number is multiple', () => {
      expect(uint128Simulator.isMultiple(6n, 3n)).toBe(true);
      expect(uint128Simulator.isMultiple(7n, 3n)).toBe(false);
    });

    test('should check max Uint<128> is multiple of 1', () => {
      expect(uint128Simulator.isMultiple(MAX_UINT128, 1n)).toBe(true);
    });

    test('should fail on division by zero', () => {
      expect(() => uint128Simulator.isMultiple(5n, 0n)).toThrowError(
        'failed assert: MathU128: division by zero',
      );
    });

    test('should handle large divisors', () => {
      expect(uint128Simulator.isMultiple(MAX_UINT128, MAX_UINT128)).toBe(true);
      expect(uint128Simulator.isMultiple(MAX_UINT128 - 1n, MAX_UINT128)).toBe(
        false,
      );
    });
  });

  describe('isMultipleU128', () => {
    test('should check if small U128 number is multiple', () => {
      const a: U128 = { low: 6n, high: 0n };
      const b: U128 = { low: 3n, high: 0n };
      expect(uint128Simulator.isMultipleU128(a, b)).toBe(true);
    });

    test('should check large U128 numbers', () => {
      const a: U128 = { low: MAX_UINT64, high: MAX_UINT64 };
      const b: U128 = { low: 1n, high: 0n };
      expect(uint128Simulator.isMultipleU128(a, b)).toBe(true);
    });

    test('should fail on division by zero', () => {
      const a: U128 = { low: 5n, high: 0n };
      const b: U128 = { low: 0n, high: 0n };
      expect(() => uint128Simulator.isMultipleU128(a, b)).toThrowError(
        'failed assert: MathU128: division by zero',
      );
    });
  });
});

describe('Checked Operations', () => {
  describe('addChecked', () => {
    test('should add two numbers within bounds', () => {
      const a = 100n;
      const b = 200n;
      const result = uint128Simulator.addChecked(a, b);
      expect(result).toBe(300n);
    });

    test('should throw on overflow', () => {
      const a = MAX_UINT128;
      const b = 1n;
      expect(() => uint128Simulator.addChecked(a, b)).toThrow(
        'cast from Field or Uint value to smaller Uint value failed: 340282366920938463463374607431768211456 is greater than 340282366920938463463374607431768211455',
      );
    });
  });

  describe('addCheckedU128', () => {
    test('should add two U128 numbers within bounds', () => {
      const a = uint128Simulator.toU128(100n);
      const b = uint128Simulator.toU128(200n);
      const result = uint128Simulator.addCheckedU128(a, b);
      expect(result).toBe(300n);
    });

    test('should throw on overflow', () => {
      const a = uint128Simulator.toU128(2n ** 128n - 1n);
      const b = uint128Simulator.toU128(1n);
      expect(() => uint128Simulator.addCheckedU128(a, b)).toThrow(
        'cast from Field or Uint value to smaller Uint value failed: 340282366920938463463374607431768211456 is greater than 340282366920938463463374607431768211455',
      );
    });
  });

  describe('mulChecked', () => {
    test('should multiply two numbers within bounds', () => {
      const a = 100n;
      const b = 200n;
      const result = uint128Simulator.mulChecked(a, b);
      expect(result).toBe(20000n);
    });

    test('should throw on overflow', () => {
      const a = 2n ** 64n;
      const b = 2n ** 64n;
      expect(() => uint128Simulator.mulChecked(a, b)).toThrow(
        'failed assert: MathU128: multiplication overflow',
      );
    });
  });

  describe('mulCheckedU128', () => {
    test('should multiply two U128 numbers within bounds', () => {
      const a = uint128Simulator.toU128(100n);
      const b = uint128Simulator.toU128(200n);
      const result = uint128Simulator.mulCheckedU128(a, b);
      expect(result).toBe(20000n);
    });

    test('should throw on overflow', () => {
      const a = uint128Simulator.toU128(2n ** 64n);
      const b = uint128Simulator.toU128(2n ** 64n);
      expect(() => uint128Simulator.mulCheckedU128(a, b)).toThrow(
        'failed assert: MathU128: multiplication overflow',
      );
    });
  });

  describe('MAX_UINT128', () => {
    test('should return 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF', () => {
      expect(uint128Simulator.MAX_UINT128()).toBe(
        0xffffffffffffffffffffffffffffffffn,
      );
    });
  });

  describe('MAX_U128', () => {
    test('should return U128 with max values', () => {
      const result = uint128Simulator.MAX_U128();
      expect(result.low).toBe(0xffffffffffffffffn);
      expect(result.high).toBe(0xffffffffffffffffn);
    });
  });
});
