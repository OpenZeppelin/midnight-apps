import { beforeEach, describe, expect, test } from 'vitest';
import { FIELD_MODULUS, fromU256, toU256 } from '../utils/u256.js';
import { Field254Simulator } from './mocks/Field254Simulator.js';

let field254Simulator: Field254Simulator;

const setup = () => {
  field254Simulator = new Field254Simulator();
};

/**
 * TODO: Fix in a separate PR
 *
 * These tests are skipped because Field255.compact is archived due to Compact Uint limitations:
 * - v0.26.0: Max Uint<254> — Field values >= 2^254 truncated
 * - v0.27.0: Max Uint<248> (31 bytes) — Field values >= 2^248 truncated
 *
 * The JubJub scalar field requires 255 bits, but Compact cannot represent values >= 2^248.
 * See Field255.compact.archive for full details.
 */
describe.skip('Field254', () => {
  beforeEach(setup);

  describe('isZero', () => {
    test('should return true for zero', () => {
      expect(field254Simulator.isZero(0n)).toBe(true);
    });

    test('should return false for non-zero values', () => {
      expect(field254Simulator.isZero(1n)).toBe(false);
      expect(field254Simulator.isZero(123n)).toBe(false);
      expect(field254Simulator.isZero(FIELD_MODULUS)).toBe(false);
    });
  });

  describe('fromField and toField', () => {
    test('should convert field values correctly', () => {
      const testValues = [0n, 1n, 123n, 1000n, FIELD_MODULUS];

      for (const value of testValues) {
        const u256 = field254Simulator.fromField(value);
        const backToField = field254Simulator.toField(u256);
        expect(backToField).toBe(value);
      }
    });

    test('should handle U256 conversion correctly', () => {
      const u256 = toU256(123n);
      const field = field254Simulator.toField(u256);
      const backToU256 = field254Simulator.fromField(field);
      expect(fromU256(backToU256)).toBe(123n);
    });

    test('should throw error for values exceeding field size', () => {
      const exceedingValue = 2n ** 254n;
      expect(() => field254Simulator.toField(toU256(exceedingValue))).toThrow(
        'failed assert: MathU256: fromU256() - value exceeds 254 bits',
      );
    });

    test('should handle values at field boundary', () => {
      const atFieldLimit = FIELD_MODULUS;
      const u256 = field254Simulator.fromField(atFieldLimit);
      const backToField = field254Simulator.toField(u256);
      expect(backToField).toBe(atFieldLimit);
    });

    test('should throw error for values just above field boundary', () => {
      const justAboveField = FIELD_MODULUS + 1n;
      expect(() => field254Simulator.toField(toU256(justAboveField))).toThrow(
        'failed assert: MathU256: fromU256() - value exceeds 254 bits',
      );
    });
  });

  describe('eq', () => {
    test('should compare equal values', () => {
      expect(field254Simulator.eq(123n, 123n)).toBe(true);
      expect(field254Simulator.eq(0n, 0n)).toBe(true);
      expect(field254Simulator.eq(FIELD_MODULUS, FIELD_MODULUS)).toBe(true);
    });

    test('should compare different values', () => {
      expect(field254Simulator.eq(123n, 124n)).toBe(false);
      expect(field254Simulator.eq(0n, 1n)).toBe(false);
      expect(field254Simulator.eq(1n, 0n)).toBe(false);
    });
  });

  describe('lt', () => {
    test('should compare small numbers', () => {
      expect(field254Simulator.lt(5n, 10n)).toBe(true);
      expect(field254Simulator.lt(10n, 5n)).toBe(false);
      expect(field254Simulator.lt(5n, 5n)).toBe(false);
    });

    test('should handle zero', () => {
      expect(field254Simulator.lt(0n, 1n)).toBe(true);
      expect(field254Simulator.lt(0n, 0n)).toBe(false);
      expect(field254Simulator.lt(1n, 0n)).toBe(false);
    });

    test('should handle field modulus', () => {
      expect(field254Simulator.lt(FIELD_MODULUS - 1n, FIELD_MODULUS)).toBe(
        true,
      );
      expect(field254Simulator.lt(FIELD_MODULUS, FIELD_MODULUS)).toBe(false);
      expect(field254Simulator.lt(FIELD_MODULUS, FIELD_MODULUS - 1n)).toBe(
        false,
      );
    });
  });

  describe('lte', () => {
    test('should compare small numbers', () => {
      expect(field254Simulator.lte(5n, 10n)).toBe(true);
      expect(field254Simulator.lte(10n, 5n)).toBe(false);
      expect(field254Simulator.lte(5n, 5n)).toBe(true);
    });

    test('should handle zero', () => {
      expect(field254Simulator.lte(0n, 1n)).toBe(true);
      expect(field254Simulator.lte(0n, 0n)).toBe(true);
      expect(field254Simulator.lte(1n, 0n)).toBe(false);
    });
  });

  describe('gt', () => {
    test('should compare small numbers', () => {
      expect(field254Simulator.gt(10n, 5n)).toBe(true);
      expect(field254Simulator.gt(5n, 10n)).toBe(false);
      expect(field254Simulator.gt(5n, 5n)).toBe(false);
    });

    test('should handle zero', () => {
      expect(field254Simulator.gt(1n, 0n)).toBe(true);
      expect(field254Simulator.gt(0n, 0n)).toBe(false);
      expect(field254Simulator.gt(0n, 1n)).toBe(false);
    });
  });

  describe('gte', () => {
    test('should compare small numbers', () => {
      expect(field254Simulator.gte(10n, 5n)).toBe(true);
      expect(field254Simulator.gte(5n, 10n)).toBe(false);
      expect(field254Simulator.gte(5n, 5n)).toBe(true);
    });

    test('should handle zero', () => {
      expect(field254Simulator.gte(1n, 0n)).toBe(true);
      expect(field254Simulator.gte(0n, 0n)).toBe(true);
      expect(field254Simulator.gte(0n, 1n)).toBe(false);
    });
  });

  describe('add', () => {
    test('should add small numbers', () => {
      expect(field254Simulator.add(5n, 3n)).toBe(8n);
      expect(field254Simulator.add(0n, 0n)).toBe(0n);
      expect(field254Simulator.add(1n, 0n)).toBe(1n);
      expect(field254Simulator.add(0n, 1n)).toBe(1n);
    });

    test('should handle field arithmetic', () => {
      // Test addition that doesn't overflow field
      expect(field254Simulator.add(FIELD_MODULUS - 1n, 1n)).toBe(FIELD_MODULUS);
      expect(field254Simulator.add(FIELD_MODULUS, 0n)).toBe(FIELD_MODULUS);
    });

    test('should handle large numbers', () => {
      const large1 = FIELD_MODULUS - 1000n;
      const large2 = 500n;
      const result = field254Simulator.add(large1, large2);
      expect(result).toBe(FIELD_MODULUS - 500n);
    });
  });

  describe('sub', () => {
    test('should subtract small numbers', () => {
      expect(field254Simulator.sub(10n, 3n)).toBe(7n);
      expect(field254Simulator.sub(5n, 5n)).toBe(0n);
      expect(field254Simulator.sub(0n, 0n)).toBe(0n);
    });

    test('should handle field arithmetic', () => {
      expect(field254Simulator.sub(FIELD_MODULUS, 1n)).toBe(FIELD_MODULUS - 1n);
      expect(field254Simulator.sub(FIELD_MODULUS, 0n)).toBe(FIELD_MODULUS);
    });

    test('should throw on underflow', () => {
      expect(() => field254Simulator.sub(5n, 10n)).toThrow();
    });
  });

  describe('mul', () => {
    test('should multiply small numbers', () => {
      expect(field254Simulator.mul(5n, 3n)).toBe(15n);
      expect(field254Simulator.mul(0n, 5n)).toBe(0n);
      expect(field254Simulator.mul(5n, 0n)).toBe(0n);
      expect(field254Simulator.mul(1n, 5n)).toBe(5n);
      expect(field254Simulator.mul(5n, 1n)).toBe(5n);
    });

    test('should handle field arithmetic', () => {
      expect(field254Simulator.mul(FIELD_MODULUS, 1n)).toBe(FIELD_MODULUS);
      expect(field254Simulator.mul(1n, FIELD_MODULUS)).toBe(FIELD_MODULUS);
    });

    test('should handle large numbers', () => {
      const large1 = 1000n;
      const large2 = 2000n;
      const result = field254Simulator.mul(large1, large2);
      expect(result).toBe(2000000n);
    });
  });

  describe('div', () => {
    test('should divide small numbers', () => {
      expect(field254Simulator.div(10n, 2n)).toBe(5n);
      expect(field254Simulator.div(15n, 3n)).toBe(5n);
      expect(field254Simulator.div(0n, 5n)).toBe(0n);
    });

    test('should handle division by one', () => {
      expect(field254Simulator.div(123n, 1n)).toBe(123n);
      expect(field254Simulator.div(FIELD_MODULUS, 1n)).toBe(FIELD_MODULUS);
    });

    test('should throw on division by zero', () => {
      expect(() => field254Simulator.div(5n, 0n)).toThrow();
    });

    test('should handle exact division', () => {
      expect(field254Simulator.div(100n, 10n)).toBe(10n);
      expect(field254Simulator.div(100n, 25n)).toBe(4n);
    });

    test('should handle division with remainder', () => {
      expect(field254Simulator.div(10n, 3n)).toBe(3n);
      expect(field254Simulator.div(11n, 3n)).toBe(3n);
    });
  });

  describe('rem', () => {
    test('should compute remainder for small numbers', () => {
      expect(field254Simulator.rem(10n, 3n)).toBe(1n);
      expect(field254Simulator.rem(11n, 3n)).toBe(2n);
      expect(field254Simulator.rem(12n, 3n)).toBe(0n);
    });

    test('should handle remainder with zero', () => {
      expect(field254Simulator.rem(0n, 5n)).toBe(0n);
    });

    test('should throw on division by zero', () => {
      expect(() => field254Simulator.rem(5n, 0n)).toThrow();
    });

    test('should handle exact division remainder', () => {
      expect(field254Simulator.rem(100n, 10n)).toBe(0n);
      expect(field254Simulator.rem(100n, 25n)).toBe(0n);
    });
  });

  describe('divRem', () => {
    test('should compute both quotient and remainder', () => {
      const result = field254Simulator.divRem(10n, 3n);
      expect(fromU256(result.quotient)).toBe(3n);
      expect(fromU256(result.remainder)).toBe(1n);
    });

    test('should handle exact division', () => {
      const result = field254Simulator.divRem(100n, 10n);
      expect(fromU256(result.quotient)).toBe(10n);
      expect(fromU256(result.remainder)).toBe(0n);
    });

    test('should verify divRem = div + rem', () => {
      const a = 17n;
      const b = 5n;
      const divResult = field254Simulator.div(a, b);
      const remResult = field254Simulator.rem(a, b);
      const divRemResult = field254Simulator.divRem(a, b);

      expect(fromU256(divRemResult.quotient)).toBe(divResult);
      expect(fromU256(divRemResult.remainder)).toBe(remResult);
    });
  });

  describe('sqrt', () => {
    test('should compute square root of perfect squares', () => {
      expect(field254Simulator.sqrt(0n)).toBe(0n);
      expect(field254Simulator.sqrt(1n)).toBe(1n);
      expect(field254Simulator.sqrt(4n)).toBe(2n);
      expect(field254Simulator.sqrt(9n)).toBe(3n);
      expect(field254Simulator.sqrt(16n)).toBe(4n);
      expect(field254Simulator.sqrt(25n)).toBe(5n);
    });

    test('should compute floor of square root for non-perfect squares', () => {
      expect(field254Simulator.sqrt(2n)).toBe(1n);
      expect(field254Simulator.sqrt(3n)).toBe(1n);
      expect(field254Simulator.sqrt(5n)).toBe(2n);
      expect(field254Simulator.sqrt(6n)).toBe(2n);
      expect(field254Simulator.sqrt(7n)).toBe(2n);
      expect(field254Simulator.sqrt(8n)).toBe(2n);
      expect(field254Simulator.sqrt(10n)).toBe(3n);
    });

    test('should handle large numbers', () => {
      expect(field254Simulator.sqrt(10000n)).toBe(100n);
      expect(field254Simulator.sqrt(1000000n)).toBe(1000n);
    });
  });

  describe('min', () => {
    test('should return minimum of two values', () => {
      expect(field254Simulator.min(5n, 10n)).toBe(5n);
      expect(field254Simulator.min(10n, 5n)).toBe(5n);
      expect(field254Simulator.min(5n, 5n)).toBe(5n);
    });

    test('should handle zero', () => {
      expect(field254Simulator.min(0n, 1n)).toBe(0n);
      expect(field254Simulator.min(1n, 0n)).toBe(0n);
      expect(field254Simulator.min(0n, 0n)).toBe(0n);
    });

    test('should handle large numbers', () => {
      expect(field254Simulator.min(FIELD_MODULUS, FIELD_MODULUS - 1n)).toBe(
        FIELD_MODULUS - 1n,
      );
      expect(field254Simulator.min(FIELD_MODULUS - 1n, FIELD_MODULUS)).toBe(
        FIELD_MODULUS - 1n,
      );
    });
  });

  describe('max', () => {
    test('should return maximum of two values', () => {
      expect(field254Simulator.max(5n, 10n)).toBe(10n);
      expect(field254Simulator.max(10n, 5n)).toBe(10n);
      expect(field254Simulator.max(5n, 5n)).toBe(5n);
    });

    test('should handle zero', () => {
      expect(field254Simulator.max(0n, 1n)).toBe(1n);
      expect(field254Simulator.max(1n, 0n)).toBe(1n);
      expect(field254Simulator.max(0n, 0n)).toBe(0n);
    });

    test('should handle large numbers', () => {
      expect(field254Simulator.max(FIELD_MODULUS, FIELD_MODULUS - 1n)).toBe(
        FIELD_MODULUS,
      );
      expect(field254Simulator.max(FIELD_MODULUS - 1n, FIELD_MODULUS)).toBe(
        FIELD_MODULUS,
      );
    });
  });

  describe('field arithmetic properties', () => {
    test('should maintain field arithmetic properties', () => {
      const a = 123n;
      const b = 456n;
      const c = 789n;

      // Commutativity of addition
      expect(field254Simulator.add(a, b)).toBe(field254Simulator.add(b, a));

      // Commutativity of multiplication
      expect(field254Simulator.mul(a, b)).toBe(field254Simulator.mul(b, a));

      // Associativity of addition
      const leftAssoc = field254Simulator.add(field254Simulator.add(a, b), c);
      const rightAssoc = field254Simulator.add(a, field254Simulator.add(b, c));
      expect(leftAssoc).toBe(rightAssoc);

      // Distributivity
      const leftDist = field254Simulator.mul(a, field254Simulator.add(b, c));
      const rightDist = field254Simulator.add(
        field254Simulator.mul(a, b),
        field254Simulator.mul(a, c),
      );
      expect(leftDist).toBe(rightDist);
    });

    test('should handle division and multiplication inverse', () => {
      const a = 100n;
      const b = 5n;

      const quotient = field254Simulator.div(a, b);
      const remainder = field254Simulator.rem(a, b);
      const reconstructed = field254Simulator.add(
        field254Simulator.mul(quotient, b),
        remainder,
      );

      expect(reconstructed).toBe(a);
    });
  });
});
