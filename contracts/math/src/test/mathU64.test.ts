import { beforeEach, describe, expect, test } from 'vitest';
import { MathContractSimulator } from './MathU64Simulator';

let mathSimulator: MathContractSimulator;

const MAX_U32 = 2n ** 32n - 1n;
const MAX_U64 = 2n ** 64n - 1n;

const setup = () => {
  mathSimulator = new MathContractSimulator();
};

describe('MathU64', () => {
  beforeEach(setup);

  describe('div', () => {
    test('should divide small numbers', () => {
      expect(mathSimulator.div(10n, 3n)).toBe(3n);
    });

    test('should handle dividend is zero', () => {
      expect(mathSimulator.div(0n, 5n)).toBe(0n);
    });

    test('should handle divisor is one', () => {
      expect(mathSimulator.div(10n, 1n)).toBe(10n);
    });

    test('should handle dividend equals divisor', () => {
      expect(mathSimulator.div(5n, 5n)).toBe(1n);
    });

    test('should handle dividend less than divisor', () => {
      expect(mathSimulator.div(3n, 5n)).toBe(0n);
    });

    test('should handle large division', () => {
      expect(mathSimulator.div(MAX_U64, 2n)).toBe(MAX_U64 / 2n);
    });

    test('should fail on division by zero', () => {
      expect(() => mathSimulator.div(5n, 0n)).toThrowError(
        'Math: division by zero',
      );
    });
  });

  describe('rem', () => {
    test('should compute remainder of small numbers', () => {
      expect(mathSimulator.rem(10n, 3n)).toBe(1n);
    });

    test('should handle dividend is zero', () => {
      expect(mathSimulator.rem(0n, 5n)).toBe(0n);
    });

    test('should handle divisor is one', () => {
      expect(mathSimulator.rem(10n, 1n)).toBe(0n);
    });

    test('should handle dividend equals divisor', () => {
      expect(mathSimulator.rem(5n, 5n)).toBe(0n);
    });

    test('should handle dividend less than divisor', () => {
      expect(mathSimulator.rem(3n, 5n)).toBe(3n);
    });

    test('should compute remainder of max U64 by 2', () => {
      expect(mathSimulator.rem(MAX_U64, 2n)).toBe(1n);
    });

    test('should handle zero remainder', () => {
      expect(mathSimulator.rem(6n, 3n)).toBe(0n);
    });

    test('should fail on division by zero', () => {
      expect(() => mathSimulator.rem(5n, 0n)).toThrowError(
        'Math: division by zero',
      );
    });
  });

  describe('divRem', () => {
    test('should compute quotient and remainder of small numbers', () => {
      const result = mathSimulator.divRem(10n, 3n);
      expect(result.quotient).toBe(3n);
      expect(result.remainder).toBe(1n);
    });

    test('should handle dividend is zero', () => {
      const result = mathSimulator.divRem(0n, 5n);
      expect(result.quotient).toBe(0n);
      expect(result.remainder).toBe(0n);
    });

    test('should handle divisor is one', () => {
      const result = mathSimulator.divRem(10n, 1n);
      expect(result.quotient).toBe(10n);
      expect(result.remainder).toBe(0n);
    });

    test('should handle dividend equals divisor', () => {
      const result = mathSimulator.divRem(5n, 5n);
      expect(result.quotient).toBe(1n);
      expect(result.remainder).toBe(0n);
    });

    test('should handle dividend less than divisor', () => {
      const result = mathSimulator.divRem(3n, 5n);
      expect(result.quotient).toBe(0n);
      expect(result.remainder).toBe(3n);
    });

    test('should compute quotient and remainder of max U64 by 2', () => {
      const result = mathSimulator.divRem(MAX_U64, 2n);
      expect(result.quotient).toBe(MAX_U64 / 2n);
      expect(result.remainder).toBe(1n);
    });

    test('should handle zero remainder', () => {
      const result = mathSimulator.divRem(6n, 3n);
      expect(result.quotient).toBe(2n);
      expect(result.remainder).toBe(0n);
    });

    test('should fail on division by zero', () => {
      expect(() => mathSimulator.divRem(5n, 0n)).toThrowError(
        'Math: division by zero',
      );
    });
  });

  describe('Sqrt', () => {
    test('should compute square root of small perfect squares', () => {
      expect(mathSimulator.sqrt(4n)).toBe(2n);
      expect(mathSimulator.sqrt(9n)).toBe(3n);
      expect(mathSimulator.sqrt(16n)).toBe(4n);
      expect(mathSimulator.sqrt(25n)).toBe(5n);
      expect(mathSimulator.sqrt(100n)).toBe(10n);
    });

    test('should compute square root of small imperfect squares', () => {
      expect(mathSimulator.sqrt(2n)).toBe(1n); // floor(sqrt(2)) ≈ 1.414
      expect(mathSimulator.sqrt(3n)).toBe(1n); // floor(sqrt(3)) ≈ 1.732
      expect(mathSimulator.sqrt(5n)).toBe(2n); // floor(sqrt(5)) ≈ 2.236
      expect(mathSimulator.sqrt(8n)).toBe(2n); // floor(sqrt(8)) ≈ 2.828
      expect(mathSimulator.sqrt(99n)).toBe(9n); // floor(sqrt(99)) ≈ 9.95
    });

    test('should compute square root of large perfect squares', () => {
      expect(mathSimulator.sqrt(10000n)).toBe(100n);
      expect(mathSimulator.sqrt(1000000n)).toBe(1000n);
      expect(mathSimulator.sqrt(100000000n)).toBe(10000n);
    });

    test('should compute square root of large imperfect squares', () => {
      expect(mathSimulator.sqrt(101n)).toBe(10n); // floor(sqrt(101)) ≈ 10.05
      expect(mathSimulator.sqrt(999999n)).toBe(999n); // floor(sqrt(999999)) ≈ 999.9995
      expect(mathSimulator.sqrt(100000001n)).toBe(10000n); // floor(sqrt(100000001)) ≈ 10000.00005
    });

    test('should handle powers of 2', () => {
      expect(mathSimulator.sqrt(2n ** 32n)).toBe(65536n); // sqrt(2^32) = 2^16
      expect(mathSimulator.sqrt(MAX_U64)).toBe(4294967295n); // sqrt(2^64 - 1) ≈ 2^32 - 1
    });

    test('should fail if number exceeds MAX_64', () => {
      expect(() => mathSimulator.sqrt(MAX_U64 + 1n)).toThrow(
        'expected value of type Uint<0..18446744073709551615> but received 18446744073709551616',
      );
    });

    test('should handle zero', () => {
      expect(mathSimulator.sqrt(0n)).toBe(0n);
    });

    test('should handle 1', () => {
      expect(mathSimulator.sqrt(1n)).toBe(1n);
    });

    test('should handle max Uint<64>', () => {
      expect(mathSimulator.sqrt(MAX_U64)).toBe(MAX_U32); // floor(sqrt(2^64 - 1)) = 2^32 - 1
    });
  });

  describe('IsMultiple', () => {
    test('should check if multiple', () => {
      expect(mathSimulator.isMultiple(6n, 3n)).toBe(true);
    });

    test('should fail on zero divisor', () => {
      expect(() => mathSimulator.isMultiple(5n, 0n)).toThrowError(
        'Math: division by zero',
      );
    });

    test('should check max Uint<64> is multiple of 1', () => {
      expect(mathSimulator.isMultiple(MAX_U64, 1n)).toBe(true);
    });

    test('should detect a failed case', () => {
      expect(mathSimulator.isMultiple(7n, 3n)).toBe(false);
    });
  });

  describe('Min', () => {
    test('should return minimum', () => {
      expect(mathSimulator.min(5n, 3n)).toBe(3n);
    });

    test('should handle equal values', () => {
      expect(mathSimulator.min(4n, 4n)).toBe(4n);
    });

    test('should handle max Uint<64> and smaller value', () => {
      expect(mathSimulator.min(MAX_U64, 1n)).toBe(1n);
    });
  });

  describe('Max', () => {
    test('should return maximum', () => {
      expect(mathSimulator.max(5n, 3n)).toBe(5n);
    });

    test('should handle equal values', () => {
      expect(mathSimulator.max(4n, 4n)).toBe(4n);
    });

    test('should handle max Uint<64> and smaller value', () => {
      expect(mathSimulator.max(MAX_U64, 1n)).toBe(MAX_U64);
    });
  });
});
