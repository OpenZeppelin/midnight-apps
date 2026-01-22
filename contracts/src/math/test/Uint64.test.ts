import { beforeEach, describe, expect, test } from 'vitest';
import { MAX_UINT32, MAX_UINT64 } from '../utils/consts.js';
import { Uint64Simulator } from './mocks/Uint64Simulator.js';

let uint64Simulator: Uint64Simulator;

const setup = () => {
  uint64Simulator = new Uint64Simulator();
};

describe('Uint64', () => {
  beforeEach(setup);

  describe('Add', () => {
    test('should add two numbers', () => {
      expect(uint64Simulator.add(5n, 3n)).toBe(8n);
    });

    test('should not overflow', () => {
      expect(uint64Simulator.add(MAX_UINT64, MAX_UINT64)).toBe(
        36893488147419103230n,
      );
    });
  });

  describe('Sub', () => {
    test('should subtract two numbers', () => {
      expect(uint64Simulator.sub(10n, 4n)).toBe(6n);
    });

    test('should subtract zero', () => {
      expect(uint64Simulator.sub(5n, 0n)).toBe(5n);
      expect(uint64Simulator.sub(0n, 0n)).toBe(0n);
    });

    test('should subtract from zero', () => {
      expect(() => uint64Simulator.sub(0n, 5n)).toThrowError(
        'failed assert: Math: subtraction underflow',
      );
    });

    test('should subtract max Uint<64> minus 1', () => {
      expect(uint64Simulator.sub(MAX_UINT64, 1n)).toBe(MAX_UINT64 - 1n);
    });

    test('should subtract max Uint<64> minus itself', () => {
      expect(uint64Simulator.sub(MAX_UINT64, MAX_UINT64)).toBe(0n);
    });

    test('should fail on underflow with small numbers', () => {
      expect(() => uint64Simulator.sub(3n, 5n)).toThrowError(
        'failed assert: Math: subtraction underflow',
      );
    });

    test('should fail on underflow with large numbers', () => {
      expect(() =>
        uint64Simulator.sub(MAX_UINT64 - 10n, MAX_UINT64),
      ).toThrowError('failed assert: Math: subtraction underflow');
    });
  });

  describe('Mul', () => {
    test('should multiply two numbers', () => {
      expect(uint64Simulator.mul(4n, 3n)).toBe(12n);
    });

    test('should handle max Uint<64> times 1', () => {
      expect(uint64Simulator.mul(MAX_UINT64, 1n)).toBe(MAX_UINT64);
    });

    test('should handle max Uint<64> times max Uint<64> without overflow', () => {
      expect(uint64Simulator.mul(MAX_UINT64, MAX_UINT64)).toBe(
        MAX_UINT64 * MAX_UINT64,
      );
    });
  });

  describe('div', () => {
    test('should divide small numbers', () => {
      expect(uint64Simulator.div(10n, 3n)).toBe(3n);
    });

    test('should handle dividend is zero', () => {
      expect(uint64Simulator.div(0n, 5n)).toBe(0n);
    });

    test('should handle divisor is one', () => {
      expect(uint64Simulator.div(10n, 1n)).toBe(10n);
    });

    test('should handle dividend equals divisor', () => {
      expect(uint64Simulator.div(5n, 5n)).toBe(1n);
    });

    test('should handle dividend less than divisor', () => {
      expect(uint64Simulator.div(3n, 5n)).toBe(0n);
    });

    test('should handle large division', () => {
      expect(uint64Simulator.div(MAX_UINT64, 2n)).toBe(MAX_UINT64 / 2n);
    });

    test('should fail on division by zero', () => {
      expect(() => uint64Simulator.div(5n, 0n)).toThrowError(
        'failed assert: Math: division by zero',
      );
    });

    test('should fail when remainder >= divisor', () => {
      uint64Simulator.overrideWitness('divU64Locally', (context) => [
        context.privateState,
        { quotient: 1n, remainder: 10n },
      ]);
      expect(() => uint64Simulator.div(10n, 5n)).toThrow(
        'failed assert: Math: remainder error',
      );
    });

    test('should fail when quotient * b + remainder != a', () => {
      uint64Simulator.overrideWitness('divU64Locally', (context) => [
        context.privateState,
        { quotient: 1n, remainder: 1n },
      ]);
      expect(() => uint64Simulator.div(10n, 5n)).toThrow(
        'failed assert: Math: division invalid',
      );
    });
  });

  describe('rem', () => {
    test('should compute remainder of small numbers', () => {
      expect(uint64Simulator.rem(10n, 3n)).toBe(1n);
    });

    test('should handle dividend is zero', () => {
      expect(uint64Simulator.rem(0n, 5n)).toBe(0n);
    });

    test('should handle divisor is one', () => {
      expect(uint64Simulator.rem(10n, 1n)).toBe(0n);
    });

    test('should handle dividend equals divisor', () => {
      expect(uint64Simulator.rem(5n, 5n)).toBe(0n);
    });

    test('should handle dividend less than divisor', () => {
      expect(uint64Simulator.rem(3n, 5n)).toBe(3n);
    });

    test('should compute remainder of max U64 by 2', () => {
      expect(uint64Simulator.rem(MAX_UINT64, 2n)).toBe(1n);
    });

    test('should handle zero remainder', () => {
      expect(uint64Simulator.rem(6n, 3n)).toBe(0n);
    });

    test('should fail on division by zero', () => {
      expect(() => uint64Simulator.rem(5n, 0n)).toThrowError(
        'failed assert: Math: division by zero',
      );
    });

    test('should fail when remainder >= divisor', () => {
      uint64Simulator.overrideWitness('divU64Locally', (context) => [
        context.privateState,
        { quotient: 1n, remainder: 5n },
      ]);
      expect(() => uint64Simulator.rem(10n, 5n)).toThrow(
        'failed assert: Math: remainder error',
      );
    });

    test('should fail when quotient * b + remainder != a', () => {
      uint64Simulator.overrideWitness('divU64Locally', (context) => [
        context.privateState,
        { quotient: 0n, remainder: 2n },
      ]);
      expect(() => uint64Simulator.rem(10n, 5n)).toThrow(
        'failed assert: Math: division invalid',
      );
    });
  });

  describe('divRem', () => {
    test('should compute quotient and remainder of small numbers', () => {
      const result = uint64Simulator.divRem(10n, 3n);
      expect(result.quotient).toBe(3n);
      expect(result.remainder).toBe(1n);
    });

    test('should handle dividend is zero', () => {
      const result = uint64Simulator.divRem(0n, 5n);
      expect(result.quotient).toBe(0n);
      expect(result.remainder).toBe(0n);
    });

    test('should handle divisor is one', () => {
      const result = uint64Simulator.divRem(10n, 1n);
      expect(result.quotient).toBe(10n);
      expect(result.remainder).toBe(0n);
    });

    test('should handle dividend equals divisor', () => {
      const result = uint64Simulator.divRem(5n, 5n);
      expect(result.quotient).toBe(1n);
      expect(result.remainder).toBe(0n);
    });

    test('should handle dividend less than divisor', () => {
      const result = uint64Simulator.divRem(3n, 5n);
      expect(result.quotient).toBe(0n);
      expect(result.remainder).toBe(3n);
    });

    test('should compute quotient and remainder of max U64 by 2', () => {
      const result = uint64Simulator.divRem(MAX_UINT64, 2n);
      expect(result.quotient).toBe(MAX_UINT64 / 2n);
      expect(result.remainder).toBe(1n);
    });

    test('should handle zero remainder', () => {
      const result = uint64Simulator.divRem(6n, 3n);
      expect(result.quotient).toBe(2n);
      expect(result.remainder).toBe(0n);
    });

    test('should fail on division by zero', () => {
      expect(() => uint64Simulator.divRem(5n, 0n)).toThrowError(
        'failed assert: Math: division by zero',
      );
    });

    test('should fail when remainder >= divisor', () => {
      uint64Simulator.overrideWitness('divU64Locally', (context) => [
        context.privateState,
        { quotient: 1n, remainder: 5n },
      ]);
      expect(() => uint64Simulator.divRem(10n, 5n)).toThrow(
        'failed assert: Math: remainder error',
      );
    });

    test('should fail when quotient * b + remainder != a', () => {
      uint64Simulator.overrideWitness('divU64Locally', (context) => [
        context.privateState,
        { quotient: 2n, remainder: 0n },
      ]);
      expect(() => uint64Simulator.divRem(11n, 5n)).toThrow(
        'failed assert: Math: division invalid',
      ); // 2*5 + 0 = 10 ≠ 11
    });

    test('should fail when remainder >= divisor (duplicate)', () => {
      uint64Simulator.overrideWitness('divU64Locally', (context) => [
        context.privateState,
        { quotient: 1n, remainder: 10n },
      ]);
      expect(() => uint64Simulator.divRem(10n, 5n)).toThrow(
        'failed assert: Math: remainder error',
      );
    });
  });

  describe('Sqrt', () => {
    test('should compute square root of small perfect squares', () => {
      expect(uint64Simulator.sqrt(4n)).toBe(2n);
      expect(uint64Simulator.sqrt(9n)).toBe(3n);
      expect(uint64Simulator.sqrt(16n)).toBe(4n);
      expect(uint64Simulator.sqrt(25n)).toBe(5n);
      expect(uint64Simulator.sqrt(100n)).toBe(10n);
    });

    test('should compute square root of small imperfect squares', () => {
      expect(uint64Simulator.sqrt(2n)).toBe(1n); // floor(sqrt(2)) ≈ 1.414
      expect(uint64Simulator.sqrt(3n)).toBe(1n); // floor(sqrt(3)) ≈ 1.732
      expect(uint64Simulator.sqrt(5n)).toBe(2n); // floor(sqrt(5)) ≈ 2.236
      expect(uint64Simulator.sqrt(8n)).toBe(2n); // floor(sqrt(8)) ≈ 2.828
      expect(uint64Simulator.sqrt(99n)).toBe(9n); // floor(sqrt(99)) ≈ 9.95
    });

    test('should compute square root of large perfect squares', () => {
      expect(uint64Simulator.sqrt(10000n)).toBe(100n);
      expect(uint64Simulator.sqrt(1000000n)).toBe(1000n);
      expect(uint64Simulator.sqrt(100000000n)).toBe(10000n);
    });

    test('should compute square root of large imperfect squares', () => {
      expect(uint64Simulator.sqrt(101n)).toBe(10n); // floor(sqrt(101)) ≈ 10.05
      expect(uint64Simulator.sqrt(999999n)).toBe(999n); // floor(sqrt(999999)) ≈ 999.9995
      expect(uint64Simulator.sqrt(100000001n)).toBe(10000n); // floor(sqrt(100000001)) ≈ 10000.00005
    });

    test('should handle powers of 2', () => {
      expect(uint64Simulator.sqrt(2n ** 32n)).toBe(65536n); // sqrt(2^32) = 2^16
      expect(uint64Simulator.sqrt(MAX_UINT64)).toBe(4294967295n); // sqrt(2^64 - 1) ≈ 2^32 - 1
    });

    test('should fail if number exceeds MAX_64', () => {
      expect(() => uint64Simulator.sqrt(MAX_UINT64 + 1n)).toThrow(
        'expected value of type Uint<0..18446744073709551616> but received 18446744073709551616',
      );
    });

    test('should handle zero', () => {
      expect(uint64Simulator.sqrt(0n)).toBe(0n);
    });

    test('should handle 1', () => {
      expect(uint64Simulator.sqrt(1n)).toBe(1n);
    });

    test('should handle max Uint<64>', () => {
      expect(uint64Simulator.sqrt(MAX_UINT64)).toBe(MAX_UINT32); // floor(sqrt(2^64 - 1)) = 2^32 - 1
    });

    test('should fail with overestimated root', () => {
      uint64Simulator.overrideWitness('sqrtU64Locally', (context) => [
        context.privateState,
        5n,
      ]);
      expect(() => uint64Simulator.sqrt(10n)).toThrow(
        'failed assert: Math: sqrt overestimate',
      );
    });

    test('should fail with underestimated root', () => {
      uint64Simulator.overrideWitness('sqrtU64Locally', (context) => [
        context.privateState,
        3n,
      ]);
      expect(() => uint64Simulator.sqrt(16n)).toThrow(
        'failed assert: Math: sqrt underestimate',
      );
    });
  });

  describe('IsMultiple', () => {
    test('should check if multiple', () => {
      expect(uint64Simulator.isMultiple(6n, 3n)).toBe(true);
    });

    test('should fail on zero divisor', () => {
      expect(() => uint64Simulator.isMultiple(5n, 0n)).toThrowError(
        'failed assert: Math: division by zero',
      );
    });

    test('should check max Uint<64> is multiple of 1', () => {
      expect(uint64Simulator.isMultiple(MAX_UINT64, 1n)).toBe(true);
    });

    test('should detect a failed case', () => {
      expect(uint64Simulator.isMultiple(7n, 3n)).toBe(false);
    });
  });

  describe('Min', () => {
    test('should return minimum', () => {
      expect(uint64Simulator.min(5n, 3n)).toBe(3n);
    });

    test('should handle equal values', () => {
      expect(uint64Simulator.min(4n, 4n)).toBe(4n);
    });

    test('should handle max Uint<64> and smaller value', () => {
      expect(uint64Simulator.min(MAX_UINT64, 1n)).toBe(1n);
    });
  });

  describe('Max', () => {
    test('should return maximum', () => {
      expect(uint64Simulator.max(5n, 3n)).toBe(5n);
    });

    test('should handle equal values', () => {
      expect(uint64Simulator.max(4n, 4n)).toBe(4n);
    });

    test('should handle max Uint<64> and smaller value', () => {
      expect(uint64Simulator.max(MAX_UINT64, 1n)).toBe(MAX_UINT64);
    });
  });

  describe('MAX_UINT8', () => {
    test('should return 255', () => {
      expect(uint64Simulator.MAX_UINT8()).toBe(255n);
    });
  });

  describe('MAX_UINT16', () => {
    test('should return 65535', () => {
      expect(uint64Simulator.MAX_UINT16()).toBe(65535n);
    });
  });

  describe('MAX_UINT32', () => {
    test('should return 4294967295', () => {
      expect(uint64Simulator.MAX_UINT32()).toBe(4294967295n);
    });
  });

  describe('MAX_UINT64', () => {
    test('should return 18446744073709551615', () => {
      expect(uint64Simulator.MAX_UINT64()).toBe(18446744073709551615n);
    });
  });
});
