import { Vector8Simulator } from '@src/math/test/mocks/Vector8Simulator.js';
import { MAX_UINT64 } from '@src/math/utils/consts.js';
import { beforeEach, describe, expect, test } from 'vitest';

let vector8Simulator: Vector8Simulator;

const setup = () => {
  vector8Simulator = new Vector8Simulator();
};

type Vec8 = [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint];

const vec = (...bytes: number[]): Vec8 => {
  const a = [...bytes];
  while (a.length < 8) a.push(0);
  return a.map((x) => BigInt(x)) as Vec8;
};

describe('Vector8', () => {
  beforeEach(setup);

  describe('toUint64', () => {
    test('should convert zero vector to zero', () => {
      expect(vector8Simulator.toUint64(vec(0, 0, 0, 0, 0, 0, 0, 0))).toBe(0n);
    });

    test('should place single byte at b0', () => {
      expect(vector8Simulator.toUint64(vec(0xab))).toBe(0xabn);
    });

    test('should place single byte at b1 through b7', () => {
      expect(vector8Simulator.toUint64(vec(0, 1))).toBe(0x100n);
      expect(vector8Simulator.toUint64(vec(0, 0, 1))).toBe(0x10000n);
      expect(vector8Simulator.toUint64(vec(0, 0, 0, 1))).toBe(0x1000000n);
      expect(vector8Simulator.toUint64(vec(0, 0, 0, 0, 1))).toBe(0x100000000n);
      expect(vector8Simulator.toUint64(vec(0, 0, 0, 0, 0, 1))).toBe(
        0x10000000000n,
      );
      expect(vector8Simulator.toUint64(vec(0, 0, 0, 0, 0, 0, 1))).toBe(
        0x1000000000000n,
      );
      expect(vector8Simulator.toUint64(vec(0, 0, 0, 0, 0, 0, 0, 1))).toBe(
        0x100000000000000n,
      );
    });

    test('should convert MAX_UINT64 all-0xFF vector', () => {
      const allFF: Vec8 = [255n, 255n, 255n, 255n, 255n, 255n, 255n, 255n];
      expect(vector8Simulator.toUint64(allFF)).toBe(MAX_UINT64);
    });

    test('should convert arbitrary multi-byte value', () => {
      const v = vec(0xef, 0xcd, 0xab, 0x89, 0x67, 0x45, 0x23, 0x01);
      expect(vector8Simulator.toUint64(v)).toBe(0x0123456789abcdefn);
    });
  });

  describe('toBytes', () => {
    test('should convert zero vector to zero bytes', () => {
      const result = vector8Simulator.toBytes(vec(0, 0, 0, 0, 0, 0, 0, 0));
      expect(result).toEqual(new Uint8Array(8).fill(0));
    });

    test('should match vector elements as bytes', () => {
      const v = vec(1, 2, 3, 4, 5, 6, 7, 8);
      const result = vector8Simulator.toBytes(v);
      expect(result.length).toBe(8);
      for (let i = 0; i < 8; i++) {
        expect(result[i]).toBe(Number(v[i]));
      }
    });

    test('should roundtrip with toUint64', () => {
      const v = vec(0xef, 0xcd, 0xab, 0x89, 0x67, 0x45, 0x23, 0x01);
      const asU64 = vector8Simulator.toUint64(v);
      const backBytes = vector8Simulator.toBytes(v);
      expect(asU64).toBe(0x0123456789abcdefn);
      const fromBack = Array.from(backBytes).reduce(
        (acc, b, i) => acc + (BigInt(b) << (8n * BigInt(i))),
        0n,
      );
      expect(fromBack).toBe(asU64);
    });
  });
});
