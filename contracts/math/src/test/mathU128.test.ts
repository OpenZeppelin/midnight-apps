import { beforeEach, describe, expect, test } from 'vitest';
import type { U128, U256 } from '../artifacts/Index/contract/index.d.cts';
import { MathU128Simulator } from './MathU128Simulator';

let mathSimulator: MathU128Simulator;

const MAX_U8 = 2n ** 8n - 1n;
const MAX_U16 = 2n ** 16n - 1n;
const MAX_U32 = 2n ** 32n - 1n;
const MAX_U64 = 2n ** 64n - 1n;
const MAX_U128 = 2n ** 128n - 1n;

const setup = () => {
  mathSimulator = new MathU128Simulator();
};

describe('MathU128', () => {
  beforeEach(setup);

  describe('toU128', () => {
    test('should convert small Uint<128> to U128', () => {
      const value = 123n;
      const result = mathSimulator.toU128(value);
      expect(result.low).toBe(value);
      expect(result.high).toBe(0n);
    });

    test('should convert max Uint<128> to U128', () => {
      const result = mathSimulator.toU128(MAX_U128);
      expect(result.low).toBe(MAX_U64);
      expect(result.high).toBe(MAX_U64);
    });

    test('should handle zero', () => {
      const result = mathSimulator.toU128(0n);
      expect(result.low).toBe(0n);
      expect(result.high).toBe(0n);
    });
  });

  describe('fromU128', () => {
    test('should convert U128 to small Uint<128>', () => {
      const u128: U128 = { low: 123n, high: 0n };
      expect(mathSimulator.fromU128(u128)).toBe(123n);
    });

    test('should convert U128 to max Uint<128>', () => {
      const u128: U128 = { low: MAX_U64, high: MAX_U64 };
      expect(mathSimulator.fromU128(u128)).toBe(MAX_U128);
    });

    test('should handle zero U128', () => {
      const u128: U128 = { low: 0n, high: 0n };
      expect(mathSimulator.fromU128(u128)).toBe(0n);
    });
  });

  describe('le', () => {
    test('should compare small numbers', () => {
      expect(mathSimulator.le(5n, 10n)).toBe(true);
      expect(mathSimulator.le(10n, 5n)).toBe(false);
      expect(mathSimulator.le(5n, 5n)).toBe(true);
    });

    test('should compare max Uint<128>', () => {
      expect(mathSimulator.le(MAX_U128, MAX_U128)).toBe(true);
      expect(mathSimulator.le(MAX_U128 - 1n, MAX_U128)).toBe(true);
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
      const a: U128 = { low: MAX_U64, high: MAX_U64 - 1n };
      const b: U128 = { low: MAX_U64, high: MAX_U64 };
      expect(mathSimulator.leU128(a, b)).toBe(true);
    });
  });

  describe('gt', () => {
    test('should compare small numbers', () => {
      expect(mathSimulator.gt(10n, 5n)).toBe(true);
      expect(mathSimulator.gt(5n, 10n)).toBe(false);
      expect(mathSimulator.gt(5n, 5n)).toBe(false);
    });

    test('should compare max Uint<128>', () => {
      expect(mathSimulator.gt(MAX_U128, MAX_U128 - 1n)).toBe(true);
      expect(mathSimulator.gt(MAX_U128, MAX_U128)).toBe(false);
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
      const a: U128 = { low: MAX_U64, high: MAX_U64 };
      const b: U128 = { low: MAX_U64, high: MAX_U64 - 1n };
      expect(mathSimulator.gtU128(a, b)).toBe(true);
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

    test('should add max Uint<128> minus 1 plus 1', () => {
      const result: U256 = mathSimulator.add(MAX_U128 - 1n, 1n);
      expect(result.low.low).toBe(MAX_U64);
      expect(result.low.high).toBe(MAX_U64);
      expect(result.high.low).toBe(0n);
      expect(result.high.high).toBe(0n);
    });

    test('should handle zero', () => {
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

    test('should add with carry', () => {
      const a: U128 = { low: MAX_U64, high: 0n };
      const b: U128 = { low: 1n, high: 0n };
      const result: U256 = mathSimulator.addU128(a, b);
      expect(result.low.low).toBe(0n);
      expect(result.low.high).toBe(1n);
      expect(result.high.low).toBe(0n);
      expect(result.high.high).toBe(0n);
    });

    test('should handle large addition', () => {
      const a: U128 = { low: MAX_U64, high: MAX_U64 };
      const b: U128 = { low: 1n, high: 0n };
      const result: U256 = mathSimulator.addU128(a, b);
      expect(result.low.low).toBe(0n);
      expect(result.low.high).toBe(0n);
      expect(result.high.low).toBe(1n);
      expect(result.high.high).toBe(0n);
    });
  });

  describe('sub', () => {
    test('should subtract two small numbers', () => {
      expect(mathSimulator.sub(4n, 4n)).toBe(0n);
    });

    test('should subtract two small numbers', () => {
      expect(mathSimulator.sub(10n, 4n)).toBe(6n);
    });

    test('should subtract max Uint<128> minus 1', () => {
      expect(mathSimulator.sub(MAX_U128, 1n)).toBe(MAX_U128 - 1n);
    });

    test('should fail on underflow', () => {
      expect(() => mathSimulator.sub(3n, 5n)).toThrowError(
        'MathU128: subtraction underflow',
      );
    });

    test('should handle zero', () => {
      expect(mathSimulator.sub(5n, 0n)).toBe(5n);
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

    test('should subtract with borrow', () => {
      const a: U128 = { low: 0n, high: 1n };
      const b: U128 = { low: 1n, high: 0n };
      const result = mathSimulator.subU128(a, b);
      expect(result.low).toBe(MAX_U64);
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

    test('should multiply max Uint<128> by 1', () => {
      const result: U256 = mathSimulator.mul(MAX_U128, 1n);
      expect(result.low.low).toBe(MAX_U64);
      expect(result.low.high).toBe(MAX_U64);
      expect(result.high.low).toBe(0n);
      expect(result.high.high).toBe(0n);
    });

    test('should handle large multiplication', () => {
      const result: U256 = mathSimulator.mul(MAX_U128, 2n);
      expect(result.low.low).toBe(MAX_U64 - 1n);
      expect(result.low.high).toBe(MAX_U64);
      expect(result.high.low).toBe(1n);
      expect(result.high.high).toBe(0n);
    });

    test('should handle zero', () => {
      const result: U256 = mathSimulator.mul(5n, 0n);
      expect(result.low.low).toBe(0n);
      expect(result.low.high).toBe(0n);
      expect(result.high.low).toBe(0n);
      expect(result.high.high).toBe(0n);
      const result2: U256 = mathSimulator.mul(0n, MAX_U128);
      expect(result2.low.low).toBe(0n);
      expect(result2.low.high).toBe(0n);
      expect(result2.high.low).toBe(0n);
      expect(result2.high.high).toBe(0n);
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

    test('should multiply with high part contribution', () => {
      const a: U128 = { low: 0n, high: 1n };
      const b: U128 = { low: 1n, high: 0n };
      const result: U256 = mathSimulator.mulU128(a, b);
      expect(result.low.low).toBe(0n);
      expect(result.low.high).toBe(1n);
      expect(result.high.low).toBe(0n);
      expect(result.high.high).toBe(0n);
    });

    test('should handle large multiplication', () => {
      const a: U128 = { low: MAX_U64, high: MAX_U64 };
      const b: U128 = { low: 2n, high: 0n };
      const result: U256 = mathSimulator.mulU128(a, b);
      expect(result.low.low).toBe(MAX_U64 - 1n);
      expect(result.low.high).toBe(MAX_U64);
      expect(result.high.low).toBe(1n);
      expect(result.high.high).toBe(0n);
    });
  });

  describe('div', () => {
    test('should divide small numbers', () => {
      expect(mathSimulator.div(10n, 3n)).toBe(3n);
    });

    test('should divide max Uint<128> by 1', () => {
      expect(mathSimulator.div(MAX_U128, 1n)).toBe(MAX_U128);
    });

    test('should fail on division by zero', () => {
      expect(() => mathSimulator.div(5n, 0n)).toThrowError(
        'MathU128: division by zero',
      );
    });

    test('should handle division with remainder', () => {
      expect(mathSimulator.div(100n, 7n)).toBe(14n);
    });
  });

  describe('divU128', () => {
    test('should divide small U128 numbers', () => {
      const a: U128 = { low: 10n, high: 0n };
      const b: U128 = { low: 3n, high: 0n };
      const result = mathSimulator.divU128(a, b);
      expect(result.low).toStrictEqual(3n);
      expect(result.high).toStrictEqual(0n);
    });

    test('should divide large U128 numbers', () => {
      const a: U128 = { low: MAX_U64, high: MAX_U64 };
      const b: U128 = { low: 1n, high: 0n };
      const result = mathSimulator.divU128(a, b);
      expect(result.low).toBe(MAX_U64);
      expect(result.high).toBe(MAX_U64);
    });

    test('should fail on division by zero', () => {
      const a: U128 = { low: 5n, high: 0n };
      const b: U128 = { low: 0n, high: 0n };
      expect(() => mathSimulator.divU128(a, b)).toThrowError(
        'MathU128: division by zero',
      );
    });
  });

  describe('rem', () => {
    test('should compute remainder of small numbers', () => {
      expect(mathSimulator.rem(10n, 3n)).toBe(1n);
    });

    test('should compute remainder of max Uint<128> by 2', () => {
      expect(mathSimulator.rem(MAX_U128, 2n)).toBe(1n);
    });

    test('should fail on division by zero', () => {
      expect(() => mathSimulator.rem(5n, 0n)).toThrowError(
        'MathU128: division by zero',
      );
    });

    test('should handle zero remainder', () => {
      expect(mathSimulator.rem(6n, 3n)).toBe(0n);
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

    test('should compute remainder of large U128 numbers', () => {
      const a: U128 = { low: MAX_U64, high: MAX_U64 };
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
  });

  describe('sqrt', () => {
    test('should compute square root of small perfect squares', () => {
      expect(mathSimulator.sqrt(4n)).toBe(2n);
      expect(mathSimulator.sqrt(9n)).toBe(3n);
      expect(mathSimulator.sqrt(16n)).toBe(4n);
    });

    test('should compute square root of small imperfect squares', () => {
      expect(mathSimulator.sqrt(2n)).toBe(1n); // floor(sqrt(2)) ≈ 1.414
      expect(mathSimulator.sqrt(3n)).toBe(1n); // floor(sqrt(3)) ≈ 1.732
      expect(mathSimulator.sqrt(5n)).toBe(2n); // floor(sqrt(5)) ≈ 2.236
    });

    test('should handle special cases', () => {
      expect(mathSimulator.sqrt(0n)).toBe(0n);
      expect(mathSimulator.sqrt(1n)).toBe(1n);
      expect(mathSimulator.sqrt(MAX_U8)).toBe(15n);
      expect(mathSimulator.sqrt(MAX_U16)).toBe(255n);
      expect(mathSimulator.sqrt(MAX_U32)).toBe(65535n);
      expect(mathSimulator.sqrt(MAX_U64)).toBe(4294967295n);
      expect(mathSimulator.sqrt(MAX_U128)).toBe(MAX_U64);
    });

    test('should compute square root of large numbers', () => {
      expect(mathSimulator.sqrt(1000000n)).toBe(1000n);
      expect(mathSimulator.sqrt(100000001n)).toBe(10000n); // floor(sqrt(100000001)) ≈ 10000.00005
    });
  });

  describe('sqrtU128', () => {
    test('should compute square root of small perfect U128 squares', () => {
      const radicand: U128 = { low: 16n, high: 0n };
      expect(mathSimulator.sqrtU128(radicand)).toBe(4n);
    });

    test('should compute square root of large U128 numbers', () => {
      const radicand: U128 = { low: MAX_U64, high: MAX_U64 };
      expect(mathSimulator.sqrtU128(radicand)).toBe(MAX_U64);
    });

    test('should handle special U128 cases', () => {
      const zero: U128 = { low: 0n, high: 0n };
      const one: U128 = { low: 1n, high: 0n };
      expect(mathSimulator.sqrtU128(zero)).toBe(0n);
      expect(mathSimulator.sqrtU128(one)).toBe(1n);
    });
  });

  describe('min', () => {
    test('should return minimum of small numbers', () => {
      expect(mathSimulator.min(5n, 3n)).toBe(3n);
      expect(mathSimulator.min(3n, 5n)).toBe(3n);
      expect(mathSimulator.min(5n, 5n)).toBe(5n);
    });

    test('should handle max Uint<128>', () => {
      expect(mathSimulator.min(MAX_U128, 1n)).toBe(1n);
      expect(mathSimulator.min(MAX_U128, MAX_U128)).toBe(MAX_U128);
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
      const a: U128 = { low: MAX_U64, high: MAX_U64 };
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
      expect(mathSimulator.max(MAX_U128, 1n)).toBe(MAX_U128);
      expect(mathSimulator.max(MAX_U128, MAX_U128)).toBe(MAX_U128);
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
      const a: U128 = { low: MAX_U64, high: MAX_U64 };
      const b: U128 = { low: 1n, high: 0n };
      const result = mathSimulator.maxU128(a, b);
      expect(result.low).toBe(MAX_U64);
      expect(result.high).toBe(MAX_U64);
    });
  });

  describe('isMultiple', () => {
    test('should check if small number is multiple', () => {
      expect(mathSimulator.isMultiple(6n, 3n)).toBe(true);
      expect(mathSimulator.isMultiple(7n, 3n)).toBe(false);
    });

    test('should check max Uint<128> is multiple of 1', () => {
      expect(mathSimulator.isMultiple(MAX_U128, 1n)).toBe(true);
    });

    test('should fail on division by zero', () => {
      expect(() => mathSimulator.isMultiple(5n, 0n)).toThrowError(
        'MathU128: division by zero',
      );
    });

    test('should handle large divisors', () => {
      expect(mathSimulator.isMultiple(MAX_U128, MAX_U128)).toBe(true);
      expect(mathSimulator.isMultiple(MAX_U128 - 1n, MAX_U128)).toBe(false);
    });
  });

  describe('isMultipleU128', () => {
    test('should check if small U128 number is multiple', () => {
      const a: U128 = { low: 6n, high: 0n };
      const b: U128 = { low: 3n, high: 0n };
      expect(mathSimulator.isMultipleU128(a, b)).toBe(true);
    });

    test('should check large U128 numbers', () => {
      const a: U128 = { low: MAX_U64, high: MAX_U64 };
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
