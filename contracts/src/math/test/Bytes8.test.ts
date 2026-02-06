import { Bytes8Simulator } from '@src/math/test/mocks/Bytes8Simulator.js';
import { Uint64Simulator } from '@src/math/test/mocks/Uint64Simulator.js';
import { MAX_UINT64 } from '@src/math/utils/consts.js';
import { beforeEach, describe, expect, test } from 'vitest';

let bytes8Simulator: Bytes8Simulator;
let uint64Simulator: Uint64Simulator;

const setup = () => {
  bytes8Simulator = new Bytes8Simulator();
  uint64Simulator = new Uint64Simulator();
};

/**
 * Create 8-byte array from bigint (little-endian).
 */
const toBytes8 = (value: bigint): Uint8Array => {
  const bytes = new Uint8Array(8);
  for (let i = 0; i < 8; i++) {
    bytes[i] = Number((value >> (8n * BigInt(i))) & 0xffn);
  }
  return bytes;
};

describe('Bytes8', () => {
  beforeEach(setup);

  describe('toUint64', () => {
    test('should convert zero bytes to zero', () => {
      const bytes = new Uint8Array(8).fill(0);
      expect(bytes8Simulator.toUint64(bytes)).toBe(0n);
    });

    test('should convert single byte at position 0', () => {
      const bytes = new Uint8Array(8).fill(0);
      bytes[0] = 0xab;
      expect(bytes8Simulator.toUint64(bytes)).toBe(0xabn);
    });

    test('should convert multi-byte value', () => {
      const value = 0x0123456789abcdefn;
      const bytes = toBytes8(value);
      expect(bytes8Simulator.toUint64(bytes)).toBe(value);
    });

    test('should convert MAX_UINT64 bytes', () => {
      const bytes = new Uint8Array(8).fill(255);
      expect(bytes8Simulator.toUint64(bytes)).toBe(MAX_UINT64);
    });

    test('should roundtrip with Uint64 toBytes', () => {
      const value = 0x0123456789abcdefn;
      const bytesFromUint64 = uint64Simulator.toBytes(value);
      expect(bytes8Simulator.toUint64(bytesFromUint64)).toBe(value);
    });
  });

  describe('toVector', () => {
    test('should convert zero bytes to zero vector', () => {
      const bytes = new Uint8Array(8).fill(0);
      const result = bytes8Simulator.toVector(bytes);
      expect(result).toEqual([0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n]);
    });

    test('should convert single byte to vector', () => {
      const bytes = new Uint8Array(8).fill(0);
      bytes[0] = 123;
      const result = bytes8Simulator.toVector(bytes);
      expect(result[0]).toBe(123n);
      expect(result.slice(1).every((b) => b === 0n)).toBe(true);
    });

    test('should convert max bytes to all-0xFF vector', () => {
      const bytes = new Uint8Array(8).fill(255);
      const result = bytes8Simulator.toVector(bytes);
      expect(result).toEqual([255n, 255n, 255n, 255n, 255n, 255n, 255n, 255n]);
    });

    test('should match individual elements to bytes', () => {
      const bytes = toBytes8(0x01_02_03_04_05_06_07_08n);
      const result = bytes8Simulator.toVector(bytes);
      for (let i = 0; i < 8; i++) {
        expect(Number(result[i])).toBe(bytes[i]);
      }
    });
  });
});
