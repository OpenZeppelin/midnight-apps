import { Bytes8Simulator } from '@src/math/test/mocks/Bytes8Simulator.js';
import { MAX_UINT64 } from '@src/math/utils/consts.js';
import { beforeEach, describe, expect, test } from 'vitest';

let bytes8Simulator: Bytes8Simulator;

const setup = () => {
  bytes8Simulator = new Bytes8Simulator();
};

type Bytes8 = [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint];

const bytes = (...values: number[]): Bytes8 => {
  const a = [...values];
  while (a.length < 8) a.push(0);
  return a.map((x) => BigInt(x)) as Bytes8;
};

describe('Bytes8', () => {
  beforeEach(setup);

  describe('toUint64', () => {
    test('should convert zero bytes to zero', () => {
      expect(bytes8Simulator.toUint64(bytes(0, 0, 0, 0, 0, 0, 0, 0))).toBe(0n);
    });

    test('should place single byte at b0', () => {
      expect(bytes8Simulator.toUint64(bytes(0xab))).toBe(0xabn);
    });

    test('should place single byte at b1 through b7', () => {
      expect(bytes8Simulator.toUint64(bytes(0, 1))).toBe(0x100n);
      expect(bytes8Simulator.toUint64(bytes(0, 0, 1))).toBe(0x10000n);
      expect(bytes8Simulator.toUint64(bytes(0, 0, 0, 1))).toBe(0x1000000n);
      expect(bytes8Simulator.toUint64(bytes(0, 0, 0, 0, 1))).toBe(0x100000000n);
      expect(bytes8Simulator.toUint64(bytes(0, 0, 0, 0, 0, 1))).toBe(
        0x10000000000n,
      );
      expect(bytes8Simulator.toUint64(bytes(0, 0, 0, 0, 0, 0, 1))).toBe(
        0x1000000000000n,
      );
      expect(bytes8Simulator.toUint64(bytes(0, 0, 0, 0, 0, 0, 0, 1))).toBe(
        0x100000000000000n,
      );
    });

    test('should convert MAX_UINT64 all-0xFF bytes', () => {
      const allFF: Bytes8 = [255n, 255n, 255n, 255n, 255n, 255n, 255n, 255n];
      expect(bytes8Simulator.toUint64(allFF)).toBe(MAX_UINT64);
    });

    test('should convert arbitrary multi-byte value', () => {
      const b = bytes(0xef, 0xcd, 0xab, 0x89, 0x67, 0x45, 0x23, 0x01);
      expect(bytes8Simulator.toUint64(b)).toBe(0x0123456789abcdefn);
    });
  });
});
