import { beforeEach, describe, expect, test } from 'vitest';
import { MathU256Simulator } from './MathU256Simulator';

let mathU256Simulator: MathU256Simulator;

const MAX_U128 = 2n ** 128n - 1n;
const MAX_U256 = 2n ** 256n - 1n;
//const TWO_POW_128 = 2n ** 128n;

const setup = () => {
  mathU256Simulator = new MathU256Simulator();
};

describe('MathU256', () => {
  beforeEach(setup);

  describe('Add', () => {
    test('should add two numbers', () => {
      expect(mathU256Simulator.add(5n, 3n)).toBe(8n);
    });

    test('should fail on overflow', () => {
      expect(() => mathU256Simulator.add(MAX_U256, 1n)).toThrowError(
        'MathU256: addition overflow',
      );
    });

    test('should handle max Uint<256> minus 1 plus 1', () => {
      expect(mathU256Simulator.add(MAX_U256 - 1n, 1n)).toBe(MAX_U256);
    });

    test('should handle zero inputs', () => {
      expect(mathU256Simulator.add(0n, 0n)).toBe(0n);
      expect(mathU256Simulator.add(0n, 5n)).toBe(5n);
      expect(mathU256Simulator.add(5n, 0n)).toBe(5n);
    });

    test('should handle large numbers', () => {
      const largeNum = 2n ** 200n;
      expect(mathU256Simulator.add(largeNum, largeNum)).toBe(largeNum * 2n);
    });
  });

  describe('Sub', () => {
    test('should subtract two numbers', () => {
      expect(mathU256Simulator.sub(10n, 4n)).toBe(6n);
    });

    test('should subtract zero', () => {
      expect(mathU256Simulator.sub(5n, 0n)).toBe(5n);
      expect(mathU256Simulator.sub(0n, 0n)).toBe(0n);
    });

    test('should fail on underflow', () => {
      expect(() => mathU256Simulator.sub(0n, 5n)).toThrowError(
        'MathU256: subtraction underflow',
      );
    });

    test('should subtract max Uint<256> minus 1', () => {
      expect(mathU256Simulator.sub(MAX_U256, 1n)).toBe(MAX_U256 - 1n);
    });

    test('should subtract max Uint<256> minus itself', () => {
      expect(mathU256Simulator.sub(MAX_U256, MAX_U256)).toBe(0n);
    });

    test('should fail on underflow with large numbers', () => {
      expect(() =>
        mathU256Simulator.sub(MAX_U256 - 10n, MAX_U256),
      ).toThrowError('MathU256: subtraction underflow');
    });

    // TODO: fix there is a bug in sub because of this test
    test('should handle large numbers', () => {
      const largeNum = 2n ** 200n;
      expect(mathU256Simulator.sub(largeNum * 2n, largeNum)).toBe(largeNum);
    });
  });

  describe('Mul', () => {
    test('should multiply two numbers', () => {
      expect(mathU256Simulator.mul(4n, 3n)).toBe(12n);
    });

    test('should handle max Uint<128> times max Uint<128>', () => {
      expect(mathU256Simulator.mul(MAX_U128, MAX_U128)).toBe(
        2n ** 256n - 2n * 2n ** 128n + 1n,
      );
    });

    test('should fail on overflow', () => {
      expect(() => mathU256Simulator.mul(MAX_U256, 2n)).toThrowError(
        'MathU256: multiplication overflow',
      );
    });

    test('should handle zero inputs', () => {
      expect(mathU256Simulator.mul(0n, 5n)).toBe(0n);
      expect(mathU256Simulator.mul(5n, 0n)).toBe(0n);
      expect(mathU256Simulator.mul(0n, 0n)).toBe(0n);
    });

    test('should handle large numbers', () => {
      const largeNum = 2n ** 100n;
      expect(mathU256Simulator.mul(largeNum, largeNum)).toBe(
        largeNum * largeNum,
      );
    });
  });

  describe('Div', () => {
    test('should divide two numbers', () => {
      expect(mathU256Simulator.div(10n, 3n)).toBe(3n);
    });

    test('should fail on division by zero', () => {
      expect(() => mathU256Simulator.div(5n, 0n)).toThrowError(
        'MathU256: division by zero',
      );
    });

    test('should divide max Uint<256> by 1', () => {
      expect(mathU256Simulator.div(MAX_U256, 1n)).toBe(MAX_U256);
    });

    test('should divide max Uint<256> by itself', () => {
      expect(mathU256Simulator.div(MAX_U256, MAX_U256)).toBe(1n);
    });

    test('should handle division with remainder', () => {
      expect(mathU256Simulator.div(100n, 7n)).toBe(14n); // 100 / 7 = 14 remainder 2
    });

    test('should handle zero dividend', () => {
      expect(mathU256Simulator.div(0n, 5n)).toBe(0n);
    });
  });

  describe('Remainder', () => {
    test('should compute remainder', () => {
      expect(mathU256Simulator.rem(10n, 3n)).toBe(1n);
    });

    test('should fail on division by zero', () => {
      expect(() => mathU256Simulator.rem(5n, 0n)).toThrowError(
        'MathU256: division by zero',
      );
    });

    test('should compute remainder of max Uint<256> by 2', () => {
      expect(mathU256Simulator.rem(MAX_U256, 2n)).toBe(1n);
    });

    test('should handle no remainder', () => {
      expect(mathU256Simulator.rem(100n, 5n)).toBe(0n);
    });

    test('should handle zero dividend', () => {
      expect(mathU256Simulator.rem(0n, 5n)).toBe(0n);
    });

    test('should handle large dividend', () => {
      expect(mathU256Simulator.rem(2n ** 200n + 3n, 7n)).toBe(0n);
    });
  });

  describe('Sqrt', () => {
    test('should compute square root of small perfect squares', () => {
      expect(mathU256Simulator.sqrt(4n)).toBe(2n);
      expect(mathU256Simulator.sqrt(9n)).toBe(3n);
      expect(mathU256Simulator.sqrt(16n)).toBe(4n);
      expect(mathU256Simulator.sqrt(25n)).toBe(5n);
      expect(mathU256Simulator.sqrt(100n)).toBe(10n);
    });

    test('should compute square root of small imperfect squares', () => {
      expect(mathU256Simulator.sqrt(2n)).toBe(1n); // floor(sqrt(2)) ≈ 1.414
      expect(mathU256Simulator.sqrt(3n)).toBe(1n); // floor(sqrt(3)) ≈ 1.732
      expect(mathU256Simulator.sqrt(5n)).toBe(2n); // floor(sqrt(5)) ≈ 2.236
      expect(mathU256Simulator.sqrt(8n)).toBe(2n); // floor(sqrt(8)) ≈ 2.828
      expect(mathU256Simulator.sqrt(99n)).toBe(9n); // floor(sqrt(99)) ≈ 9.95
    });

    test('should compute square root of large perfect squares', () => {
      expect(mathU256Simulator.sqrt(10000n)).toBe(100n);
      expect(mathU256Simulator.sqrt(1000000n)).toBe(1000n);
      expect(mathU256Simulator.sqrt(100000000n)).toBe(10000n);
    });

    test('should compute square root of large imperfect squares', () => {
      expect(mathU256Simulator.sqrt(101n)).toBe(10n); // floor(sqrt(101)) ≈ 10.05
      expect(mathU256Simulator.sqrt(999999n)).toBe(999n); // floor(sqrt(999999)) ≈ 999.9995
      expect(mathU256Simulator.sqrt(100000001n)).toBe(10000n); // floor(sqrt(100000001)) ≈ 10000.00005
    });

    test('should handle powers of 2', () => {
      expect(mathU256Simulator.sqrt(2n ** 64n)).toBe(4294967296n); // sqrt(2^64) = 2^32
      expect(mathU256Simulator.sqrt(2n ** 128n)).toBe(18446744073709551616n); // sqrt(2^128) = 2^64
    });

    test('should handle zero', () => {
      expect(mathU256Simulator.sqrt(0n)).toBe(0n);
    });

    test('should handle 1', () => {
      expect(mathU256Simulator.sqrt(1n)).toBe(1n);
    });

    test('should handle max Uint<128>', () => {
      expect(mathU256Simulator.sqrt(MAX_U128)).toBe(18446744073709551615n); // floor(sqrt(2^128 - 1)) = 2^64 - 1
    });

    test('should handle max Uint<256>', () => {
      expect(mathU256Simulator.sqrt(MAX_U256)).toBe(MAX_U128); // floor(sqrt(2^256 - 1)) = 2^128 - 1
    });

    test('should handle special cases', () => {
      expect(mathU256Simulator.sqrt(255n)).toBe(15n); // MAX_U8
      expect(mathU256Simulator.sqrt(65535n)).toBe(255n); // MAX_U16
      expect(mathU256Simulator.sqrt(4294967295n)).toBe(65535n); // MAX_U32
      expect(mathU256Simulator.sqrt(18446744073709551615n)).toBe(4294967295n); // MAX_U64
    });
  });

  describe('LessThan', () => {
    test('should compare two U256 values', () => {
      expect(
        mathU256Simulator.lessThanU256(
          { low: 5n, high: 0n },
          { low: 6n, high: 0n },
        ),
      ).toBe(true);
      expect(
        mathU256Simulator.lessThanU256(
          { low: 5n, high: 1n },
          { low: 6n, high: 1n },
        ),
      ).toBe(true);
      expect(
        mathU256Simulator.lessThanU256(
          { low: 5n, high: 0n },
          { low: 5n, high: 1n },
        ),
      ).toBe(true);
      expect(
        mathU256Simulator.lessThanU256(
          { low: 5n, high: 1n },
          { low: 5n, high: 1n },
        ),
      ).toBe(false);
    });

    test('should handle edge cases', () => {
      expect(
        mathU256Simulator.lessThanU256(
          { low: MAX_U128, high: MAX_U128 },
          { low: MAX_U128, high: MAX_U128 },
        ),
      ).toBe(false); // Equal values
      expect(
        mathU256Simulator.lessThanU256(
          { low: 0n, high: 0n },
          { low: 1n, high: 0n },
        ),
      ).toBe(true); // Zero vs small number
      expect(
        mathU256Simulator.lessThanU256(
          { low: MAX_U128, high: MAX_U128 },
          { low: 0n, high: 0n },
        ),
      ).toBe(false); // Max vs zero
    });
  });

  describe('GreaterThan', () => {
    test('should compare two U256 values', () => {
      expect(
        mathU256Simulator.greaterThanU256(
          { low: 6n, high: 0n },
          { low: 5n, high: 0n },
        ),
      ).toBe(true);
      expect(
        mathU256Simulator.greaterThanU256(
          { low: 6n, high: 1n },
          { low: 5n, high: 1n },
        ),
      ).toBe(true);
      expect(
        mathU256Simulator.greaterThanU256(
          { low: 5n, high: 1n },
          { low: 5n, high: 0n },
        ),
      ).toBe(true);
      expect(
        mathU256Simulator.greaterThanU256(
          { low: 5n, high: 1n },
          { low: 5n, high: 1n },
        ),
      ).toBe(false);
    });

    test('should handle edge cases', () => {
      expect(
        mathU256Simulator.greaterThanU256(
          { low: MAX_U128, high: MAX_U128 },
          { low: MAX_U128, high: MAX_U128 },
        ),
      ).toBe(false); // Equal values
      expect(
        mathU256Simulator.greaterThanU256(
          { low: 1n, high: 0n },
          { low: 0n, high: 0n },
        ),
      ).toBe(true); // Small number vs zero
      expect(
        mathU256Simulator.greaterThanU256(
          { low: 0n, high: 0n },
          { low: MAX_U128, high: MAX_U128 },
        ),
      ).toBe(false); // Zero vs max
    });
  });

  describe('ToU256', () => {
    test('should convert Uint<256> to U256', () => {
      const value = 2n ** 128n + 5n;
      const result = mathU256Simulator.toU256(value);
      expect(result).toEqual({ low: 5n, high: 1n });
    });

    test('should handle max Uint<256>', () => {
      const result = mathU256Simulator.toU256(MAX_U256);
      expect(result).toEqual({ low: MAX_U128, high: MAX_U128 });
    });

    test('should handle zero', () => {
      const result = mathU256Simulator.toU256(0n);
      expect(result).toEqual({ low: 0n, high: 0n });
    });

    test('should handle max Uint<128>', () => {
      const result = mathU256Simulator.toU256(MAX_U128);
      expect(result).toEqual({ low: MAX_U128, high: 0n });
    });
  });

  describe('FromU256', () => {
    test('should convert U256 to Uint<256>', () => {
      const u256 = { low: 5n, high: 1n };
      const result = mathU256Simulator.fromU256(u256);
      expect(result).toBe(2n ** 128n + 5n);
    });

    test('should handle max Uint<256>', () => {
      const u256 = { low: MAX_U128, high: MAX_U128 };
      const result = mathU256Simulator.fromU256(u256);
      expect(result).toBe(MAX_U256);
    });

    test('should handle zero', () => {
      const u256 = { low: 0n, high: 0n };
      const result = mathU256Simulator.fromU256(u256);
      expect(result).toBe(0n);
    });

    test('should handle max Uint<128>', () => {
      const u256 = { low: MAX_U128, high: 0n };
      const result = mathU256Simulator.fromU256(u256);
      expect(result).toBe(MAX_U128);
    });
  });

  describe('Min', () => {
    test('should return the smaller of two numbers', () => {
      expect(mathU256Simulator.min(5n, 3n)).toBe(3n);
      expect(mathU256Simulator.min(3n, 5n)).toBe(3n);
    });

    test('should handle equal numbers', () => {
      expect(mathU256Simulator.min(10n, 10n)).toBe(10n);
    });

    test('should handle zero', () => {
      expect(mathU256Simulator.min(0n, 5n)).toBe(0n);
      expect(mathU256Simulator.min(5n, 0n)).toBe(0n);
      expect(mathU256Simulator.min(0n, 0n)).toBe(0n);
    });

    test('should handle max Uint<256>', () => {
      expect(mathU256Simulator.min(MAX_U256, MAX_U256 - 1n)).toBe(
        MAX_U256 - 1n,
      );
      expect(mathU256Simulator.min(MAX_U256 - 1n, MAX_U256)).toBe(
        MAX_U256 - 1n,
      );
      expect(mathU256Simulator.min(MAX_U256, MAX_U256)).toBe(MAX_U256);
    });

    test('should handle large numbers', () => {
      const largeNum = 2n ** 200n;
      expect(mathU256Simulator.min(largeNum, largeNum + 1n)).toBe(largeNum);
    });
  });

  describe('Max', () => {
    test('should return the larger of two numbers', () => {
      expect(mathU256Simulator.max(5n, 3n)).toBe(5n);
      expect(mathU256Simulator.max(3n, 5n)).toBe(5n);
    });

    test('should handle equal numbers', () => {
      expect(mathU256Simulator.max(10n, 10n)).toBe(10n);
    });

    test('should handle zero', () => {
      expect(mathU256Simulator.max(0n, 5n)).toBe(5n);
      expect(mathU256Simulator.max(5n, 0n)).toBe(5n);
      expect(mathU256Simulator.max(0n, 0n)).toBe(0n);
    });

    test('should handle max Uint<256>', () => {
      expect(mathU256Simulator.max(MAX_U256, MAX_U256 - 1n)).toBe(MAX_U256);
      expect(mathU256Simulator.max(MAX_U256 - 1n, MAX_U256)).toBe(MAX_U256);
      expect(mathU256Simulator.max(MAX_U256, MAX_U256)).toBe(MAX_U256);
    });

    test('should handle large numbers', () => {
      const largeNum = 2n ** 200n;
      expect(mathU256Simulator.max(largeNum, largeNum + 1n)).toBe(
        largeNum + 1n,
      );
    });
  });

  describe('IsMultiple', () => {
    test('should check if a number is a multiple of another', () => {
      expect(mathU256Simulator.isMultiple(10n, 2n)).toBe(true);
      expect(mathU256Simulator.isMultiple(10n, 3n)).toBe(false);
      expect(mathU256Simulator.isMultiple(100n, 5n)).toBe(true);
    });

    test('should fail on division by zero', () => {
      expect(() => mathU256Simulator.isMultiple(5n, 0n)).toThrowError(
        'MathU256: division by zero',
      );
    });

    test('should handle zero dividend', () => {
      expect(mathU256Simulator.isMultiple(0n, 5n)).toBe(true); // 0 is a multiple of any non-zero number
    });

    test('should handle large numbers', () => {
      const largeNum = 2n ** 200n;
      expect(mathU256Simulator.isMultiple(largeNum * 7n, 7n)).toBe(true);
      expect(mathU256Simulator.isMultiple(largeNum * 7n + 1n, 7n)).toBe(false);
    });

    test('should handle max Uint<256>', () => {
      expect(mathU256Simulator.isMultiple(MAX_U256, 1n)).toBe(true);
      expect(mathU256Simulator.isMultiple(MAX_U256, MAX_U256)).toBe(true);
      expect(mathU256Simulator.isMultiple(MAX_U256, 2n)).toBe(false); // MAX_U256 is odd
    });
  });

  describe('AddU256', () => {
    test('should add two U256 numbers', () => {
      expect(
        mathU256Simulator.addU256({ low: 5n, high: 0n }, { low: 3n, high: 0n }),
      ).toEqual({ low: 8n, high: 0n });
    });

    test('should fail on overflow', () => {
      expect(() =>
        mathU256Simulator.addU256(
          { low: MAX_U128, high: MAX_U128 },
          { low: 1n, high: 0n },
        ),
      ).toThrowError('MathU256: addition overflow');
    });

    test('should handle max Uint<256> minus 1 plus 1', () => {
      expect(
        mathU256Simulator.addU256(
          { low: MAX_U128 - 1n, high: MAX_U128 },
          { low: 1n, high: 0n },
        ),
      ).toEqual({ low: MAX_U128, high: MAX_U128 });
    });

    test('should handle zero inputs', () => {
      expect(
        mathU256Simulator.addU256({ low: 0n, high: 0n }, { low: 0n, high: 0n }),
      ).toEqual({ low: 0n, high: 0n });
      expect(
        mathU256Simulator.addU256({ low: 5n, high: 0n }, { low: 0n, high: 0n }),
      ).toEqual({ low: 5n, high: 0n });
    });
  });

  describe('SubU256', () => {
    test('should subtract two U256 numbers', () => {
      expect(
        mathU256Simulator.subU256(
          { low: 10n, high: 0n },
          { low: 4n, high: 0n },
        ),
      ).toEqual({ low: 6n, high: 0n });
    });

    test('should subtract zero', () => {
      expect(
        mathU256Simulator.subU256({ low: 5n, high: 0n }, { low: 0n, high: 0n }),
      ).toEqual({ low: 5n, high: 0n });
      expect(
        mathU256Simulator.subU256({ low: 0n, high: 0n }, { low: 0n, high: 0n }),
      ).toEqual({ low: 0n, high: 0n });
    });

    test('should fail on underflow', () => {
      expect(() =>
        mathU256Simulator.subU256({ low: 0n, high: 0n }, { low: 5n, high: 0n }),
      ).toThrowError('MathU256: subtraction underflow');
    });

    test('should subtract max Uint<256> minus 1', () => {
      expect(
        mathU256Simulator.subU256(
          { low: MAX_U128, high: MAX_U128 },
          { low: 1n, high: 0n },
        ),
      ).toEqual({ low: MAX_U128 - 1n, high: MAX_U128 });
    });

    test('should handle large numbers', () => {
      expect(
        mathU256Simulator.subU256(
          { low: 0n, high: 2n ** 64n },
          { low: 1n, high: 0n },
        ),
      ).toEqual({ low: MAX_U128, high: 2n ** 64n - 1n });
    });
  });

  describe('MulU256', () => {
    test('should multiply two U256 numbers', () => {
      expect(
        mathU256Simulator.mulU256({ low: 4n, high: 0n }, { low: 3n, high: 0n }),
      ).toEqual({ low: 12n, high: 0n });
    });

    test('should handle max Uint<128> times max Uint<128>', () => {
      expect(
        mathU256Simulator.mulU256(
          { low: MAX_U128, high: 0n },
          { low: MAX_U128, high: 0n },
        ),
      ).toEqual({ low: 1n, high: MAX_U128 - 1n });
    });

    test('should fail on overflow', () => {
      expect(() =>
        mathU256Simulator.mulU256(
          { low: MAX_U128, high: MAX_U128 },
          { low: 2n, high: 0n },
        ),
      ).toThrowError('MathU256: multiplication overflow');
    });

    test('should handle zero inputs', () => {
      expect(
        mathU256Simulator.mulU256({ low: 0n, high: 0n }, { low: 5n, high: 0n }),
      ).toEqual({ low: 0n, high: 0n });
      expect(
        mathU256Simulator.mulU256({ low: 0n, high: 0n }, { low: 0n, high: 0n }),
      ).toEqual({ low: 0n, high: 0n });
    });
  });

  describe('DivU256', () => {
    test('should divide two U256 numbers', () => {
      expect(
        mathU256Simulator.divU256(
          { low: 10n, high: 0n },
          { low: 3n, high: 0n },
        ),
      ).toEqual({ low: 3n, high: 0n });
    });

    test('should fail on division by zero', () => {
      expect(() =>
        mathU256Simulator.divU256({ low: 5n, high: 0n }, { low: 0n, high: 0n }),
      ).toThrowError('MathU256: division by zero');
    });

    test('should divide max Uint<256> by 1', () => {
      expect(
        mathU256Simulator.divU256(
          { low: MAX_U128, high: MAX_U128 },
          { low: 1n, high: 0n },
        ),
      ).toEqual({ low: MAX_U128, high: MAX_U128 });
    });

    test('should divide max Uint<256> by itself', () => {
      expect(
        mathU256Simulator.divU256(
          { low: MAX_U128, high: MAX_U128 },
          { low: MAX_U128, high: MAX_U128 },
        ),
      ).toEqual({ low: 1n, high: 0n });
    });

    test('should handle zero dividend', () => {
      expect(
        mathU256Simulator.divU256({ low: 0n, high: 0n }, { low: 5n, high: 0n }),
      ).toEqual({ low: 0n, high: 0n });
    });
  });

  describe('RemU256', () => {
    test('should compute remainder of U256 numbers', () => {
      expect(
        mathU256Simulator.remU256(
          { low: 10n, high: 0n },
          { low: 3n, high: 0n },
        ),
      ).toEqual({ low: 1n, high: 0n });
    });

    test('should fail on division by zero', () => {
      expect(() =>
        mathU256Simulator.remU256({ low: 5n, high: 0n }, { low: 0n, high: 0n }),
      ).toThrowError('MathU256: division by zero');
    });

    test('should compute remainder of max Uint<256> by 2', () => {
      expect(
        mathU256Simulator.remU256(
          { low: MAX_U128, high: MAX_U128 },
          { low: 2n, high: 0n },
        ),
      ).toEqual({ low: 1n, high: 0n });
    });

    test('should handle no remainder', () => {
      expect(
        mathU256Simulator.remU256(
          { low: 100n, high: 0n },
          { low: 5n, high: 0n },
        ),
      ).toEqual({ low: 0n, high: 0n });
    });

    test('should handle zero dividend', () => {
      expect(
        mathU256Simulator.remU256({ low: 0n, high: 0n }, { low: 5n, high: 0n }),
      ).toEqual({ low: 0n, high: 0n });
    });
  });

  describe('SqrtU256', () => {
    test('should compute square root of small perfect squares', () => {
      expect(mathU256Simulator.sqrtU256({ low: 4n, high: 0n })).toBe(2n);
      expect(mathU256Simulator.sqrtU256({ low: 9n, high: 0n })).toBe(3n);
      expect(mathU256Simulator.sqrtU256({ low: 16n, high: 0n })).toBe(4n);
    });

    test('should compute square root of small imperfect squares', () => {
      expect(mathU256Simulator.sqrtU256({ low: 2n, high: 0n })).toBe(1n); // floor(sqrt(2)) ≈ 1.414
      expect(mathU256Simulator.sqrtU256({ low: 5n, high: 0n })).toBe(2n); // floor(sqrt(5)) ≈ 2.236
      expect(mathU256Simulator.sqrtU256({ low: 99n, high: 0n })).toBe(9n); // floor(sqrt(99)) ≈ 9.95
    });

    test('should handle zero', () => {
      expect(mathU256Simulator.sqrtU256({ low: 0n, high: 0n })).toBe(0n);
    });

    test('should handle max Uint<256>', () => {
      expect(
        mathU256Simulator.sqrtU256({ low: MAX_U128, high: MAX_U128 }),
      ).toBe(MAX_U128);
    });

    test('should handle special cases', () => {
      expect(mathU256Simulator.sqrtU256({ low: 255n, high: 0n })).toBe(15n); // MAX_U8
      expect(mathU256Simulator.sqrtU256({ low: 65535n, high: 0n })).toBe(255n); // MAX_U16
      expect(mathU256Simulator.sqrtU256({ low: 4294967295n, high: 0n })).toBe(
        65535n,
      ); // MAX_U32
    });
  });

  describe('MinU256', () => {
    test('should return the smaller of two U256 numbers', () => {
      expect(
        mathU256Simulator.minU256({ low: 5n, high: 0n }, { low: 3n, high: 0n }),
      ).toEqual({ low: 3n, high: 0n });
      expect(
        mathU256Simulator.minU256({ low: 3n, high: 0n }, { low: 5n, high: 0n }),
      ).toEqual({ low: 3n, high: 0n });
    });

    test('should handle equal numbers', () => {
      expect(
        mathU256Simulator.minU256(
          { low: 10n, high: 0n },
          { low: 10n, high: 0n },
        ),
      ).toEqual({ low: 10n, high: 0n });
    });

    test('should handle zero', () => {
      expect(
        mathU256Simulator.minU256({ low: 0n, high: 0n }, { low: 5n, high: 0n }),
      ).toEqual({ low: 0n, high: 0n });
      expect(
        mathU256Simulator.minU256({ low: 0n, high: 0n }, { low: 0n, high: 0n }),
      ).toEqual({ low: 0n, high: 0n });
    });

    test('should handle max Uint<256>', () => {
      expect(
        mathU256Simulator.minU256(
          { low: MAX_U128, high: MAX_U128 },
          { low: MAX_U128 - 1n, high: MAX_U128 },
        ),
      ).toEqual({ low: MAX_U128 - 1n, high: MAX_U128 });
    });
  });

  describe('MaxU256', () => {
    test('should return the larger of two U256 numbers', () => {
      expect(
        mathU256Simulator.maxU256({ low: 5n, high: 0n }, { low: 3n, high: 0n }),
      ).toEqual({ low: 5n, high: 0n });
      expect(
        mathU256Simulator.maxU256({ low: 3n, high: 0n }, { low: 5n, high: 0n }),
      ).toEqual({ low: 5n, high: 0n });
    });

    test('should handle equal numbers', () => {
      expect(
        mathU256Simulator.maxU256(
          { low: 10n, high: 0n },
          { low: 10n, high: 0n },
        ),
      ).toEqual({ low: 10n, high: 0n });
    });

    test('should handle zero', () => {
      expect(
        mathU256Simulator.maxU256({ low: 0n, high: 0n }, { low: 5n, high: 0n }),
      ).toEqual({ low: 5n, high: 0n });
      expect(
        mathU256Simulator.maxU256({ low: 0n, high: 0n }, { low: 0n, high: 0n }),
      ).toEqual({ low: 0n, high: 0n });
    });

    test('should handle max Uint<256>', () => {
      expect(
        mathU256Simulator.maxU256(
          { low: MAX_U128, high: MAX_U128 },
          { low: MAX_U128 - 1n, high: MAX_U128 },
        ),
      ).toEqual({ low: MAX_U128, high: MAX_U128 });
    });
  });

  describe('IsMultipleU256', () => {
    test('should check if a U256 number is a multiple of another', () => {
      expect(
        mathU256Simulator.isMultipleU256(
          { low: 10n, high: 0n },
          { low: 2n, high: 0n },
        ),
      ).toBe(true);
      expect(
        mathU256Simulator.isMultipleU256(
          { low: 10n, high: 0n },
          { low: 3n, high: 0n },
        ),
      ).toBe(false);
    });

    test('should fail on division by zero', () => {
      expect(() =>
        mathU256Simulator.isMultipleU256(
          { low: 5n, high: 0n },
          { low: 0n, high: 0n },
        ),
      ).toThrowError('MathU256: division by zero');
    });

    test('should handle zero dividend', () => {
      expect(
        mathU256Simulator.isMultipleU256(
          { low: 0n, high: 0n },
          { low: 5n, high: 0n },
        ),
      ).toBe(true);
    });

    test('should handle max Uint<256>', () => {
      expect(
        mathU256Simulator.isMultipleU256(
          { low: MAX_U128, high: MAX_U128 },
          { low: 1n, high: 0n },
        ),
      ).toBe(true);
      expect(
        mathU256Simulator.isMultipleU256(
          { low: MAX_U128, high: MAX_U128 },
          { low: 2n, high: 0n },
        ),
      ).toBe(false); // MAX_U256 is odd
    });
  });
});
