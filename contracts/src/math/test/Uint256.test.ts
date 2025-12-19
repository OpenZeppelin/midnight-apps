import { beforeEach, describe, expect, test } from 'vitest';
import type { U256 } from '../../../artifacts/math/test/mocks/contracts/Uint256.mock/contract/index.js';
import {
  MAX_UINT8,
  MAX_UINT16,
  MAX_UINT32,
  MAX_UINT64,
  MAX_UINT128,
  MAX_UINT256,
} from '../utils/consts.js';
import { Uint256Simulator } from './mocks/Uint256Simulator.js';

let uint256Simulator: Uint256Simulator;

const setup = () => {
  uint256Simulator = new Uint256Simulator();
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

// Helper to convert little-endian Uint8Array to bigint
const bytesLEToBigint = (bytes: Uint8Array): bigint => {
  let result = 0n;
  for (let i = bytes.length - 1; i >= 0; i--) {
    result = (result << 8n) | BigInt(bytes[i]);
  }
  return result;
};

describe('MathU256', () => {
  beforeEach(setup);

  describe('toBytes (little-endian)', () => {
    test('should convert zero U256 to zero bytes', () => {
      const u256 = toU256(0n);
      const result = uint256Simulator.toBytes(u256);
      expect(result).toEqual(new Uint8Array(32).fill(0));
    });

    test('should convert small U256 to bytes', () => {
      const u256 = toU256(123n);
      const result = uint256Simulator.toBytes(u256);
      expect(result[0]).toBe(123);
      expect(result.slice(1)).toEqual(new Uint8Array(31).fill(0));
    });

    test('should convert max U256 to bytes', () => {
      const u256 = toU256(MAX_UINT256);
      const result = uint256Simulator.toBytes(u256);
      expect(result).toEqual(new Uint8Array(32).fill(255));
    });

    test('should convert MAX_UINT256 decimal value to all 0xFF bytes', () => {
      // MAX_UINT256 = 2^256 - 1
      const maxUint256Decimal =
        115792089237316195423570985008687907853269984665640564039457584007913129639935n;
      expect(maxUint256Decimal).toBe(MAX_UINT256);

      const u256 = toU256(maxUint256Decimal);

      // Verify the U256 struct has all limbs at max
      expect(u256.low.low).toBe(MAX_UINT64);
      expect(u256.low.high).toBe(MAX_UINT64);
      expect(u256.high.low).toBe(MAX_UINT64);
      expect(u256.high.high).toBe(MAX_UINT64);

      // Convert to bytes
      const result = uint256Simulator.toBytes(u256);

      // All 32 bytes should be 0xFF (255)
      expect(result.length).toBe(32);
      for (let i = 0; i < 32; i++) {
        expect(result[i]).toBe(0xff);
      }

      // Verify as hex string
      const hexString = Array.from(result)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      expect(hexString).toBe('ff'.repeat(32));
    });

    test('should place value at correct limb positions', () => {
      const u256: U256 = {
        low: { low: 1n, high: 2n },
        high: { low: 3n, high: 4n },
      };
      const result = uint256Simulator.toBytes(u256);
      expect(result[0]).toBe(1); // low.low at byte 0
      expect(result[8]).toBe(2); // low.high at byte 8
      expect(result[16]).toBe(3); // high.low at byte 16
      expect(result[24]).toBe(4); // high.high at byte 24
    });

    test('should correctly convert MAX_UINT64', () => {
      const u256 = toU256(MAX_UINT64);
      const result = uint256Simulator.toBytes(u256);
      // First 8 bytes should be 0xFF
      for (let i = 0; i < 8; i++) {
        expect(result[i]).toBe(255);
      }
      // Remaining bytes should be 0
      for (let i = 8; i < 32; i++) {
        expect(result[i]).toBe(0);
      }
    });

    test('should correctly convert MAX_UINT128', () => {
      const u256 = toU256(MAX_UINT128);
      const result = uint256Simulator.toBytes(u256);
      // First 16 bytes should be 0xFF
      for (let i = 0; i < 16; i++) {
        expect(result[i]).toBe(255);
      }
      // Remaining bytes should be 0
      for (let i = 16; i < 32; i++) {
        expect(result[i]).toBe(0);
      }
    });

    test('should correctly convert arbitrary value', () => {
      const value = 123456789012345678901234567890n;
      const u256 = toU256(value);
      const result = uint256Simulator.toBytes(u256);
      expect(bytesLEToBigint(result)).toBe(value);
    });
  });

  describe('Modules', () => {
    test('should return correct modulus for U256 high part', () => {
      const modulus = 2n ** 128n;
      expect(uint256Simulator.MODULUS()).toBe(modulus);
    });

    test('should return correct modulus as U256', () => {
      const modulus = 2n ** 128n;
      const modulusU256 = uint256Simulator.MODULUS_U256();
      expect(fromU256(modulusU256)).toBe(modulus);
    });
  });

  describe('ZERO_U256', () => {
    test('should return zero struct', () => {
      const result = uint256Simulator.ZERO_U256();
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
      expect(uint256Simulator.eq(a, b)).toBe(true);
    });

    test('should compare different low parts', () => {
      const a = toU256(123n);
      const b = toU256(124n);
      expect(uint256Simulator.eq(a, b)).toBe(false);
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
      expect(uint256Simulator.eq(a, b)).toBe(false);
    });

    test('should compare zero values', () => {
      const zero: U256 = {
        low: { low: 0n, high: 0n },
        high: { low: 0n, high: 0n },
      };
      expect(uint256Simulator.eq(zero, zero)).toBe(true);
    });

    test('should compare max U256 values', () => {
      const max = toU256(MAX_UINT256);
      expect(uint256Simulator.eq(max, max)).toBe(true);
    });
  });

  describe('lt', () => {
    test('should compare small numbers', () => {
      const a = toU256(5n);
      const b = toU256(10n);
      expect(uint256Simulator.lt(a, b)).toBe(true);
      expect(uint256Simulator.lt(b, a)).toBe(false);
      expect(uint256Simulator.lt(a, a)).toBe(false);
    });

    test('should compare max U256 values', () => {
      const max = toU256(MAX_UINT256);
      const maxMinusOne = toU256(MAX_UINT256 - 1n);
      expect(uint256Simulator.lt(max, max)).toBe(false);
      expect(uint256Simulator.lt(maxMinusOne, max)).toBe(true);
      expect(uint256Simulator.lt(max, maxMinusOne)).toBe(false);
    });

    test('should handle zero', () => {
      const zero = toU256(0n);
      const one = toU256(1n);
      expect(uint256Simulator.lt(zero, one)).toBe(true);
      expect(uint256Simulator.lt(zero, zero)).toBe(false);
      expect(uint256Simulator.lt(one, zero)).toBe(false);
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
      expect(uint256Simulator.lt(a, b)).toBe(true);
      expect(uint256Simulator.lt(b, a)).toBe(false);
    });

    test('should compare values differing only in highest limb', () => {
      const a: U256 = {
        low: { low: 0n, high: 0n },
        high: { low: 0n, high: 1n },
      };
      const b: U256 = {
        low: { low: 0n, high: 0n },
        high: { low: 0n, high: 2n },
      };
      expect(uint256Simulator.lt(a, b)).toBe(true);
      expect(uint256Simulator.lt(b, a)).toBe(false);
    });

    test('should compare values where lower is larger in low but smaller overall', () => {
      const a: U256 = {
        low: { low: MAX_UINT64, high: MAX_UINT64 },
        high: { low: 0n, high: 0n },
      };
      const b: U256 = {
        low: { low: 0n, high: 0n },
        high: { low: 1n, high: 0n },
      };
      // a has larger low part but b has larger high part, so a < b
      expect(uint256Simulator.lt(a, b)).toBe(true);
    });

    test('should compare values differing only in low.low vs low.high', () => {
      const a: U256 = {
        low: { low: MAX_UINT64, high: 0n },
        high: { low: 0n, high: 0n },
      };
      const b: U256 = {
        low: { low: 0n, high: 1n },
        high: { low: 0n, high: 0n },
      };
      // a = 2^64 - 1, b = 2^64, so a < b
      expect(uint256Simulator.lt(a, b)).toBe(true);
    });

    test('should compare values differing only in high limbs', () => {
      const a: U256 = {
        low: { low: MAX_UINT64, high: MAX_UINT64 },
        high: { low: MAX_UINT64, high: 0n },
      };
      const b: U256 = {
        low: { low: MAX_UINT64, high: MAX_UINT64 },
        high: { low: 0n, high: 1n },
      };
      // b has larger high.high
      expect(uint256Simulator.lt(a, b)).toBe(true);
    });
  });

  describe('lte', () => {
    test('should compare small numbers', () => {
      const a = toU256(5n);
      const b = toU256(10n);
      expect(uint256Simulator.lte(a, b)).toBe(true);
      expect(uint256Simulator.lte(b, a)).toBe(false);
      expect(uint256Simulator.lte(a, a)).toBe(true);
    });

    test('should compare max U256 values', () => {
      const max = toU256(MAX_UINT256);
      const maxMinusOne = toU256(MAX_UINT256 - 1n);
      expect(uint256Simulator.lte(max, max)).toBe(true);
      expect(uint256Simulator.lte(maxMinusOne, max)).toBe(true);
      expect(uint256Simulator.lte(max, maxMinusOne)).toBe(false);
    });

    test('should handle zero', () => {
      const zero = toU256(0n);
      const one = toU256(1n);
      expect(uint256Simulator.lte(zero, one)).toBe(true);
      expect(uint256Simulator.lte(zero, zero)).toBe(true);
      expect(uint256Simulator.lte(one, zero)).toBe(false);
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
      expect(uint256Simulator.lte(a, b)).toBe(true);
      expect(uint256Simulator.lte(b, a)).toBe(false);
    });
  });

  describe('gt', () => {
    test('should compare small numbers', () => {
      const a = toU256(10n);
      const b = toU256(5n);
      expect(uint256Simulator.gt(a, b)).toBe(true);
      expect(uint256Simulator.gt(b, a)).toBe(false);
      expect(uint256Simulator.gt(a, a)).toBe(false);
    });

    test('should compare max U256 values', () => {
      const max = toU256(MAX_UINT256);
      const maxMinusOne = toU256(MAX_UINT256 - 1n);
      expect(uint256Simulator.gt(max, maxMinusOne)).toBe(true);
      expect(uint256Simulator.gt(maxMinusOne, max)).toBe(false);
      expect(uint256Simulator.gt(max, max)).toBe(false);
    });

    test('should handle zero', () => {
      const zero = toU256(0n);
      const one = toU256(1n);
      expect(uint256Simulator.gt(one, zero)).toBe(true);
      expect(uint256Simulator.gt(zero, one)).toBe(false);
      expect(uint256Simulator.gt(zero, zero)).toBe(false);
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
      expect(uint256Simulator.gt(a, b)).toBe(true);
      expect(uint256Simulator.gt(b, a)).toBe(false);
    });
  });

  describe('gte', () => {
    test('should compare small numbers', () => {
      const a = toU256(10n);
      const b = toU256(5n);
      expect(uint256Simulator.gte(a, b)).toBe(true);
      expect(uint256Simulator.gte(b, a)).toBe(false);
      expect(uint256Simulator.gte(a, a)).toBe(true);
    });

    test('should compare max U256 values', () => {
      const max = toU256(MAX_UINT256);
      const maxMinusOne = toU256(MAX_UINT256 - 1n);
      expect(uint256Simulator.gte(max, maxMinusOne)).toBe(true);
      expect(uint256Simulator.gte(maxMinusOne, max)).toBe(false);
      expect(uint256Simulator.gte(max, max)).toBe(true);
    });

    test('should handle zero', () => {
      const zero = toU256(0n);
      const one = toU256(1n);
      expect(uint256Simulator.gte(one, zero)).toBe(true);
      expect(uint256Simulator.gte(zero, one)).toBe(false);
      expect(uint256Simulator.gte(zero, zero)).toBe(true);
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
      expect(uint256Simulator.gte(a, b)).toBe(true);
      expect(uint256Simulator.gte(b, a)).toBe(false);
    });
  });

  describe('add', () => {
    test('should add two small numbers', () => {
      const a = toU256(5n);
      const b = toU256(3n);
      const result = uint256Simulator.add(a, b);
      expect(fromU256(result)).toBe(8n);
    });

    test('should add max U256 minus 1 plus 1', () => {
      const a = toU256(MAX_UINT256 - 1n);
      const b = toU256(1n);
      const result = uint256Simulator.add(a, b);
      expect(fromU256(result)).toBe(MAX_UINT256);
    });

    test('should handle zero', () => {
      const zero = toU256(0n);
      const five = toU256(5n);
      const result = uint256Simulator.add(zero, zero);
      expect(fromU256(result)).toBe(0n);
      const result2 = uint256Simulator.add(five, zero);
      expect(fromU256(result2)).toBe(5n);
    });

    test('should handle zero addition (a = 0)', () => {
      const a = uint256Simulator.ZERO_U256();
      const b = toU256(5n);
      const result = uint256Simulator.add(a, b);
      expect(fromU256(result)).toBe(5n);
    });

    test('should handle zero addition (b = 0)', () => {
      const a = toU256(5n);
      const b = uint256Simulator.ZERO_U256();
      const result = uint256Simulator.add(a, b);
      expect(fromU256(result)).toBe(5n);
    });

    test('should handle equal values', () => {
      const a = toU256(5n);
      const b = toU256(5n);
      const result = uint256Simulator.add(a, b);
      expect(fromU256(result)).toBe(10n);
    });

    test('should throw on overflow', () => {
      const max = toU256(MAX_UINT256);
      const one = toU256(1n);
      expect(() => uint256Simulator.add(max, one)).toThrowError(
        'failed assert: MathU256: addition overflow',
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
      const result = uint256Simulator.add(a, b);
      expect(result.low.low).toBe(0n);
      expect(result.low.high).toBe(0n);
      expect(result.high.low).toBe(1n);
      expect(result.high.high).toBe(0n);
    });

    test('should handle max + 0', () => {
      const max = toU256(MAX_UINT256);
      const zero = uint256Simulator.ZERO_U256();
      const result = uint256Simulator.add(max, zero);
      expect(fromU256(result)).toBe(MAX_UINT256);
    });

    test('should handle carry propagation through all limbs', () => {
      // 2^192 - 1 + 1 should carry through to high.high
      const a: U256 = {
        low: { low: MAX_UINT64, high: MAX_UINT64 },
        high: { low: MAX_UINT64, high: 0n },
      };
      const b = toU256(1n);
      const result = uint256Simulator.add(a, b);
      expect(result.low.low).toBe(0n);
      expect(result.low.high).toBe(0n);
      expect(result.high.low).toBe(0n);
      expect(result.high.high).toBe(1n);
    });

    test('should handle large values addition without overflow', () => {
      const a = toU256(2n ** 200n);
      const b = toU256(2n ** 200n);
      const result = uint256Simulator.add(a, b);
      expect(fromU256(result)).toBe(2n ** 201n);
    });

    test('should handle carry from low.low to low.high only', () => {
      const a: U256 = {
        low: { low: MAX_UINT64, high: 0n },
        high: { low: 0n, high: 0n },
      };
      const b: U256 = {
        low: { low: 1n, high: 0n },
        high: { low: 0n, high: 0n },
      };
      const result = uint256Simulator.add(a, b);
      expect(result.low.low).toBe(0n);
      expect(result.low.high).toBe(1n);
      expect(result.high.low).toBe(0n);
      expect(result.high.high).toBe(0n);
    });

    test('should handle carry from low.high to high.low only', () => {
      const a: U256 = {
        low: { low: 0n, high: MAX_UINT64 },
        high: { low: 0n, high: 0n },
      };
      const b: U256 = {
        low: { low: 0n, high: 1n },
        high: { low: 0n, high: 0n },
      };
      const result = uint256Simulator.add(a, b);
      expect(result.low.low).toBe(0n);
      expect(result.low.high).toBe(0n);
      expect(result.high.low).toBe(1n);
      expect(result.high.high).toBe(0n);
    });

    test('should handle carry from high.low to high.high only', () => {
      const a: U256 = {
        low: { low: 0n, high: 0n },
        high: { low: MAX_UINT64, high: 0n },
      };
      const b: U256 = {
        low: { low: 0n, high: 0n },
        high: { low: 1n, high: 0n },
      };
      const result = uint256Simulator.add(a, b);
      expect(result.low.low).toBe(0n);
      expect(result.low.high).toBe(0n);
      expect(result.high.low).toBe(0n);
      expect(result.high.high).toBe(1n);
    });
  });

  describe('sub', () => {
    test('should subtract two small numbers', () => {
      const a = toU256(10n);
      const b = toU256(4n);
      const result = uint256Simulator.sub(a, b);
      expect(fromU256(result)).toBe(6n);
    });

    test('should subtract max U256 minus 1', () => {
      const a = toU256(MAX_UINT256);
      const b = toU256(1n);
      const result = uint256Simulator.sub(a, b);
      expect(fromU256(result)).toBe(MAX_UINT256 - 1n);
    });

    test('should throw on underflow', () => {
      const a = toU256(3n);
      const b = toU256(5n);
      expect(() => uint256Simulator.sub(a, b)).toThrowError(
        'failed assert: MathU256: subtraction underflow',
      );
    });

    test('should handle zero', () => {
      const five = toU256(5n);
      const zero = toU256(0n);
      const result = uint256Simulator.sub(five, zero);
      expect(fromU256(result)).toBe(5n);
      expect(() => uint256Simulator.sub(zero, five)).toThrowError(
        'failed assert: MathU256: subtraction underflow',
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
      const result = uint256Simulator.sub(a, b);
      expect(result.low.low).toBe(MAX_UINT64);
      expect(result.low.high).toBe(MAX_UINT64);
      expect(result.high.low).toBe(0n);
      expect(result.high.high).toBe(0n);
    });

    test('should handle zero subtraction', () => {
      const a = toU256(5n);
      const b = uint256Simulator.ZERO_U256();
      const result = uint256Simulator.sub(a, b);
      expect(fromU256(result)).toBe(5n);
    });

    test('should handle equal values', () => {
      const a = toU256(5n);
      const b = toU256(5n);
      const result = uint256Simulator.sub(a, b);
      expect(fromU256(result)).toBe(0n);
      expect(uint256Simulator.isZero(result)).toBe(true);
    });

    test('should handle max - max = 0', () => {
      const max = toU256(MAX_UINT256);
      const result = uint256Simulator.sub(max, max);
      expect(fromU256(result)).toBe(0n);
      expect(uint256Simulator.isZero(result)).toBe(true);
    });

    test('should handle large value subtraction', () => {
      const a = toU256(2n ** 200n);
      const b = toU256(2n ** 100n);
      const result = uint256Simulator.sub(a, b);
      expect(fromU256(result)).toBe(2n ** 200n - 2n ** 100n);
    });

    test('should handle subtraction resulting in value with only high part', () => {
      const a = toU256(2n ** 128n);
      const b = toU256(1n);
      const result = uint256Simulator.sub(a, b);
      expect(fromU256(result)).toBe(2n ** 128n - 1n);
      expect(result.low.low).toBe(MAX_UINT64);
      expect(result.low.high).toBe(MAX_UINT64);
      expect(result.high.low).toBe(0n);
    });

    test('should handle borrow propagating through all limbs', () => {
      // 2^192 - 1 (borrow from high.high)
      const a: U256 = {
        low: { low: 0n, high: 0n },
        high: { low: 0n, high: 1n },
      };
      const b: U256 = {
        low: { low: 1n, high: 0n },
        high: { low: 0n, high: 0n },
      };
      const result = uint256Simulator.sub(a, b);
      expect(result.low.low).toBe(MAX_UINT64);
      expect(result.low.high).toBe(MAX_UINT64);
      expect(result.high.low).toBe(MAX_UINT64);
      expect(result.high.high).toBe(0n);
    });

    test('should handle subtraction requiring borrow from only high.high', () => {
      const a: U256 = {
        low: { low: 0n, high: 0n },
        high: { low: 0n, high: 2n },
      };
      const b: U256 = {
        low: { low: 0n, high: 0n },
        high: { low: 0n, high: 1n },
      };
      const result = uint256Simulator.sub(a, b);
      expect(result.low.low).toBe(0n);
      expect(result.low.high).toBe(0n);
      expect(result.high.low).toBe(0n);
      expect(result.high.high).toBe(1n);
    });
  });

  describe('mul', () => {
    test('should multiply small numbers', () => {
      const a = toU256(4n);
      const b = toU256(3n);
      const result = uint256Simulator.mul(a, b);
      expect(fromU256(result)).toBe(12n);
    });

    test('should multiply max U128 by 1', () => {
      const a = toU256(MAX_UINT128);
      const b = toU256(1n);
      const result = uint256Simulator.mul(a, b);
      expect(fromU256(result)).toBe(MAX_UINT128);
    });

    test('should handle large multiplication', () => {
      const a = toU256(MAX_UINT128);
      const b = toU256(2n);
      const result = uint256Simulator.mul(a, b);
      expect(fromU256(result)).toBe(MAX_UINT128 * 2n);
    });

    test('should handle zero', () => {
      const five = toU256(5n);
      const zero = toU256(0n);
      const result = uint256Simulator.mul(five, zero);
      expect(fromU256(result)).toBe(0n);
      const result2 = uint256Simulator.mul(zero, toU256(MAX_UINT128));
      expect(fromU256(result2)).toBe(0n);
    });

    test('should handle zero multiplication (a = 0)', () => {
      const a = uint256Simulator.ZERO_U256();
      const b = toU256(5n);
      const result = uint256Simulator.mul(a, b);
      expect(uint256Simulator.isZero(result)).toBe(true);
    });

    test('should handle zero multiplication (b = 0)', () => {
      const a = toU256(5n);
      const b = uint256Simulator.ZERO_U256();
      const result = uint256Simulator.mul(a, b);
      expect(uint256Simulator.isZero(result)).toBe(true);
    });

    test('should handle multiplication by one (a = 1)', () => {
      const a = toU256(1n);
      const b = toU256(5n);
      const result = uint256Simulator.mul(a, b);
      expect(fromU256(result)).toBe(5n);
    });

    test('should handle multiplication by one (b = 1)', () => {
      const a = toU256(5n);
      const b = toU256(1n);
      const result = uint256Simulator.mul(a, b);
      expect(fromU256(result)).toBe(5n);
    });

    test('should handle equal values', () => {
      const a = toU256(5n);
      const b = toU256(5n);
      const result = uint256Simulator.mul(a, b);
      expect(fromU256(result)).toBe(25n);
    });

    test('should handle general multiplication with carry', () => {
      const a = toU256(MAX_UINT128);
      const b = toU256(2n);
      const result = uint256Simulator.mul(a, b);
      expect(fromU256(result)).toBe(MAX_UINT128 * 2n);
    });

    test('should handle multiplication of MAX_U256 by 1', () => {
      const a = toU256(MAX_UINT256);
      const b = toU256(1n);
      const result = uint256Simulator.mul(a, b);
      expect(fromU256(result)).toBe(MAX_UINT256);
    });

    test('should throw on overflow', () => {
      const a = toU256(MAX_UINT256);
      const b = toU256(2n);
      expect(() => uint256Simulator.mul(a, b)).toThrowError(
        'failed assert: MathU256: multiplication overflow',
      );
    });

    test('should handle squaring a number', () => {
      const a = toU256(1000n);
      const result = uint256Simulator.mul(a, a);
      expect(fromU256(result)).toBe(1000000n);
    });

    test('should handle large squaring', () => {
      const a = toU256(2n ** 64n);
      const result = uint256Simulator.mul(a, a);
      expect(fromU256(result)).toBe(2n ** 128n);
    });

    test('should handle values at limb boundaries', () => {
      const a = toU256(2n ** 64n); // Second limb only
      const b = toU256(2n ** 64n);
      const result = uint256Simulator.mul(a, b);
      expect(fromU256(result)).toBe(2n ** 128n);
    });

    test('should handle maximum non-overflowing multiplication', () => {
      // sqrt(MAX_U256) * sqrt(MAX_U256) should be close to but not exceed MAX_U256
      const sqrtMax = 340282366920938463463374607431768211455n; // floor(sqrt(2^256 - 1))
      const a = toU256(sqrtMax);
      const result = uint256Simulator.mul(a, a);
      expect(fromU256(result)).toBeLessThanOrEqual(MAX_UINT256);
    });

    test('should handle multiplication where only cross terms contribute', () => {
      // Test case where a.low * b.high and a.high * b.low are the main contributors
      // But result stays within U256 bounds
      const a: U256 = {
        low: { low: 0n, high: 2n ** 16n }, // a = 2^16 * 2^64 = 2^80
        high: { low: 0n, high: 0n },
      };
      const b: U256 = {
        low: { low: 0n, high: 0n },
        high: { low: 2n ** 16n, high: 0n }, // b = 2^16 * 2^128 = 2^144
      };
      const result = uint256Simulator.mul(a, b);
      // a * b = 2^80 * 2^144 = 2^224 (within U256 range)
      expect(fromU256(result)).toBe(2n ** 224n);
    });

    test('should throw when cross terms cause overflow', () => {
      // This is the case you had - it actually overflows!
      const a: U256 = {
        low: { low: 0n, high: 2n ** 32n }, // a = 2^96
        high: { low: 0n, high: 0n },
      };
      const b: U256 = {
        low: { low: 0n, high: 0n },
        high: { low: 2n ** 32n, high: 0n }, // b = 2^160
      };
      // a * b = 2^96 * 2^160 = 2^256 → OVERFLOW!
      expect(() => uint256Simulator.mul(a, b)).toThrowError(
        'failed assert: MathU256: multiplication overflow',
      );
    });

    test('should handle case where a.high != 0 and b.high != 0 causes immediate overflow', () => {
      // When both high parts are non-zero, hh will be non-zero
      const a: U256 = {
        low: { low: 0n, high: 0n },
        high: { low: 1n, high: 0n },
      };
      const b: U256 = {
        low: { low: 0n, high: 0n },
        high: { low: 1n, high: 0n },
      };
      // a = 2^128, b = 2^128, a*b = 2^256 → OVERFLOW!
      expect(() => uint256Simulator.mul(a, b)).toThrowError(
        'failed assert: MathU256: multiplication overflow',
      );
    });

    test('should handle maximum safe cross-term multiplication', () => {
      const value = 2n ** 32n - 1n; // Just under 2^32
      const a: U256 = {
        low: { low: 0n, high: value }, // a = value * 2^64
        high: { low: 0n, high: 0n },
      };
      const b: U256 = {
        low: { low: 0n, high: 0n },
        high: { low: value, high: 0n }, // b = value * 2^128
      };
      const result = uint256Simulator.mul(a, b);

      // a * b = value * 2^64 * value * 2^128 = value^2 * 2^192
      const expected = value ** 2n * 2n ** 192n;
      expect(fromU256(result)).toBe(expected);
      expect(expected).toBeLessThan(2n ** 256n);
    });

    test('should handle case where hh is zero but cross terms are large', () => {
      // a.high = 0 or b.high = 0, so hh = 0, but cross terms create large result
      const a: U256 = {
        low: { low: 0n, high: MAX_UINT64 },
        high: { low: 0n, high: 0n },
      };
      const b: U256 = {
        low: { low: MAX_UINT64, high: 0n },
        high: { low: 0n, high: 0n },
      };
      const result = uint256Simulator.mul(a, b);
      // a = MAX_UINT64 * 2^64, b = MAX_UINT64
      // a * b = (2^64-1) * 2^64 * (2^64-1) = (2^64-1)^2 * 2^64
      expect(fromU256(result)).toBe(MAX_UINT64 ** 2n * 2n ** 64n);
    });

    test('should handle hh non-zero but result still valid', () => {
      // Edge case where a.high * b.high != 0 but product < 2^256
      const sqrtMaxDiv2 = 170141183460469231731687303715884105727n; // floor(sqrt(2^256 - 1) / 2)
      const a = toU256(sqrtMaxDiv2);
      const b = toU256(2n);
      const result = uint256Simulator.mul(a, b);
      expect(fromU256(result)).toBeLessThanOrEqual(MAX_UINT256);
    });
  });

  describe('div', () => {
    test('should divide small numbers', () => {
      const a = toU256(10n);
      const b = toU256(3n);
      const quotient = uint256Simulator.div(a, b);
      expect(fromU256(quotient)).toBe(3n);
    });

    test('should divide max U256 by 1', () => {
      const a = toU256(MAX_UINT256);
      const b = toU256(1n);
      const quotient = uint256Simulator.div(a, b);
      expect(fromU256(quotient)).toBe(MAX_UINT256);
    });

    test('should throw on division by zero', () => {
      const a = toU256(5n);
      const b = uint256Simulator.ZERO_U256();
      expect(() => uint256Simulator.div(a, b)).toThrowError(
        'failed assert: MathU256: division by zero',
      );
    });

    test('should handle dividend is zero', () => {
      const a = uint256Simulator.ZERO_U256();
      const b = toU256(5n);
      const quotient = uint256Simulator.div(a, b);
      expect(uint256Simulator.isZero(quotient)).toBe(true);
    });

    test('should handle division with remainder', () => {
      const a = toU256(100n);
      const b = toU256(7n);
      const quotient = uint256Simulator.div(a, b);
      expect(fromU256(quotient)).toBe(14n);
    });

    test('should handle exact division', () => {
      const a = toU256(100n);
      const b = toU256(25n);
      const quotient = uint256Simulator.div(a, b);
      expect(fromU256(quotient)).toBe(4n);
    });

    test('should handle large value division', () => {
      const a = toU256(2n ** 200n);
      const b = toU256(2n ** 100n);
      const quotient = uint256Simulator.div(a, b);
      expect(fromU256(quotient)).toBe(2n ** 100n);
    });

    test('should handle dividend equals divisor', () => {
      const a = toU256(12345n);
      const b = toU256(12345n);
      const quotient = uint256Simulator.div(a, b);
      expect(fromU256(quotient)).toBe(1n);
    });

    test('should handle dividend less than divisor', () => {
      const a = toU256(3n);
      const b = toU256(5n);
      const quotient = uint256Simulator.div(a, b);
      expect(fromU256(quotient)).toBe(0n);
    });

    test('div: should fail when remainder >= divisor', () => {
      uint256Simulator.overrideWitness('wit_divU256Locally', (context) => [
        context.privateState,
        { quotient: toU256(1n), remainder: toU256(10n) },
      ]);
      const a = toU256(20n);
      const b = toU256(5n);
      expect(() => uint256Simulator.div(a, b)).toThrow(
        'failed assert: MathU256: remainder error',
      );
    });

    test('div: should fail when quotient * b + remainder != a', () => {
      uint256Simulator.overrideWitness('wit_divU256Locally', (context) => [
        context.privateState,
        { quotient: toU256(1n), remainder: toU256(2n) },
      ]);
      const a = toU256(20n);
      const b = toU256(5n);
      expect(() => uint256Simulator.div(a, b)).toThrow(
        'failed assert: MathU256: division invalid',
      );
    });

    test('div: should handle quotient with specific limb patterns', () => {
      // Quotient has value only in high.high
      const a = toU256(2n ** 200n);
      const b = toU256(2n ** 8n);
      const quotient = uint256Simulator.div(a, b);
      expect(fromU256(quotient)).toBe(2n ** 192n);
      expect(quotient.high.high).toBeGreaterThan(0n);
    });
  });

  describe('rem', () => {
    test('should compute remainder of small numbers', () => {
      const a = toU256(10n);
      const b = toU256(3n);
      const remainder = uint256Simulator.rem(a, b);
      expect(fromU256(remainder)).toBe(1n);
    });

    test('should compute remainder of max U256 by 2', () => {
      const a = toU256(MAX_UINT256);
      const b = toU256(2n);
      const remainder = uint256Simulator.rem(a, b);
      expect(fromU256(remainder)).toBe(1n);
    });

    test('should throw on division by zero', () => {
      const a = toU256(5n);
      const b = uint256Simulator.ZERO_U256();
      expect(() => uint256Simulator.rem(a, b)).toThrowError(
        'failed assert: MathU256: division by zero',
      );
    });

    test('should handle zero remainder', () => {
      const a = toU256(6n);
      const b = toU256(3n);
      const remainder = uint256Simulator.rem(a, b);
      expect(fromU256(remainder)).toBe(0n);
    });

    test('should handle dividend is zero', () => {
      const a = uint256Simulator.ZERO_U256();
      const b = toU256(5n);
      const remainder = uint256Simulator.rem(a, b);
      expect(uint256Simulator.isZero(remainder)).toBe(true);
    });

    test('should handle divisor is one', () => {
      const a = toU256(10n);
      const b = toU256(1n);
      const remainder = uint256Simulator.rem(a, b);
      expect(uint256Simulator.isZero(remainder)).toBe(true);
    });

    test('should handle dividend equals divisor', () => {
      const a = toU256(5n);
      const b = toU256(5n);
      const remainder = uint256Simulator.rem(a, b);
      expect(uint256Simulator.isZero(remainder)).toBe(true);
    });

    test('should handle dividend less than divisor', () => {
      const a = toU256(3n);
      const b = toU256(5n);
      const remainder = uint256Simulator.rem(a, b);
      expect(fromU256(remainder)).toBe(3n);
    });

    test('should fail when remainder >= divisor', () => {
      uint256Simulator.overrideWitness('wit_divU256Locally', (context) => [
        context.privateState,
        { quotient: toU256(0n), remainder: toU256(10n) },
      ]);
      const a = toU256(10n);
      const b = toU256(5n);
      expect(() => uint256Simulator.rem(a, b)).toThrow(
        'failed assert: MathU256: remainder error',
      );
    });

    test('should fail when quotient * b + remainder != a', () => {
      uint256Simulator.overrideWitness('wit_divU256Locally', (context) => [
        context.privateState,
        { quotient: toU256(1n), remainder: toU256(2n) },
      ]);
      const a = toU256(8n);
      const b = toU256(5n);
      expect(() => uint256Simulator.rem(a, b)).toThrow(
        'failed assert: MathU256: division invalid',
      );
    });

    test('should handle remainder close to divisor', () => {
      const a = toU256(100n);
      const b = toU256(7n);
      const remainder = uint256Simulator.rem(a, b);
      expect(fromU256(remainder)).toBe(2n); // 100 % 7 = 2
      expect(fromU256(remainder)).toBeLessThan(7n);
    });
  });

  describe('divRem', () => {
    test('should compute quotient and remainder of small numbers', () => {
      const a = toU256(10n);
      const b = toU256(3n);
      const result = uint256Simulator.divRem(a, b);
      expect(fromU256(result.quotient)).toBe(3n);
      expect(fromU256(result.remainder)).toBe(1n);
    });

    test('should compute quotient and remainder of max U256 by 2', () => {
      const a = toU256(MAX_UINT256);
      const b = toU256(2n);
      const result = uint256Simulator.divRem(a, b);
      expect(fromU256(result.quotient)).toBe(MAX_UINT256 / 2n);
      expect(fromU256(result.remainder)).toBe(1n);
    });

    test('should throw on division by zero', () => {
      const a = toU256(5n);
      const b = uint256Simulator.ZERO_U256();
      expect(() => uint256Simulator.divRem(a, b)).toThrowError(
        'failed assert: MathU256: division by zero',
      );
    });

    test('should handle zero remainder', () => {
      const a = toU256(6n);
      const b = toU256(3n);
      const result = uint256Simulator.divRem(a, b);
      expect(fromU256(result.quotient)).toBe(2n);
      expect(fromU256(result.remainder)).toBe(0n);
    });

    test('should handle dividend is zero', () => {
      const a = uint256Simulator.ZERO_U256();
      const b = toU256(5n);
      const result = uint256Simulator.divRem(a, b);
      expect(uint256Simulator.isZero(result.quotient)).toBe(true);
      expect(uint256Simulator.isZero(result.remainder)).toBe(true);
    });

    test('should handle divisor is one', () => {
      const a = toU256(10n);
      const b = toU256(1n);
      const result = uint256Simulator.divRem(a, b);
      expect(fromU256(result.quotient)).toBe(10n);
      expect(uint256Simulator.isZero(result.remainder)).toBe(true);
    });

    test('should handle dividend equals divisor', () => {
      const a = toU256(5n);
      const b = toU256(5n);
      const result = uint256Simulator.divRem(a, b);
      expect(fromU256(result.quotient)).toBe(1n);
      expect(uint256Simulator.isZero(result.remainder)).toBe(true);
    });

    test('should handle dividend less than divisor', () => {
      const a = toU256(3n);
      const b = toU256(5n);
      const result = uint256Simulator.divRem(a, b);
      expect(uint256Simulator.isZero(result.quotient)).toBe(true);
      expect(fromU256(result.remainder)).toBe(3n);
    });

    test('divRem: should fail when remainder >= divisor', () => {
      uint256Simulator.overrideWitness('wit_divU256Locally', (context) => [
        context.privateState,
        { quotient: toU256(3n), remainder: toU256(9n) },
      ]);
      const a = toU256(24n);
      const b = toU256(8n);
      expect(() => uint256Simulator.divRem(a, b)).toThrow(
        'failed assert: MathU256: remainder error',
      );
    });

    test('divRem: should fail when quotient * b + remainder != a', () => {
      uint256Simulator.overrideWitness('wit_divU256Locally', (context) => [
        context.privateState,
        { quotient: toU256(3n), remainder: toU256(2n) },
      ]);
      const a = toU256(25n);
      const b = toU256(8n);
      expect(() => uint256Simulator.divRem(a, b)).toThrow(
        'failed assert: MathU256: division invalid',
      );
    });
  });

  describe('sqrt', () => {
    test('should handle zero', () => {
      const zero = uint256Simulator.ZERO_U256();
      expect(uint256Simulator.sqrt(zero)).toBe(0n);
    });

    test('should handle one', () => {
      expect(uint256Simulator.sqrt(toU256(1n))).toBe(1n);
    });

    test('should handle small non-perfect squares', () => {
      expect(uint256Simulator.sqrt(toU256(2n))).toBe(1n); // floor(sqrt(2)) ≈ 1.414
      expect(uint256Simulator.sqrt(toU256(3n))).toBe(1n); // floor(sqrt(3)) ≈ 1.732
    });

    test('should handle small perfect squares', () => {
      expect(uint256Simulator.sqrt(toU256(4n))).toBe(2n);
      expect(uint256Simulator.sqrt(toU256(9n))).toBe(3n);
      expect(uint256Simulator.sqrt(toU256(16n))).toBe(4n);
    });

    test('should handle maximum values', () => {
      expect(uint256Simulator.sqrt(toU256(MAX_UINT8))).toBe(15n);
      expect(uint256Simulator.sqrt(toU256(MAX_UINT16))).toBe(255n);
      expect(uint256Simulator.sqrt(toU256(MAX_UINT32))).toBe(65535n);
      expect(uint256Simulator.sqrt(toU256(MAX_UINT64))).toBe(4294967295n);
      expect(uint256Simulator.sqrt(toU256(MAX_UINT128))).toBe(
        18446744073709551615n,
      );
      expect(uint256Simulator.sqrt(toU256(MAX_UINT256))).toBe(
        340282366920938463463374607431768211455n,
      );
    });

    test('should handle large perfect square', () => {
      expect(uint256Simulator.sqrt(toU256(1000000n))).toBe(1000n);
    });

    test('should handle large non-perfect square', () => {
      expect(uint256Simulator.sqrt(toU256(100000001n))).toBe(10000n); // floor(sqrt(100000001)) ≈ 10000.00005
    });

    test('should handle perfect squares at various sizes', () => {
      expect(uint256Simulator.sqrt(toU256(100n))).toBe(10n);
      expect(uint256Simulator.sqrt(toU256(10000n))).toBe(100n);
      expect(uint256Simulator.sqrt(toU256(2n ** 100n))).toBe(2n ** 50n);
      expect(uint256Simulator.sqrt(toU256(2n ** 200n))).toBe(2n ** 100n);
    });

    test('should handle values just above perfect squares', () => {
      expect(uint256Simulator.sqrt(toU256(101n))).toBe(10n); // floor(sqrt(101)) = 10
      expect(uint256Simulator.sqrt(toU256(10001n))).toBe(100n); // floor(sqrt(10001)) = 100
      expect(uint256Simulator.sqrt(toU256(26n))).toBe(5n); // floor(sqrt(26)) = 5
    });

    test('should handle values just below perfect squares', () => {
      expect(uint256Simulator.sqrt(toU256(99n))).toBe(9n); // floor(sqrt(99)) = 9
      expect(uint256Simulator.sqrt(toU256(9999n))).toBe(99n); // floor(sqrt(9999)) = 99
      expect(uint256Simulator.sqrt(toU256(24n))).toBe(4n); // floor(sqrt(24)) = 4
    });

    test('sqrt: should fail if malicious witness overestimates root', () => {
      uint256Simulator.overrideWitness('wit_sqrtU256Locally', (context) => [
        context.privateState,
        3n,
      ]);
      const a = toU256(8n);
      expect(() => uint256Simulator.sqrt(a)).toThrow(
        'failed assert: MathU256: sqrt overestimate',
      );
    });

    test('sqrt: should fail if malicious witness underestimates root', () => {
      uint256Simulator.overrideWitness('wit_sqrtU256Locally', (context) => [
        context.privateState,
        1n,
      ]);
      const a = toU256(5n);
      expect(() => uint256Simulator.sqrt(a)).toThrow(
        'failed assert: MathU256: sqrt underestimate',
      );
    });

    test('sqrt: should handle MAX_UINT256 where root+1 overflows', () => {
      // This is the edge case where root = 2^128 - 1
      // and root+1 = 2^128 would overflow U128
      const max = toU256(MAX_UINT256);
      const result = uint256Simulator.sqrt(max);
      expect(result).toBe(MAX_UINT128); // sqrt(2^256 - 1) = 2^128 - 1

      // Verify the mathematical property manually
      const rootBigInt = 340282366920938463463374607431768211455n; // 2^128 - 1
      const rootSquared = rootBigInt * rootBigInt;
      expect(rootSquared).toBeLessThanOrEqual(MAX_UINT256);

      const rootPlus1Squared = (rootBigInt + 1n) * (rootBigInt + 1n);
      expect(rootPlus1Squared).toBeGreaterThan(MAX_UINT256); // Would be 2^256
    });

    test('sqrt: should handle values where root is exactly at limb boundaries', () => {
      // root = 2^64 exactly
      expect(uint256Simulator.sqrt(toU256(2n ** 128n))).toBe(2n ** 64n);

      // root = 2^96
      expect(uint256Simulator.sqrt(toU256(2n ** 192n))).toBe(2n ** 96n);
    });
  });

  describe('min', () => {
    test('should return minimum of small numbers', () => {
      const a = toU256(5n);
      const b = toU256(3n);
      const result = uint256Simulator.min(a, b);
      expect(fromU256(result)).toBe(3n);
      expect(fromU256(uint256Simulator.min(b, a))).toBe(3n);
      expect(fromU256(uint256Simulator.min(a, a))).toBe(5n);
    });

    test('should handle max U256', () => {
      const max = toU256(MAX_UINT256);
      const one = toU256(1n);
      const result = uint256Simulator.min(max, one);
      expect(fromU256(result)).toBe(1n);
      expect(fromU256(uint256Simulator.min(max, max))).toBe(MAX_UINT256);
    });

    test('should handle zero', () => {
      const zero = toU256(0n);
      const five = toU256(5n);
      const result = uint256Simulator.min(zero, five);
      expect(fromU256(result)).toBe(0n);
      expect(fromU256(uint256Simulator.min(five, zero))).toBe(0n);
    });
  });

  describe('max', () => {
    test('should return maximum of small numbers', () => {
      const a = toU256(5n);
      const b = toU256(3n);
      const result = uint256Simulator.max(a, b);
      expect(fromU256(result)).toBe(5n);
      expect(fromU256(uint256Simulator.max(b, a))).toBe(5n);
      expect(fromU256(uint256Simulator.max(a, a))).toBe(5n);
    });

    test('should handle max U256', () => {
      const max = toU256(MAX_UINT256);
      const one = toU256(1n);
      const result = uint256Simulator.max(max, one);
      expect(fromU256(result)).toBe(MAX_UINT256);
      expect(fromU256(uint256Simulator.max(max, max))).toBe(MAX_UINT256);
    });

    test('should handle zero', () => {
      const zero = toU256(0n);
      const five = toU256(5n);
      const result = uint256Simulator.max(zero, five);
      expect(fromU256(result)).toBe(5n);
      expect(fromU256(uint256Simulator.max(five, zero))).toBe(5n);
    });
  });

  describe('isZero', () => {
    test('should return true for zero', () => {
      const zero = uint256Simulator.ZERO_U256();
      expect(uint256Simulator.isZero(zero)).toBe(true);
    });

    test('should return false for non-zero', () => {
      const one = toU256(1n);
      expect(uint256Simulator.isZero(one)).toBe(false);
      const max = toU256(MAX_UINT256);
      expect(uint256Simulator.isZero(max)).toBe(false);
    });
  });

  describe('isExceedingFieldSize', () => {
    test('should return false for values within field size', () => {
      const smallValue = toU256(123n);
      expect(uint256Simulator.isExceedingFieldSize(smallValue)).toBe(false);

      const maxFieldValue = toU256(2n ** 254n - 1n);
      expect(uint256Simulator.isExceedingFieldSize(maxFieldValue)).toBe(false);

      const zero = toU256(0n);
      expect(uint256Simulator.isExceedingFieldSize(zero)).toBe(false);
    });

    test('should return true for values exceeding field size', () => {
      const exceedingValue = toU256(2n ** 254n);
      expect(uint256Simulator.isExceedingFieldSize(exceedingValue)).toBe(true);

      const maxU256Value = toU256(MAX_UINT256);
      expect(uint256Simulator.isExceedingFieldSize(maxU256Value)).toBe(true);

      const largeValue = toU256(2n ** 255n);
      expect(uint256Simulator.isExceedingFieldSize(largeValue)).toBe(true);
    });

    test('should handle edge cases at field boundary', () => {
      const atFieldLimit = toU256(2n ** 254n - 1n);
      expect(uint256Simulator.isExceedingFieldSize(atFieldLimit)).toBe(false);

      const justAboveFieldLimit = toU256(2n ** 254n);
      expect(uint256Simulator.isExceedingFieldSize(justAboveFieldLimit)).toBe(
        true,
      );
    });

    test('should handle values with high bits set', () => {
      const highBitValue = toU256(2n ** 253n + 2n ** 252n);
      expect(uint256Simulator.isExceedingFieldSize(highBitValue)).toBe(false);

      const exceedingHighBitValue = toU256(2n ** 254n + 2n ** 253n);
      expect(uint256Simulator.isExceedingFieldSize(exceedingHighBitValue)).toBe(
        true,
      );
    });

    test('should handle zero and small values', () => {
      const zero = toU256(0n);
      expect(uint256Simulator.isExceedingFieldSize(zero)).toBe(false);

      const one = toU256(1n);
      expect(uint256Simulator.isExceedingFieldSize(one)).toBe(false);

      const smallValue = toU256(1000n);
      expect(uint256Simulator.isExceedingFieldSize(smallValue)).toBe(false);
    });

    test('should handle large values within field size', () => {
      const largeValue = toU256(2n ** 253n - 1n);
      expect(uint256Simulator.isExceedingFieldSize(largeValue)).toBe(false);

      const nearMaxField = toU256(2n ** 254n - 1000n);
      expect(uint256Simulator.isExceedingFieldSize(nearMaxField)).toBe(false);
    });

    test('should handle values just above field size', () => {
      const justAbove = toU256(2n ** 254n + 1n);
      expect(uint256Simulator.isExceedingFieldSize(justAbove)).toBe(true);

      const muchAbove = toU256(2n ** 255n);
      expect(uint256Simulator.isExceedingFieldSize(muchAbove)).toBe(true);

      const maxU256 = toU256(MAX_UINT256);
      expect(uint256Simulator.isExceedingFieldSize(maxU256)).toBe(true);
    });

    test('should handle exactly 2^254', () => {
      const exactly254 = toU256(2n ** 254n);
      expect(uint256Simulator.isExceedingFieldSize(exactly254)).toBe(true);
    });

    test('should handle values with bit 254 and 255 set', () => {
      const bothBitsSet = toU256(2n ** 255n + 2n ** 254n);
      expect(uint256Simulator.isExceedingFieldSize(bothBitsSet)).toBe(true);
    });
  });

  describe('isLowestLimbOnly', () => {
    test('should return true for zero', () => {
      const zero = uint256Simulator.ZERO_U256();
      expect(uint256Simulator.isLowestLimbOnly(zero, 0n)).toBe(true);
    });

    test('should return true when only lowest limb has matching value', () => {
      const val: U256 = {
        low: { low: 42n, high: 0n },
        high: { low: 0n, high: 0n },
      };
      expect(uint256Simulator.isLowestLimbOnly(val, 42n)).toBe(true);
      expect(uint256Simulator.isLowestLimbOnly(val, 43n)).toBe(false);
    });

    test('should return false when other limbs are non-zero', () => {
      const val: U256 = {
        low: { low: 42n, high: 1n },
        high: { low: 0n, high: 0n },
      };
      expect(uint256Simulator.isLowestLimbOnly(val, 42n)).toBe(false);
    });

    test('should return false for non-zero limbValue on zero struct', () => {
      const one = toU256(1n);
      expect(uint256Simulator.isLowestLimbOnly(one, 0n)).toBe(false);
      const max = toU256(MAX_UINT256);
      expect(uint256Simulator.isLowestLimbOnly(max, 0n)).toBe(false);
    });
  });

  describe('isSecondLimbOnly', () => {
    test('should return true for zero', () => {
      const zero = uint256Simulator.ZERO_U256();
      expect(uint256Simulator.isSecondLimbOnly(zero, 0n)).toBe(true);
    });

    test('should return true when only second limb has matching value', () => {
      const val: U256 = {
        low: { low: 0n, high: 42n },
        high: { low: 0n, high: 0n },
      };
      expect(uint256Simulator.isSecondLimbOnly(val, 42n)).toBe(true);
      expect(uint256Simulator.isSecondLimbOnly(val, 43n)).toBe(false);
    });

    test('should return false when other limbs are non-zero', () => {
      const val: U256 = {
        low: { low: 1n, high: 42n },
        high: { low: 0n, high: 0n },
      };
      expect(uint256Simulator.isSecondLimbOnly(val, 42n)).toBe(false);
    });

    test('should return false for non-zero limbValue on non-matching struct', () => {
      const one = toU256(1n);
      expect(uint256Simulator.isSecondLimbOnly(one, 0n)).toBe(false);
      const max = toU256(MAX_UINT256);
      expect(uint256Simulator.isSecondLimbOnly(max, 0n)).toBe(false);
    });
  });

  describe('isThirdLimbOnly', () => {
    test('should return true for zero', () => {
      const zero = uint256Simulator.ZERO_U256();
      expect(uint256Simulator.isThirdLimbOnly(zero, 0n)).toBe(true);
    });

    test('should return true when only third limb has matching value', () => {
      const val: U256 = {
        low: { low: 0n, high: 0n },
        high: { low: 42n, high: 0n },
      };
      expect(uint256Simulator.isThirdLimbOnly(val, 42n)).toBe(true);
      expect(uint256Simulator.isThirdLimbOnly(val, 43n)).toBe(false);
    });

    test('should return false when other limbs are non-zero', () => {
      const val: U256 = {
        low: { low: 0n, high: 0n },
        high: { low: 42n, high: 1n },
      };
      expect(uint256Simulator.isThirdLimbOnly(val, 42n)).toBe(false);
    });

    test('should return false for non-zero limbValue on non-matching struct', () => {
      const one = toU256(1n);
      expect(uint256Simulator.isThirdLimbOnly(one, 0n)).toBe(false);
      const max = toU256(MAX_UINT256);
      expect(uint256Simulator.isThirdLimbOnly(max, 0n)).toBe(false);
    });
  });

  describe('isHighestLimbOnly', () => {
    test('should return true for zero', () => {
      const zero = uint256Simulator.ZERO_U256();
      expect(uint256Simulator.isHighestLimbOnly(zero, 0n)).toBe(true);
    });

    test('should return true when only highest limb has matching value', () => {
      const val: U256 = {
        low: { low: 0n, high: 0n },
        high: { low: 0n, high: 42n },
      };
      expect(uint256Simulator.isHighestLimbOnly(val, 42n)).toBe(true);
      expect(uint256Simulator.isHighestLimbOnly(val, 43n)).toBe(false);
    });

    test('should return false when other limbs are non-zero', () => {
      const val: U256 = {
        low: { low: 1n, high: 0n },
        high: { low: 0n, high: 42n },
      };
      expect(uint256Simulator.isHighestLimbOnly(val, 42n)).toBe(false);
    });

    test('should return false for non-zero limbValue on non-matching struct', () => {
      const one = toU256(1n);
      expect(uint256Simulator.isHighestLimbOnly(one, 0n)).toBe(false);
      const max = toU256(MAX_UINT256);
      expect(uint256Simulator.isHighestLimbOnly(max, 0n)).toBe(false);
    });
  });

  describe('isMultiple', () => {
    test('should check if small number is multiple', () => {
      expect(uint256Simulator.isMultiple(toU256(6n), toU256(3n))).toBe(true);
      expect(uint256Simulator.isMultiple(toU256(7n), toU256(3n))).toBe(false);
    });

    test('should check max U256 is multiple of 1', () => {
      const max = toU256(MAX_UINT256);
      const one = toU256(1n);
      expect(uint256Simulator.isMultiple(max, one)).toBe(true);
    });

    test('should throw on division by zero', () => {
      const five = toU256(5n);
      const zero = toU256(0n);
      expect(() => uint256Simulator.isMultiple(five, zero)).toThrowError(
        'failed assert: MathU256: division by zero',
      );
    });

    test('should handle large divisors', () => {
      const max = toU256(MAX_UINT256);
      const maxMinusOne = toU256(MAX_UINT256 - 1n);
      expect(uint256Simulator.isMultiple(max, max)).toBe(true);
      expect(uint256Simulator.isMultiple(maxMinusOne, max)).toBe(false);
    });

    test('should handle zero value', () => {
      const zero = toU256(0n);
      const five = toU256(5n);
      // 0 is a multiple of any non-zero number
      expect(uint256Simulator.isMultiple(zero, five)).toBe(true);
    });

    test('should handle powers of 2', () => {
      expect(
        uint256Simulator.isMultiple(toU256(2n ** 128n), toU256(2n ** 64n)),
      ).toBe(true);
      expect(
        uint256Simulator.isMultiple(toU256(2n ** 100n), toU256(2n ** 50n)),
      ).toBe(true);
      expect(uint256Simulator.isMultiple(toU256(2n ** 100n), toU256(3n))).toBe(
        false,
      );
    });

    test('should handle value equals divisor', () => {
      const val = toU256(12345n);
      expect(uint256Simulator.isMultiple(val, val)).toBe(true);
    });

    test('should handle value < divisor', () => {
      expect(uint256Simulator.isMultiple(toU256(3n), toU256(5n))).toBe(false);
    });

    test('should handle large prime divisors', () => {
      const prime = 1000000007n; // Large prime
      expect(
        uint256Simulator.isMultiple(toU256(prime * 3n), toU256(prime)),
      ).toBe(true);
      expect(
        uint256Simulator.isMultiple(toU256(prime * 3n + 1n), toU256(prime)),
      ).toBe(false);
    });
  });

  describe('MAX_UINT254', () => {
    test('should return U256 with max Uint<254> values', () => {
      const result = uint256Simulator.MAX_UINT254();
      expect(result.low.low).toBe(18446744073709551615n);
      expect(result.low.high).toBe(18446744073709551615n);
      expect(result.high.low).toBe(18446744073709551615n);
      expect(result.high.high).toBe(4611686018427387903n);
    });
  });

  describe('MAX_U256', () => {
    test('should return U256 with max values', () => {
      const result = uint256Simulator.MAX_U256();
      expect(result.low.low).toBe(18446744073709551615n);
      expect(result.low.high).toBe(18446744073709551615n);
      expect(result.high.low).toBe(18446744073709551615n);
      expect(result.high.high).toBe(18446744073709551615n);
    });
  });
});
