import { beforeEach, describe, expect, test } from 'vitest';
import { MathContractSimulator } from './MathContractSimulator';

let mathSimulator: MathContractSimulator;

const MAX_U8 = 2n ** 8n - 1n;
const MAX_U16 = 2n ** 16n - 1n;
const MAX_U32 = 2n ** 32n - 1n;
const MAX_U64 = 2n ** 64n - 1n;
const MAX_U128 = 2n ** 128n - 1n;
const MAX_U256 = 2n ** 256n - 1n;

const setup = () => {
  mathSimulator = new MathContractSimulator();
};

describe('Math', () => {
  beforeEach(setup);

  describe('Initialize', () => {
    test('should set MAX_U8', () => {
      expect(mathSimulator.getCurrentPublicState().mathMAXU8).toBe(MAX_U8);
    });

    test('should set MAX_U16', () => {
      expect(mathSimulator.getCurrentPublicState().mathMAXU16).toBe(MAX_U16);
    });

    test('should set MAX_U32', () => {
      expect(mathSimulator.getCurrentPublicState().mathMAXU32).toBe(MAX_U32);
    });

    test('should set MAX_U64', () => {
      expect(mathSimulator.getCurrentPublicState().mathMAXU64).toBe(MAX_U64);
    });

    test('should set MAX_U128', () => {
      expect(mathSimulator.getCurrentPublicState().mathMAXU128).toBe(MAX_U128);
    });

    test('should set MAX_U256', () => {
      expect(mathSimulator.getCurrentPublicState().mathMAXU256).toBe(MAX_U256);
    });
  });

  describe('Add', () => {
    test('should add two numbers', () => {
      expect(mathSimulator.add(5n, 3n)).toBe(8n);
    });

    test('should fail on overflow', () => {
      expect(() => mathSimulator.add(MAX_U128, 1n)).toThrowError(
        'Math: addition overflow',
      );
    });

    test('should handle max Uint<128> minus 1 plus 1', () => {
      expect(mathSimulator.add(MAX_U128 - 1n, 1n)).toBe(MAX_U128);
    });
  });

  describe('Sub', () => {
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
      expect(mathSimulator.sqrt(2n ** 64n)).toBe(4294967296n); // sqrt(2^64) = 2^32
      expect(mathSimulator.sqrt(MAX_U128)).toBe(18446744073709551615n); // sqrt(2^128) = 2^64
    });

    test('should fail if number exceeds MAX_U128', () => {
      expect(() => mathSimulator.sqrt(MAX_U128 + 1n)).toThrow(
        "expected value of type Uint<0..340282366920938463463374607431768211455> but received 340282366920938463463374607431768211456n"
      );
    });

    test('should handle zero', () => {
      expect(mathSimulator.sqrt(0n)).toBe(0n);
    });

    test('should handle 1', () => {
      expect(mathSimulator.sqrt(1n)).toBe(1n);
    });

    test('should handle max Uint<64>', () => {
      expect(mathSimulator.sqrt(MAX_U64)).toBe(4294967295n); // floor(sqrt(2^64 - 1)) = 2^32 - 1
    });

    test('should handle max Uint<128>', () => {
      expect(mathSimulator.sqrt(MAX_U128)).toBe(MAX_U64); // floor(sqrt(2^128 - 1)) = 2^64 - 1
    });
  });

  describe('Mul', () => {
    test('should multiply two numbers', () => {
      expect(mathSimulator.mul(4n, 3n)).toBe(12n);
    });

    test('should handle max Uint<128> times 1', () => {
      expect(mathSimulator.mul(MAX_U128, 1n)).toBe(MAX_U128);
    });

    test('should handle max Uint<128> times max Uint<128> without overflow', () => {
      expect(mathSimulator.mul(MAX_U128, MAX_U128)).toBe(MAX_U128 * MAX_U128);
    });
  });

  describe('Div', () => {
    test('should divide two numbers', () => {
      expect(mathSimulator.div(10n, 3n)).toBe(3n);
    });

    test('should fail on division by zero', () => {
      expect(() => mathSimulator.div(5n, 0n)).toThrowError(
        'Math: division by zero',
      );
    });

    test('should divide max Uint<128> by 1', () => {
      expect(mathSimulator.div(MAX_U128, 1n)).toBe(MAX_U128);
    });

    test('should divide max Uint<128> by itself', () => {
      expect(mathSimulator.div(MAX_U128, MAX_U128)).toBe(1n);
    });
  });

  describe('Remainder', () => {
    test('should compute remainder', () => {
      expect(mathSimulator.remainder(10n, 3n)).toBe(1n);
    });

    test('should fail on division by zero', () => {
      expect(() => mathSimulator.remainder(5n, 0n)).toThrowError(
        'Math: division by zero',
      );
    });

    test('should compute remainder of max Uint<128> by 2', () => {
      expect(mathSimulator.remainder(MAX_U128, 2n)).toBe(1n);
    });
  });

  describe('Sqrt', () => {
    test('should compute square root', () => {
      expect(mathSimulator.sqrt(16n)).toBe(4n);
    });

    test('should handle zero', () => {
      expect(mathSimulator.sqrt(0n)).toBe(0n);
    });

    test('should handle max Uint<128>', () => {
      expect(mathSimulator.sqrt(MAX_U128)).toBe(MAX_U64); // sqrt(2^128 - 1) ≈ 2^64 - 1
    });

    test('should handle 1', () => {
      expect(mathSimulator.sqrt(1n)).toBe(1n);
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

    test('should check max Uint<128> is multiple of 1', () => {
      expect(mathSimulator.isMultiple(MAX_U128, 1n)).toBe(true);
    });
  });

  describe('Min', () => {
    test('should return minimum', () => {
      expect(mathSimulator.min(5n, 3n)).toBe(3n);
    });

    test('should handle equal values', () => {
      expect(mathSimulator.min(4n, 4n)).toBe(4n);
    });

    test('should handle max Uint<128> and smaller value', () => {
      expect(mathSimulator.min(MAX_U128, 1n)).toBe(1n);
    });
  });

  describe('Max', () => {
    test('should return maximum', () => {
      expect(mathSimulator.max(5n, 3n)).toBe(5n);
    });

    test('should handle equal values', () => {
      expect(mathSimulator.max(4n, 4n)).toBe(4n);
    });

    test('should handle max Uint<128> and smaller value', () => {
      expect(mathSimulator.max(MAX_U128, 1n)).toBe(MAX_U128);
    });
  });
});
