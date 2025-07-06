import { beforeEach, describe, expect, test } from 'vitest';
import { MaxSimulator } from './MaxSimulator';

let maxSimulator: MaxSimulator;

const setup = () => {
  maxSimulator = new MaxSimulator();
};

describe('Max', () => {
  beforeEach(setup);

  describe('MAX_UINT8', () => {
    test('should return 255', () => {
      expect(maxSimulator.MAX_UINT8()).toBe(255n);
    });
  });

  describe('MAX_UINT16', () => {
    test('should return 65535', () => {
      expect(maxSimulator.MAX_UINT16()).toBe(65535n);
    });
  });

  describe('MAX_UINT32', () => {
    test('should return 4294967295', () => {
      expect(maxSimulator.MAX_UINT32()).toBe(4294967295n);
    });
  });

  describe('MAX_UINT64', () => {
    test('should return 18446744073709551615', () => {
      expect(maxSimulator.MAX_UINT64()).toBe(18446744073709551615n);
    });
  });

  describe('MAX_UINT128', () => {
    test('should return 340282366920938463463374607431768211455', () => {
      expect(maxSimulator.MAX_UINT128()).toBe(
        340282366920938463463374607431768211455n,
      );
    });
  });

  describe('MAX_FIELD', () => {
    test('should return 28948022309329048855892746252171976963317496166410141009864396001978282409983', () => {
      expect(maxSimulator.MAX_FIELD()).toBe(
        28948022309329048855892746252171976963317496166410141009864396001978282409983n,
      );
    });
  });

  describe('MAX_UINT254', () => {
    test('should return U256 with max Uint<254> values', () => {
      const result = maxSimulator.MAX_UINT254();
      expect(result.low.low).toBe(18446744073709551615n);
      expect(result.low.high).toBe(18446744073709551615n);
      expect(result.high.low).toBe(18446744073709551615n);
      expect(result.high.high).toBe(4611686018427387903n);
    });
  });

  describe('MAX_U128', () => {
    test('should return U128 with max values', () => {
      const result = maxSimulator.MAX_U128();
      expect(result.low).toBe(18446744073709551615n);
      expect(result.high).toBe(18446744073709551615n);
    });
  });

  describe('MAX_U256', () => {
    test('should return U256 with max values', () => {
      const result = maxSimulator.MAX_U256();
      expect(result.low.low).toBe(18446744073709551615n);
      expect(result.low.high).toBe(18446744073709551615n);
      expect(result.high.low).toBe(18446744073709551615n);
      expect(result.high.high).toBe(18446744073709551615n);
    });
  });
});
