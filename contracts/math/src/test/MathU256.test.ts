import { beforeEach, describe, expect, test } from 'vitest';
import type { U256 } from '../artifacts/Index/contract/index.d.cts';
import {
  MAX_UINT8,
  MAX_UINT16,
  MAX_UINT32,
  MAX_UINT64,
  MAX_UINT128,
  MAX_UINT256,
} from '../utils/consts';
import {
  MathU256Simulator,
  createMaliciousSimulator,
} from './MathU256Simulator';

let mathSimulator: MathU256Simulator;

const setup = () => {
  mathSimulator = new MathU256Simulator();
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

describe('MathU256', () => {
  beforeEach(setup);

  describe('toU256 utils', () => {
    test('should return max struct', () => {
      const result = toU256(MAX_UINT256);
      expect(result.low.low).toBe(MAX_UINT64);
      expect(result.low.high).toBe(MAX_UINT64);
      expect(result.high.low).toBe(MAX_UINT64);
      expect(result.high.high).toBe(MAX_UINT64);
    });
  });

  describe('ZERO_U256', () => {
    test('should return zero struct', () => {
      const result = mathSimulator.ZERO_U256();
      expect(result.low.low).toBe(0n);
      expect(result.low.high).toBe(0n);
      expect(result.high.low).toBe(0n);
      expect(result.high.high).toBe(0n);
    });
  });

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
      const a: U256 = {
        low: { low: 123n, high: 0n },
        high: { low: 456n, high: 0n },
      };
      const b: U256 = {
        low: { low: 123n, high: 0n },
        high: { low: 457n, high: 0n },
      };
      expect(mathSimulator.eq(a, b)).toBe(false);
    });

    test('should compare zero values', () => {
      const zero: U256 = {
        low: { low: 0n, high: 0n },
        high: { low: 0n, high: 0n },
      };
      expect(mathSimulator.eq(zero, zero)).toBe(true);
    });

    test('should compare max U256 values', () => {
      const max = toU256(MAX_UINT256);
      expect(mathSimulator.eq(max, max)).toBe(true);
    });
  });

  describe('lte', () => {
    test('should compare small numbers', () => {
      const a = toU256(5n);
      const b = toU256(10n);
      expect(mathSimulator.lte(a, b)).toBe(true);
      expect(mathSimulator.lte(b, a)).toBe(false);
      expect(mathSimulator.lte(a, a)).toBe(true);
    });

    test('should compare max U256 values', () => {
      const max = toU256(MAX_UINT256);
      const maxMinusOne = toU256(MAX_UINT256 - 1n);
      expect(mathSimulator.lte(max, max)).toBe(true);
      expect(mathSimulator.lte(maxMinusOne, max)).toBe(true);
      expect(mathSimulator.lte(max, maxMinusOne)).toBe(false);
    });

    test('should handle zero', () => {
      const zero = toU256(0n);
      const one = toU256(1n);
      expect(mathSimulator.lte(zero, one)).toBe(true);
      expect(mathSimulator.lte(zero, zero)).toBe(true);
      expect(mathSimulator.lte(one, zero)).toBe(false);
    });

    test('should compare with high parts', () => {
      const a: U256 = {
        low: { low: MAX_UINT64, high: MAX_UINT64 },
        high: { low: 0n, high: 0n },
      };
      const b: U256 = {
        low: { low: MAX_UINT64, high: MAX_UINT64 },
        high: { low: 1n, high: 0n },
      };
      expect(mathSimulator.lte(a, b)).toBe(true);
      expect(mathSimulator.lte(b, a)).toBe(false);
    });
  });

  describe('lt', () => {
    test('should compare small numbers', () => {
      const a = toU256(5n);
      const b = toU256(10n);
      expect(mathSimulator.lt(a, b)).toBe(true);
      expect(mathSimulator.lt(b, a)).toBe(false);
      expect(mathSimulator.lt(a, a)).toBe(false);
    });

    test('should compare max U256 values', () => {
      const max = toU256(MAX_UINT256);
      const maxMinusOne = toU256(MAX_UINT256 - 1n);
      expect(mathSimulator.lt(max, max)).toBe(false);
      expect(mathSimulator.lt(maxMinusOne, max)).toBe(true);
      expect(mathSimulator.lt(max, maxMinusOne)).toBe(false);
    });

    test('should handle zero', () => {
      const zero = toU256(0n);
      const one = toU256(1n);
      expect(mathSimulator.lt(zero, one)).toBe(true);
      expect(mathSimulator.lt(zero, zero)).toBe(false);
      expect(mathSimulator.lt(one, zero)).toBe(false);
    });

    test('should compare with high parts', () => {
      const a: U256 = {
        low: { low: MAX_UINT64, high: MAX_UINT64 },
        high: { low: 0n, high: 0n },
      };
      const b: U256 = {
        low: { low: MAX_UINT64, high: MAX_UINT64 },
        high: { low: 1n, high: 0n },
      };
      expect(mathSimulator.lt(a, b)).toBe(true);
      expect(mathSimulator.lt(b, a)).toBe(false);
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
      const max = toU256(MAX_UINT256);
      const maxMinusOne = toU256(MAX_UINT256 - 1n);
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
      const a: U256 = {
        low: { low: MAX_UINT64, high: MAX_UINT64 },
        high: { low: 1n, high: 0n },
      };
      const b: U256 = {
        low: { low: MAX_UINT64, high: MAX_UINT64 },
        high: { low: 0n, high: 0n },
      };
      expect(mathSimulator.gt(a, b)).toBe(true);
      expect(mathSimulator.gt(b, a)).toBe(false);
    });
  });

  describe('gte', () => {
    test('should compare small numbers', () => {
      const a = toU256(10n);
      const b = toU256(5n);
      expect(mathSimulator.gte(a, b)).toBe(true);
      expect(mathSimulator.gte(b, a)).toBe(false);
      expect(mathSimulator.gte(a, a)).toBe(true);
    });

    test('should compare max U256 values', () => {
      const max = toU256(MAX_UINT256);
      const maxMinusOne = toU256(MAX_UINT256 - 1n);
      expect(mathSimulator.gte(max, maxMinusOne)).toBe(true);
      expect(mathSimulator.gte(maxMinusOne, max)).toBe(false);
      expect(mathSimulator.gte(max, max)).toBe(true);
    });

    test('should handle zero', () => {
      const zero = toU256(0n);
      const one = toU256(1n);
      expect(mathSimulator.gte(one, zero)).toBe(true);
      expect(mathSimulator.gte(zero, one)).toBe(false);
      expect(mathSimulator.gte(zero, zero)).toBe(true);
    });

    test('should compare with high parts', () => {
      const a: U256 = {
        low: { low: MAX_UINT64, high: MAX_UINT64 },
        high: { low: 1n, high: 0n },
      };
      const b: U256 = {
        low: { low: MAX_UINT64, high: MAX_UINT64 },
        high: { low: 0n, high: 0n },
      };
      expect(mathSimulator.gte(a, b)).toBe(true);
      expect(mathSimulator.gte(b, a)).toBe(false);
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
      const a = toU256(MAX_UINT256 - 1n);
      const b = toU256(1n);
      const result = mathSimulator.add(a, b);
      expect(fromU256(result)).toBe(MAX_UINT256);
    });

    test('should handle zero', () => {
      const zero = toU256(0n);
      const five = toU256(5n);
      const result = mathSimulator.add(zero, zero);
      expect(fromU256(result)).toBe(0n);
      const result2 = mathSimulator.add(five, zero);
      expect(fromU256(result2)).toBe(5n);
    });

    test('should handle zero addition (a = 0)', () => {
      const a = mathSimulator.ZERO_U256();
      const b = toU256(5n);
      const result = mathSimulator.add(a, b);
      expect(fromU256(result)).toBe(5n);
    });

    test('should handle zero addition (b = 0)', () => {
      const a = toU256(5n);
      const b = mathSimulator.ZERO_U256();
      const result = mathSimulator.add(a, b);
      expect(fromU256(result)).toBe(5n);
    });

    test('should handle equal values', () => {
      const a = toU256(5n);
      const b = toU256(5n);
      const result = mathSimulator.add(a, b);
      expect(fromU256(result)).toBe(10n);
    });

    test('should throw on overflow', () => {
      const max = toU256(MAX_UINT256);
      const one = toU256(1n);
      expect(() => mathSimulator.add(max, one)).toThrowError(
        'MathU256: addition overflow',
      );
    });

    test('should handle carry from low to high', () => {
      const a: U256 = {
        low: { low: MAX_UINT64, high: MAX_UINT64 },
        high: { low: 0n, high: 0n },
      };
      const b: U256 = {
        low: { low: 1n, high: 0n },
        high: { low: 0n, high: 0n },
      };
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
      const a = toU256(MAX_UINT256);
      const b = toU256(1n);
      const result = mathSimulator.sub(a, b);
      expect(fromU256(result)).toBe(MAX_UINT256 - 1n);
    });

    test('should throw on underflow', () => {
      const a = toU256(3n);
      const b = toU256(5n);
      expect(() => mathSimulator.sub(a, b)).toThrowError(
        'MathU256: subtraction underflow',
      );
    });

    test('should handle zero', () => {
      const five = toU256(5n);
      const zero = toU256(0n);
      const result = mathSimulator.sub(five, zero);
      expect(fromU256(result)).toBe(5n);
      expect(() => mathSimulator.sub(zero, five)).toThrowError(
        'MathU256: subtraction underflow',
      );
    });

    test('should handle borrow from high', () => {
      const a: U256 = {
        low: { low: 0n, high: 0n },
        high: { low: 1n, high: 0n },
      };
      const b: U256 = {
        low: { low: 1n, high: 0n },
        high: { low: 0n, high: 0n },
      };
      const result = mathSimulator.sub(a, b);
      expect(result.low.low).toBe(MAX_UINT64);
      expect(result.low.high).toBe(MAX_UINT64);
      expect(result.high.low).toBe(0n);
      expect(result.high.high).toBe(0n);
    });

    test('should handle zero subtraction', () => {
      const a = toU256(5n);
      const b = mathSimulator.ZERO_U256();
      const result = mathSimulator.sub(a, b);
      expect(fromU256(result)).toBe(5n);
    });

    test('should handle equal values', () => {
      const a = toU256(5n);
      const b = toU256(5n);
      const result = mathSimulator.sub(a, b);
      expect(fromU256(result)).toBe(0n);
      expect(mathSimulator.isZero(result)).toBe(true);
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
      const a = toU256(MAX_UINT128);
      const b = toU256(1n);
      const result = mathSimulator.mul(a, b);
      expect(fromU256(result)).toBe(MAX_UINT128);
    });

    test('should handle large multiplication', () => {
      const a = toU256(MAX_UINT128);
      const b = toU256(2n);
      const result = mathSimulator.mul(a, b);
      expect(fromU256(result)).toBe(MAX_UINT128 * 2n);
    });

    test('should handle zero', () => {
      const five = toU256(5n);
      const zero = toU256(0n);
      const result = mathSimulator.mul(five, zero);
      expect(fromU256(result)).toBe(0n);
      const result2 = mathSimulator.mul(zero, toU256(MAX_UINT128));
      expect(fromU256(result2)).toBe(0n);
    });

    test('should handle zero multiplication (a = 0)', () => {
      const a = mathSimulator.ZERO_U256();
      const b = toU256(5n);
      const result = mathSimulator.mul(a, b);
      expect(mathSimulator.isZero(result)).toBe(true);
    });

    test('should handle zero multiplication (b = 0)', () => {
      const a = toU256(5n);
      const b = mathSimulator.ZERO_U256();
      const result = mathSimulator.mul(a, b);
      expect(mathSimulator.isZero(result)).toBe(true);
    });

    test('should handle multiplication by one (a = 1)', () => {
      const a = toU256(1n);
      const b = toU256(5n);
      const result = mathSimulator.mul(a, b);
      expect(fromU256(result)).toBe(5n);
    });

    test('should handle multiplication by one (b = 1)', () => {
      const a = toU256(5n);
      const b = toU256(1n);
      const result = mathSimulator.mul(a, b);
      expect(fromU256(result)).toBe(5n);
    });

    test('should handle equal values', () => {
      const a = toU256(5n);
      const b = toU256(5n);
      const result = mathSimulator.mul(a, b);
      expect(fromU256(result)).toBe(25n);
    });

    test('should handle general multiplication with carry', () => {
      const a = toU256(MAX_UINT128);
      const b = toU256(2n);
      const result = mathSimulator.mul(a, b);
      expect(fromU256(result)).toBe(MAX_UINT128 * 2n);
    });

    test('should handle multiplication of MAX_U256 by 1', () => {
      const a = toU256(MAX_UINT256);
      const b = toU256(1n);
      const result = mathSimulator.mul(a, b);
      expect(fromU256(result)).toBe(MAX_UINT256);
    });

    test('should throw on overflow', () => {
      const a = toU256(MAX_UINT256);
      const b = toU256(2n);
      expect(() => mathSimulator.mul(a, b)).toThrowError(
        'MathU256: multiplication overflow',
      );
    });
  });

  describe('div', () => {
    test('should divide small numbers', () => {
      const a = toU256(10n);
      const b = toU256(3n);
      const quotient = mathSimulator.div(a, b);
      expect(fromU256(quotient)).toBe(3n);
    });

    test('should divide max U256 by 1', () => {
      const a = toU256(MAX_UINT256);
      const b = toU256(1n);
      const quotient = mathSimulator.div(a, b);
      expect(fromU256(quotient)).toBe(MAX_UINT256);
    });

    test('should throw on division by zero', () => {
      const a = toU256(5n);
      const b = mathSimulator.ZERO_U256();
      expect(() => mathSimulator.div(a, b)).toThrowError(
        'MathU256: division by zero',
      );
    });

    test('should handle dividend is zero', () => {
      const a = mathSimulator.ZERO_U256();
      const b = toU256(5n);
      const quotient = mathSimulator.div(a, b);
      expect(mathSimulator.isZero(quotient)).toBe(true);
    });

    test('should handle division with remainder', () => {
      const a = toU256(100n);
      const b = toU256(7n);
      const quotient = mathSimulator.div(a, b);
      expect(fromU256(quotient)).toBe(14n);
    });

    test('div: should fail when remainder >= divisor', () => {
      const sim = createMaliciousSimulator({
        mockDivU256: () => ({ quotient: 1n, remainder: 10n }),
      });
      const a = toU256(20n);
      const b = toU256(5n);
      expect(() => sim.div(a, b)).toThrow('MathU256: remainder error');
    });

    test('div: should fail when quotient * b + remainder != a', () => {
      const sim = createMaliciousSimulator({
        mockDivU256: () => ({ quotient: 1n, remainder: 2n }), // 1*5+2 = 7 != 20
      });
      const a = toU256(20n);
      const b = toU256(5n);
      expect(() => sim.div(a, b)).toThrow('MathU256: division invalid');
    });
  });

  describe('rem', () => {
    test('should compute remainder of small numbers', () => {
      const a = toU256(10n);
      const b = toU256(3n);
      const remainder = mathSimulator.rem(a, b);
      expect(fromU256(remainder)).toBe(1n);
    });

    test('should compute remainder of max U256 by 2', () => {
      const a = toU256(MAX_UINT256);
      const b = toU256(2n);
      const remainder = mathSimulator.rem(a, b);
      expect(fromU256(remainder)).toBe(1n);
    });

    test('should throw on division by zero', () => {
      const a = toU256(5n);
      const b = mathSimulator.ZERO_U256();
      expect(() => mathSimulator.rem(a, b)).toThrowError(
        'MathU256: division by zero',
      );
    });

    test('should handle zero remainder', () => {
      const a = toU256(6n);
      const b = toU256(3n);
      const remainder = mathSimulator.rem(a, b);
      expect(fromU256(remainder)).toBe(0n);
    });

    test('should handle dividend is zero', () => {
      const a = mathSimulator.ZERO_U256();
      const b = toU256(5n);
      const remainder = mathSimulator.rem(a, b);
      expect(mathSimulator.isZero(remainder)).toBe(true);
    });

    test('should handle divisor is one', () => {
      const a = toU256(10n);
      const b = toU256(1n);
      const remainder = mathSimulator.rem(a, b);
      expect(mathSimulator.isZero(remainder)).toBe(true);
    });

    test('should handle dividend equals divisor', () => {
      const a = toU256(5n);
      const b = toU256(5n);
      const remainder = mathSimulator.rem(a, b);
      expect(mathSimulator.isZero(remainder)).toBe(true);
    });

    test('should handle dividend less than divisor', () => {
      const a = toU256(3n);
      const b = toU256(5n);
      const remainder = mathSimulator.rem(a, b);
      expect(fromU256(remainder)).toBe(3n);
    });

    test('rem: should fail when remainder >= divisor', () => {
      const sim = createMaliciousSimulator({
        mockDivU256: () => ({ quotient: 0n, remainder: 10n }),
      });
      const a = toU256(10n);
      const b = toU256(5n);
      expect(() => sim.rem(a, b)).toThrow('MathU256: remainder error');
    });

    test('rem: should fail when quotient * b + remainder != a', () => {
      const sim = createMaliciousSimulator({
        mockDivU256: () => ({ quotient: 1n, remainder: 2n }),
      });
      const a = toU256(8n);
      const b = toU256(5n);
      expect(() => sim.rem(a, b)).toThrow('MathU256: division invalid');
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
      const a = toU256(MAX_UINT256);
      const b = toU256(2n);
      const result = mathSimulator.divRem(a, b);
      expect(fromU256(result.quotient)).toBe(MAX_UINT256 / 2n);
      expect(fromU256(result.remainder)).toBe(1n);
    });

    test('should throw on division by zero', () => {
      const a = toU256(5n);
      const b = mathSimulator.ZERO_U256();
      expect(() => mathSimulator.divRem(a, b)).toThrowError(
        'MathU256: division by zero',
      );
    });

    test('should handle zero remainder', () => {
      const a = toU256(6n);
      const b = toU256(3n);
      const result = mathSimulator.divRem(a, b);
      expect(fromU256(result.quotient)).toBe(2n);
      expect(fromU256(result.remainder)).toBe(0n);
    });

    test('should handle dividend is zero', () => {
      const a = mathSimulator.ZERO_U256();
      const b = toU256(5n);
      const result = mathSimulator.divRem(a, b);
      expect(mathSimulator.isZero(result.quotient)).toBe(true);
      expect(mathSimulator.isZero(result.remainder)).toBe(true);
    });

    test('should handle divisor is one', () => {
      const a = toU256(10n);
      const b = toU256(1n);
      const result = mathSimulator.divRem(a, b);
      expect(fromU256(result.quotient)).toBe(10n);
      expect(mathSimulator.isZero(result.remainder)).toBe(true);
    });

    test('should handle dividend equals divisor', () => {
      const a = toU256(5n);
      const b = toU256(5n);
      const result = mathSimulator.divRem(a, b);
      expect(fromU256(result.quotient)).toBe(1n);
      expect(mathSimulator.isZero(result.remainder)).toBe(true);
    });

    test('should handle dividend less than divisor', () => {
      const a = toU256(3n);
      const b = toU256(5n);
      const result = mathSimulator.divRem(a, b);
      expect(mathSimulator.isZero(result.quotient)).toBe(true);
      expect(fromU256(result.remainder)).toBe(3n);
    });

    test('divRem: should fail when remainder >= divisor', () => {
      const sim = createMaliciousSimulator({
        mockDivU256: () => ({ quotient: 3n, remainder: 9n }),
      });
      const a = toU256(24n);
      const b = toU256(8n);
      expect(() => sim.divRem(a, b)).toThrow('MathU256: remainder error');
    });

    test('divRem: should fail when quotient * b + remainder != a', () => {
      const sim = createMaliciousSimulator({
        mockDivU256: () => ({ quotient: 3n, remainder: 2n }),
      });
      const a = toU256(25n);
      const b = toU256(8n);
      expect(() => sim.divRem(a, b)).toThrow('MathU256: division invalid');
    });
  });

  describe('sqrt', () => {
    test('should handle zero', () => {
      const zero = mathSimulator.ZERO_U256();
      expect(mathSimulator.sqrt(zero)).toBe(0n);
    });

    test('should handle one', () => {
      expect(mathSimulator.sqrt(toU256(1n))).toBe(1n);
    });

    test('should handle small non-perfect squares', () => {
      expect(mathSimulator.sqrt(toU256(2n))).toBe(1n); // floor(sqrt(2)) ≈ 1.414
      expect(mathSimulator.sqrt(toU256(3n))).toBe(1n); // floor(sqrt(3)) ≈ 1.732
    });

    test('should handle small perfect squares', () => {
      expect(mathSimulator.sqrt(toU256(4n))).toBe(2n);
      expect(mathSimulator.sqrt(toU256(9n))).toBe(3n);
      expect(mathSimulator.sqrt(toU256(16n))).toBe(4n);
    });

    test('should handle maximum values', () => {
      expect(mathSimulator.sqrt(toU256(MAX_UINT8))).toBe(15n);
      expect(mathSimulator.sqrt(toU256(MAX_UINT16))).toBe(255n);
      expect(mathSimulator.sqrt(toU256(MAX_UINT32))).toBe(65535n);
      expect(mathSimulator.sqrt(toU256(MAX_UINT64))).toBe(4294967295n);
      expect(mathSimulator.sqrt(toU256(MAX_UINT128))).toBe(
        18446744073709551615n,
      );
      expect(mathSimulator.sqrt(toU256(MAX_UINT256))).toBe(
        340282366920938463463374607431768211455n,
      );
    });

    test('should handle large perfect square', () => {
      expect(mathSimulator.sqrt(toU256(1000000n))).toBe(1000n);
    });

    test('should handle large non-perfect square', () => {
      expect(mathSimulator.sqrt(toU256(100000001n))).toBe(10000n); // floor(sqrt(100000001)) ≈ 10000.00005
    });

    test('sqrt: should fail if malicious witness overestimates root', () => {
      const sim = createMaliciousSimulator({
        mockSqrtU256: () => 3n, // sqrt(8) should be 2
      });
      const a = toU256(8n);
      expect(() => sim.sqrt(a)).toThrow('MathU256: sqrt overestimate');
    });

    test('sqrt: should fail if malicious witness underestimates root', () => {
      const sim = createMaliciousSimulator({
        mockSqrtU256: () => 1n, // sqrt(5) should be 2
      });
      const a = toU256(5n);
      expect(() => sim.sqrt(a)).toThrow('MathU256: sqrt underestimate');
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
      const max = toU256(MAX_UINT256);
      const one = toU256(1n);
      const result = mathSimulator.min(max, one);
      expect(fromU256(result)).toBe(1n);
      expect(fromU256(mathSimulator.min(max, max))).toBe(MAX_UINT256);
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
      const max = toU256(MAX_UINT256);
      const one = toU256(1n);
      const result = mathSimulator.max(max, one);
      expect(fromU256(result)).toBe(MAX_UINT256);
      expect(fromU256(mathSimulator.max(max, max))).toBe(MAX_UINT256);
    });

    test('should handle zero', () => {
      const zero = toU256(0n);
      const five = toU256(5n);
      const result = mathSimulator.max(zero, five);
      expect(fromU256(result)).toBe(5n);
      expect(fromU256(mathSimulator.max(five, zero))).toBe(5n);
    });
  });

  describe('isZero', () => {
    test('should return true for zero', () => {
      const zero = mathSimulator.ZERO_U256();
      expect(mathSimulator.isZero(zero)).toBe(true);
    });

    test('should return false for non-zero', () => {
      const one = toU256(1n);
      expect(mathSimulator.isZero(one)).toBe(false);
      const max = toU256(MAX_UINT256);
      expect(mathSimulator.isZero(max)).toBe(false);
    });
  });

  describe('isLowestLimbOnly', () => {
    test('should return true for zero', () => {
      const zero = mathSimulator.ZERO_U256();
      expect(mathSimulator.isLowestLimbOnly(zero, 0n)).toBe(true);
    });

    test('should return false for non-zero', () => {
      const one = toU256(1n);
      expect(mathSimulator.isLowestLimbOnly(one, 0n)).toBe(false);
      const max = toU256(MAX_UINT256);
      expect(mathSimulator.isLowestLimbOnly(max, 0n)).toBe(false);
    });
  });

  describe('isSecondLowestLimbOnly', () => {
    test('should return true for zero', () => {
      const zero = mathSimulator.ZERO_U256();
      expect(mathSimulator.isSecondLimbOnly(zero, 0n)).toBe(true);
    });

    test('should return false for non-zero', () => {
      const one = toU256(1n);
      expect(mathSimulator.isSecondLimbOnly(one, 0n)).toBe(false);
      const max = toU256(MAX_UINT256);
      expect(mathSimulator.isSecondLimbOnly(max, 0n)).toBe(false);
    });
  });

  describe('isThirdHighestLimbOnly', () => {
    test('should return true for zero', () => {
      const zero = mathSimulator.ZERO_U256();
      expect(mathSimulator.isThirdLimbOnly(zero, 0n)).toBe(true);
    });

    test('should return false for non-zero', () => {
      const one = toU256(1n);
      expect(mathSimulator.isThirdLimbOnly(one, 0n)).toBe(false);
      const max = toU256(MAX_UINT256);
      expect(mathSimulator.isThirdLimbOnly(max, 0n)).toBe(false);
    });
  });

  describe('isHighestLimbOnly', () => {
    test('should return true for zero', () => {
      const zero = mathSimulator.ZERO_U256();
      expect(mathSimulator.isHighestLimbOnly(zero, 0n)).toBe(true);
    });

    test('should return false for non-zero', () => {
      const one = toU256(1n);
      expect(mathSimulator.isHighestLimbOnly(one, 0n)).toBe(false);
      const max = toU256(MAX_UINT256);
      expect(mathSimulator.isHighestLimbOnly(max, 0n)).toBe(false);
    });
  });

  describe('isMultiple', () => {
    test('should check if small number is multiple', () => {
      expect(mathSimulator.isMultiple(toU256(6n), toU256(3n))).toBe(true);
      expect(mathSimulator.isMultiple(toU256(7n), toU256(3n))).toBe(false);
    });

    test('should check max U256 is multiple of 1', () => {
      const max = toU256(MAX_UINT256);
      const one = toU256(1n);
      expect(mathSimulator.isMultiple(max, one)).toBe(true);
    });

    test('should throw on division by zero', () => {
      const five = toU256(5n);
      const zero = toU256(0n);
      expect(() => mathSimulator.isMultiple(five, zero)).toThrowError(
        'MathU256: division by zero',
      );
    });

    test('should handle large divisors', () => {
      const max = toU256(MAX_UINT256);
      const maxMinusOne = toU256(MAX_UINT256 - 1n);
      expect(mathSimulator.isMultiple(max, max)).toBe(true);
      expect(mathSimulator.isMultiple(maxMinusOne, max)).toBe(false);
    });
  });

  describe('toU256', () => {
    test('should convert zero bigint to zero U256', () => {
      const bigint = 0n;
      const result = mathSimulator.toU256(bigint);
      expect(fromU256(result)).toBe(0n);
    });

    test('should convert small bigint values', () => {
      const bigint = 123n;
      const result = mathSimulator.toU256(bigint);
      expect(fromU256(result)).toBe(123n);
    });

    test('should convert large bigint values', () => {
      const bigint = 2n ** 128n - 1n;
      const result = mathSimulator.toU256(bigint);
      expect(fromU256(result)).toBe(bigint);
    });

    test('should convert maximum bigint value', () => {
      const maxBigintValue = 2n ** 254n - 1n;
      const result = mathSimulator.toU256(maxBigintValue);
      expect(fromU256(result)).toBe(maxBigintValue);
    });

    test('should handle bigint values with high bits set', () => {
      const bigint = 2n ** 200n + 2n ** 100n + 1n;
      const result = mathSimulator.toU256(bigint);
      expect(fromU256(result)).toBe(bigint);
    });

    test('should handle bigint values near maximum', () => {
      const nearMaxBigint = 2n ** 254n - 1000n;
      const result = mathSimulator.toU256(nearMaxBigint);
      expect(fromU256(result)).toBe(nearMaxBigint);
    });
  });

  describe('fromU256', () => {
    test('should convert zero U256 to zero bigint', () => {
      const u256 = toU256(0n);
      const result = mathSimulator.fromU256(u256);
      expect(result).toBe(0n);
    });

    test('should convert small U256 values', () => {
      const u256 = toU256(123n);
      const result = mathSimulator.fromU256(u256);
      expect(result).toBe(123n);
    });

    test('should convert large U256 values within 254-bit range', () => {
      const u256 = toU256(2n ** 128n - 1n);
      const result = mathSimulator.fromU256(u256);
      expect(result).toBe(2n ** 128n - 1n);
    });

    test('should convert maximum 254-bit value U256', () => {
      const max254BitValue = 2n ** 254n - 1n;
      const u256 = toU256(max254BitValue);
      const result = mathSimulator.fromU256(u256);
      expect(result).toBe(max254BitValue);
    });

    test('should convert U256 values with high bits set', () => {
      const bigint = 2n ** 200n + 2n ** 100n + 1n;
      const u256 = toU256(bigint);
      const result = mathSimulator.fromU256(u256);
      expect(result).toBe(bigint);
    });

    test('should throw error for U256 values exceeding 254 bits', () => {
      const exceedingValue = 2n ** 254n;
      const u256 = toU256(exceedingValue);
      expect(() => mathSimulator.fromU256(u256)).toThrow(
        'MathU256: fromU256() - value exceeds 254 bits',
      );
    });

    test('should throw error for maximum U256 value', () => {
      const maxU256 = toU256(MAX_UINT256);
      expect(() => mathSimulator.fromU256(maxU256)).toThrow(
        'MathU256: fromU256() - value exceeds 254 bits',
      );
    });

    test('should handle U256 values just at 254-bit limit', () => {
      const at254BitLimit = 2n ** 254n - 1n;
      const u256 = toU256(at254BitLimit);
      const result = mathSimulator.fromU256(u256);
      expect(result).toBe(at254BitLimit);
    });

    test('should throw when U256 values are just above 254-bit limit', () => {
      const justAbove254Bit = 2n ** 254n;
      const u256 = toU256(justAbove254Bit);
      expect(() => mathSimulator.fromU256(u256)).toThrow(
        'MathU256: fromU256() - value exceeds 254 bits',
      );
    });
  });

  describe('U256 conversion round-trip', () => {
    test('should round-trip small values', () => {
      const originalBigint = 123n;
      const u256 = mathSimulator.toU256(originalBigint);
      const resultBigint = mathSimulator.fromU256(u256);
      expect(resultBigint).toBe(originalBigint);
    });

    test('should round-trip large values', () => {
      const originalBigint = 2n ** 200n + 2n ** 100n + 1n;
      const u256 = mathSimulator.toU256(originalBigint);
      const resultBigint = mathSimulator.fromU256(u256);
      expect(resultBigint).toBe(originalBigint);
    });

    test('should round-trip maximum 254-bit value', () => {
      const max254BitValue = 2n ** 254n - 1n;
      const u256 = mathSimulator.toU256(max254BitValue);
      const resultBigint = mathSimulator.fromU256(u256);
      expect(resultBigint).toBe(max254BitValue);
    });

    test('should round-trip zero', () => {
      const originalBigint = 0n;
      const u256 = mathSimulator.toU256(originalBigint);
      const resultBigint = mathSimulator.fromU256(u256);
      expect(resultBigint).toBe(originalBigint);
    });
  });
});
