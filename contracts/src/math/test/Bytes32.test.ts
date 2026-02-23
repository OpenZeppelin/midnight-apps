import type { U256 } from '@src/artifacts/math/test/mocks/contracts/Bytes32.mock/contract/index.js';
import { Bytes32Simulator } from '@src/math/test/mocks/Bytes32Simulator.js';
import {
  MAX_UINT64,
  MAX_UINT128,
  MAX_UINT256,
} from '@src/math/utils/consts.js';
import { beforeEach, describe, expect, test } from 'vitest';

let bytes32Simulator: Bytes32Simulator;

const setup = () => {
  bytes32Simulator = new Bytes32Simulator();
};

/**
 * Create 32-element vector from bigint (little-endian bytes).
 */
const toVec32 = (value: bigint): bigint[] => {
  const vec = new Array<bigint>(32).fill(0n);
  for (let i = 0; i < 32; i++) {
    vec[i] = (value >> (8n * BigInt(i))) & 0xffn;
  }
  return vec;
};

const fromU256 = (u: U256): bigint =>
  u.low.low +
  (u.low.high << 64n) +
  (u.high.low << 128n) +
  (u.high.high << 192n);

describe('Bytes32', () => {
  beforeEach(setup);

  describe('pack', () => {
    test('should convert zero vector to zero bytes', () => {
      const vec = toVec32(0n);
      const result = bytes32Simulator.pack(vec);
      expect(result).toEqual(new Uint8Array(32).fill(0));
    });

    test('should match vector elements as bytes', () => {
      const value = 1234567890123456789012345678901234567890n;
      const vec = toVec32(value);
      const result = bytes32Simulator.pack(vec);
      expect(result.length).toBe(32);
      for (let i = 0; i < 32; i++) {
        expect(result[i]).toBe(Number(vec[i]));
      }
    });

    test('should roundtrip with vectorToU256', () => {
      const value = MAX_UINT128 + (1n << 128n);
      const vec = toVec32(value);
      const u256 = bytes32Simulator.vectorToU256(vec);
      const bytes = bytes32Simulator.pack(vec);
      expect(fromU256(u256)).toBe(value);
      let back = 0n;
      for (let i = 0; i < 32; i++) {
        back += BigInt(bytes[i]) << (8n * BigInt(i));
      }
      expect(back).toBe(value);
    });
  });

  describe('unpack', () => {
    test('should unpack bytes to vector matching pack roundtrip', () => {
      const value = 0x0123456789abcdefn;
      const vec = toVec32(value);
      const bytes = bytes32Simulator.pack(vec);
      const unpacked = bytes32Simulator.unpack(bytes);
      expect(unpacked).toEqual(vec);
    });

    test('should unpack zero bytes to zero vector', () => {
      const bytes = new Uint8Array(32).fill(0);
      const unpacked = bytes32Simulator.unpack(bytes);
      expect(unpacked).toEqual(new Array(32).fill(0n));
    });

    test('should fail when witness returns pack(vec) != bytes', () => {
      bytes32Simulator.overrideWitness(
        'wit_unpackBytes32',
        (context, _bytes) => [
          context.privateState,
          new Array<bigint>(32).fill(0n),
        ],
      );
      const bytes = new Uint8Array(32);
      bytes[0] = 1;
      expect(() => bytes32Simulator.unpack(bytes)).toThrow(
        'failed assert: Bytes32: unpack verification failed',
      );
    });

    test('bytesToU256 should fail when witness returns pack(vec) != bytes', () => {
      bytes32Simulator.overrideWitness(
        'wit_unpackBytes32',
        (context, _bytes) => [
          context.privateState,
          new Array<bigint>(32).fill(0n),
        ],
      );
      const bytes = new Uint8Array(32);
      bytes[0] = 1;
      expect(() => bytes32Simulator.bytesToU256(bytes)).toThrow(
        'failed assert: Bytes32: unpack verification failed',
      );
    });
  });

  describe('vectorToU256', () => {
    test('should convert zero vector to zero U256', () => {
      const vec = toVec32(0n);
      const result = bytes32Simulator.vectorToU256(vec);
      expect(fromU256(result)).toBe(0n);
    });

    test('should convert small value in first limb only', () => {
      const vec = toVec32(0x0123456789abcdefn);
      const result = bytes32Simulator.vectorToU256(vec);
      expect(fromU256(result)).toBe(0x0123456789abcdefn);
    });

    test('should convert value spanning all 4 limbs', () => {
      const value = 1n + (2n << 64n) + (3n << 128n) + (4n << 192n);
      const vec = toVec32(value);
      const result = bytes32Simulator.vectorToU256(vec);
      expect(fromU256(result)).toBe(value);
    });

    test('should convert MAX_U256 all-0xFF vector', () => {
      const vec = new Array<bigint>(32).fill(255n);
      const result = bytes32Simulator.vectorToU256(vec);
      expect(result.low.low).toBe(MAX_UINT64);
      expect(result.low.high).toBe(MAX_UINT64);
      expect(result.high.low).toBe(MAX_UINT64);
      expect(result.high.high).toBe(MAX_UINT64);
      expect(fromU256(result)).toBe(MAX_UINT256);
    });

    test('should place byte at limb boundary (byte 8)', () => {
      const vec = new Array<bigint>(32).fill(0n);
      vec[8] = 1n;
      const result = bytes32Simulator.vectorToU256(vec);
      expect(fromU256(result)).toBe(1n << 64n);
    });

    test('should place byte at limb boundary (byte 16)', () => {
      const vec = new Array<bigint>(32).fill(0n);
      vec[16] = 1n;
      const result = bytes32Simulator.vectorToU256(vec);
      expect(fromU256(result)).toBe(1n << 128n);
    });

    test('should place byte at limb boundary (byte 24)', () => {
      const vec = new Array<bigint>(32).fill(0n);
      vec[24] = 1n;
      const result = bytes32Simulator.vectorToU256(vec);
      expect(fromU256(result)).toBe(1n << 192n);
    });
  });

  describe('bytesToU256', () => {
    test('should convert zero bytes to zero U256', () => {
      const bytes = new Uint8Array(32).fill(0);
      const result = bytes32Simulator.bytesToU256(bytes);
      expect(fromU256(result)).toBe(0n);
    });

    test('should convert small value in first limb only', () => {
      const value = 0x0123456789abcdefn;
      const bytes = bytes32Simulator.pack(toVec32(value));
      const result = bytes32Simulator.bytesToU256(bytes);
      expect(fromU256(result)).toBe(value);
    });

    test('should convert value spanning all 4 limbs', () => {
      const value = 1n + (2n << 64n) + (3n << 128n) + (4n << 192n);
      const bytes = bytes32Simulator.pack(toVec32(value));
      const result = bytes32Simulator.bytesToU256(bytes);
      expect(fromU256(result)).toBe(value);
    });

    test('should convert MAX_U256 all-0xFF bytes', () => {
      const bytes = bytes32Simulator.pack(new Array<bigint>(32).fill(255n));
      const result = bytes32Simulator.bytesToU256(bytes);
      expect(result.low.low).toBe(MAX_UINT64);
      expect(result.low.high).toBe(MAX_UINT64);
      expect(result.high.low).toBe(MAX_UINT64);
      expect(result.high.high).toBe(MAX_UINT64);
      expect(fromU256(result)).toBe(MAX_UINT256);
    });

    test('should place byte at limb boundary (byte 8)', () => {
      const vec = new Array<bigint>(32).fill(0n);
      vec[8] = 1n;
      const bytes = bytes32Simulator.pack(vec);
      const result = bytes32Simulator.bytesToU256(bytes);
      expect(fromU256(result)).toBe(1n << 64n);
    });

    test('should place byte at limb boundary (byte 16)', () => {
      const vec = new Array<bigint>(32).fill(0n);
      vec[16] = 1n;
      const bytes = bytes32Simulator.pack(vec);
      const result = bytes32Simulator.bytesToU256(bytes);
      expect(fromU256(result)).toBe(1n << 128n);
    });

    test('should place byte at limb boundary (byte 24)', () => {
      const vec = new Array<bigint>(32).fill(0n);
      vec[24] = 1n;
      const bytes = bytes32Simulator.pack(vec);
      const result = bytes32Simulator.bytesToU256(bytes);
      expect(fromU256(result)).toBe(1n << 192n);
    });
  });
});
