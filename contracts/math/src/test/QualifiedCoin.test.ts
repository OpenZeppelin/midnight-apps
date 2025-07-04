import { beforeEach, describe, expect, it } from 'vitest';
import { QualifiedCoinContractSimulator } from './QualifiedCoinSimulator';

describe('QualifiedCoin Module', () => {
  let simulator: QualifiedCoinContractSimulator;

  beforeEach(() => {
    simulator = new QualifiedCoinContractSimulator();
  });

  // ============================================================================
  // CONVERSION FUNCTIONS
  // ============================================================================

  describe('Conversion Functions', () => {
    it('should convert CoinInfo to QualifiedCoinInfo', () => {
      const coin = {
        nonce: new Uint8Array(32),
        color: new Uint8Array(32),
        value: BigInt(100),
      };
      const mt_index = BigInt(5);

      const result = simulator.fromQCoin(coin, mt_index);

      expect(result.nonce).toEqual(coin.nonce);
      expect(result.color).toEqual(coin.color);
      expect(result.value).toBe(coin.value);
      expect(result.mt_index).toBe(mt_index);
    });

    it('should convert QualifiedCoinInfo to CoinInfo', () => {
      const qualifiedCoin = {
        nonce: new Uint8Array(32),
        color: new Uint8Array(32),
        value: BigInt(200),
        mt_index: BigInt(10),
      };

      const result = simulator.toQCoin(qualifiedCoin);

      expect(result.nonce).toEqual(qualifiedCoin.nonce);
      expect(result.color).toEqual(qualifiedCoin.color);
      expect(result.value).toBe(qualifiedCoin.value);
      expect(result).not.toHaveProperty('mt_index');
    });
  });

  // ============================================================================
  // ARITHMETIC OPERATIONS
  // ============================================================================

  describe('Arithmetic Operations', () => {
    const sameColor = new Uint8Array(32);
    sameColor[0] = 1;
    const differentColor = new Uint8Array(32);
    differentColor[0] = 2;

    const qualifiedCoinA = {
      nonce: new Uint8Array(32),
      color: sameColor,
      value: BigInt(100),
      mt_index: BigInt(1),
    };
    const qualifiedCoinB = {
      nonce: new Uint8Array(32),
      color: sameColor,
      value: BigInt(50),
      mt_index: BigInt(2),
    };
    const qualifiedCoinC = {
      nonce: new Uint8Array(32),
      color: differentColor,
      value: BigInt(75),
      mt_index: BigInt(3),
    };

    describe('Addition', () => {
      it('should add values of qualified coins with same color', () => {
        const result = simulator.add(qualifiedCoinA, qualifiedCoinB);

        expect(result.color).toEqual(sameColor);
        expect(result.nonce).toEqual(qualifiedCoinA.nonce);
        expect(result.mt_index).toBe(qualifiedCoinA.mt_index);
        expect(result.value).toBe(BigInt(150)); // 100 + 50
      });

      it('should throw error when adding qualified coins with different colors', () => {
        expect(() => simulator.add(qualifiedCoinA, qualifiedCoinC)).toThrow(
          'colors must be the same',
        );
      });
    });

    describe('Subtraction', () => {
      it('should subtract values of qualified coins with same color', () => {
        const result = simulator.sub(qualifiedCoinA, qualifiedCoinB);

        expect(result.color).toEqual(sameColor);
        expect(result.nonce).toEqual(qualifiedCoinA.nonce);
        expect(result.mt_index).toBe(qualifiedCoinA.mt_index);
        expect(result.value).toBe(BigInt(50)); // 100 - 50
      });

      it('should throw error when subtracting qualified coins with different colors', () => {
        expect(() => simulator.sub(qualifiedCoinA, qualifiedCoinC)).toThrow(
          'colors must be the same',
        );
      });

      it('should throw error when result would be negative', () => {
        expect(() => simulator.sub(qualifiedCoinB, qualifiedCoinA)).toThrow(
          'result would be negative',
        );
      });
    });

    describe('Multiplication', () => {
      it('should multiply values of qualified coins with same color', () => {
        const result = simulator.mul(qualifiedCoinA, qualifiedCoinB);

        expect(result.color).toEqual(sameColor);
        expect(result.nonce).toEqual(qualifiedCoinA.nonce);
        expect(result.mt_index).toBe(qualifiedCoinA.mt_index);
        expect(result.value).toBe(BigInt(5000)); // 100 * 50
      });

      it('should throw error when multiplying qualified coins with different colors', () => {
        expect(() => simulator.mul(qualifiedCoinA, qualifiedCoinC)).toThrow(
          'colors must be the same',
        );
      });
    });

    describe('Division', () => {
      it('should divide values of qualified coins with same color', () => {
        const result = simulator.div(qualifiedCoinA, qualifiedCoinB);

        expect(result.color).toEqual(sameColor);
        expect(result.nonce).toEqual(qualifiedCoinA.nonce);
        expect(result.mt_index).toBe(qualifiedCoinA.mt_index);
        expect(result.value).toBe(BigInt(2)); // 100 / 50
      });

      it('should throw error when dividing qualified coins with different colors', () => {
        expect(() => simulator.div(qualifiedCoinA, qualifiedCoinC)).toThrow(
          'colors must be the same',
        );
      });

      it('should throw error when dividing by zero', () => {
        const zeroCoin = {
          nonce: new Uint8Array(32),
          color: sameColor,
          value: BigInt(0),
          mt_index: BigInt(4),
        };
        expect(() => simulator.div(qualifiedCoinA, zeroCoin)).toThrow(
          'division by zero',
        );
      });
    });

    describe('Division with Remainder', () => {
      it('should return quotient and remainder for qualified coins with same color', () => {
        const result = simulator.divRem(qualifiedCoinA, qualifiedCoinB);

        expect(result.quotient.color).toEqual(sameColor);
        expect(result.quotient.nonce).toEqual(qualifiedCoinA.nonce);
        expect(result.quotient.mt_index).toBe(qualifiedCoinA.mt_index);
        expect(result.quotient.value).toBe(BigInt(2)); // 100 / 50 = 2

        expect(result.remainder.color).toEqual(sameColor);
        expect(result.remainder.nonce).toEqual(qualifiedCoinA.nonce);
        expect(result.remainder.mt_index).toBe(qualifiedCoinA.mt_index);
        expect(result.remainder.value).toBe(BigInt(0)); // 100 % 50 = 0
      });

      it('should handle division with remainder', () => {
        const qualifiedCoinD = {
          nonce: new Uint8Array(32),
          color: sameColor,
          value: BigInt(7),
          mt_index: BigInt(5),
        };
        const qualifiedCoinE = {
          nonce: new Uint8Array(32),
          color: sameColor,
          value: BigInt(3),
          mt_index: BigInt(6),
        };

        const result = simulator.divRem(qualifiedCoinD, qualifiedCoinE);

        expect(result.quotient.value).toBe(BigInt(2)); // 7 / 3 = 2
        expect(result.remainder.value).toBe(BigInt(1)); // 7 % 3 = 1
      });

      it('should throw error when dividing qualified coins with different colors', () => {
        expect(() => simulator.divRem(qualifiedCoinA, qualifiedCoinC)).toThrow(
          'colors must be the same',
        );
      });

      it('should throw error when dividing by zero', () => {
        const zeroCoin = {
          nonce: new Uint8Array(32),
          color: sameColor,
          value: BigInt(0),
          mt_index: BigInt(7),
        };
        expect(() => simulator.divRem(qualifiedCoinA, zeroCoin)).toThrow(
          'division by zero',
        );
      });
    });

    describe('Remainder', () => {
      it('should compute remainder for qualified coins with same color', () => {
        const result = simulator.rem(qualifiedCoinA, qualifiedCoinB);

        expect(result.color).toEqual(sameColor);
        expect(result.nonce).toEqual(qualifiedCoinA.nonce);
        expect(result.mt_index).toBe(qualifiedCoinA.mt_index);
        expect(result.value).toBe(BigInt(0)); // 100 % 50 = 0
      });

      it('should handle remainder when not evenly divisible', () => {
        const qualifiedCoinD = {
          nonce: new Uint8Array(32),
          color: sameColor,
          value: BigInt(7),
          mt_index: BigInt(8),
        };
        const qualifiedCoinE = {
          nonce: new Uint8Array(32),
          color: sameColor,
          value: BigInt(3),
          mt_index: BigInt(9),
        };

        const result = simulator.rem(qualifiedCoinD, qualifiedCoinE);
        expect(result.value).toBe(BigInt(1)); // 7 % 3 = 1
      });

      it('should throw error when computing remainder for qualified coins with different colors', () => {
        expect(() => simulator.rem(qualifiedCoinA, qualifiedCoinC)).toThrow(
          'colors must be the same',
        );
      });

      it('should throw error when dividing by zero', () => {
        const zeroCoin = {
          nonce: new Uint8Array(32),
          color: sameColor,
          value: BigInt(0),
          mt_index: BigInt(10),
        };
        expect(() => simulator.rem(qualifiedCoinA, zeroCoin)).toThrow(
          'division by zero',
        );
      });
    });

    describe('Square Root', () => {
      it('should compute square root of a qualified coin value', () => {
        const perfectSquareCoin = {
          nonce: new Uint8Array(32),
          color: sameColor,
          value: BigInt(100), // 10^2
          mt_index: BigInt(11),
        };

        const result = simulator.sqrt(perfectSquareCoin);

        expect(result.color).toEqual(sameColor);
        expect(result.nonce).toEqual(perfectSquareCoin.nonce);
        expect(result.mt_index).toBe(perfectSquareCoin.mt_index);
        expect(result.value).toBe(BigInt(10)); // sqrt(100) = 10
      });

      it('should handle non-perfect squares', () => {
        const nonPerfectSquareCoin = {
          nonce: new Uint8Array(32),
          color: sameColor,
          value: BigInt(15), // sqrt(15) = 3 (floor)
          mt_index: BigInt(12),
        };

        const result = simulator.sqrt(nonPerfectSquareCoin);
        expect(result.value).toBe(BigInt(3)); // floor(sqrt(15)) = 3
      });

      it('should handle zero value', () => {
        const zeroCoin = {
          nonce: new Uint8Array(32),
          color: sameColor,
          value: BigInt(0),
          mt_index: BigInt(13),
        };

        const result = simulator.sqrt(zeroCoin);
        expect(result.value).toBe(BigInt(0)); // sqrt(0) = 0
      });

      it('should handle large values', () => {
        const largeCoin = {
          nonce: new Uint8Array(32),
          color: sameColor,
          value: BigInt(1000000), // 1000^2
          mt_index: BigInt(14),
        };

        const result = simulator.sqrt(largeCoin);
        expect(result.value).toBe(BigInt(1000)); // sqrt(1000000) = 1000
      });
    });

    describe('Minimum', () => {
      it('should return the qualified coin with minimum value for coins with same color', () => {
        const result = simulator.min(qualifiedCoinA, qualifiedCoinB);

        expect(result.color).toEqual(sameColor);
        expect(result.nonce).toEqual(qualifiedCoinA.nonce);
        expect(result.mt_index).toBe(qualifiedCoinA.mt_index);
        expect(result.value).toBe(BigInt(50)); // min(100, 50) = 50
      });

      it('should return the first qualified coin when values are equal', () => {
        const qualifiedCoinD = {
          nonce: new Uint8Array(32),
          color: sameColor,
          value: BigInt(100),
          mt_index: BigInt(15),
        };

        const result = simulator.min(qualifiedCoinA, qualifiedCoinD);

        expect(result.color).toEqual(sameColor);
        expect(result.nonce).toEqual(qualifiedCoinA.nonce);
        expect(result.mt_index).toBe(qualifiedCoinA.mt_index);
        expect(result.value).toBe(BigInt(100)); // min(100, 100) = 100 (first coin)
      });

      it('should throw error when comparing qualified coins with different colors', () => {
        expect(() => simulator.min(qualifiedCoinA, qualifiedCoinC)).toThrow(
          'colors must be the same',
        );
      });
    });

    describe('Maximum', () => {
      it('should return the qualified coin with maximum value for coins with same color', () => {
        const result = simulator.max(qualifiedCoinA, qualifiedCoinB);

        expect(result.color).toEqual(sameColor);
        expect(result.nonce).toEqual(qualifiedCoinA.nonce);
        expect(result.mt_index).toBe(qualifiedCoinA.mt_index);
        expect(result.value).toBe(BigInt(100)); // max(100, 50) = 100
      });

      it('should return the first qualified coin when values are equal', () => {
        const qualifiedCoinD = {
          nonce: new Uint8Array(32),
          color: sameColor,
          value: BigInt(100),
          mt_index: BigInt(16),
        };

        const result = simulator.max(qualifiedCoinA, qualifiedCoinD);

        expect(result.color).toEqual(sameColor);
        expect(result.nonce).toEqual(qualifiedCoinA.nonce);
        expect(result.mt_index).toBe(qualifiedCoinA.mt_index);
        expect(result.value).toBe(BigInt(100)); // max(100, 100) = 100 (first coin)
      });

      it('should throw error when comparing qualified coins with different colors', () => {
        expect(() => simulator.max(qualifiedCoinA, qualifiedCoinC)).toThrow(
          'colors must be the same',
        );
      });
    });

    describe('Sorting', () => {
      const colorA = new Uint8Array(32);
      colorA[0] = 1;
      const colorB = new Uint8Array(32);
      colorB[0] = 2;
      const qualifiedCoinA = {
        nonce: new Uint8Array(32),
        color: colorA,
        value: BigInt(100),
        mt_index: BigInt(1),
      };
      const qualifiedCoinB = {
        nonce: new Uint8Array(32),
        color: colorB,
        value: BigInt(200),
        mt_index: BigInt(2),
      };

      it('should sort qualified coins in descending order by color (sortGt)', () => {
        const [first, second] = simulator.sortGt(
          qualifiedCoinA,
          qualifiedCoinB,
        );
        expect(first.color[0]).toBe(2);
        expect(second.color[0]).toBe(1);
      });

      it('should sort qualified coins in ascending order by color (sortLt)', () => {
        const [first, second] = simulator.sortLt(
          qualifiedCoinA,
          qualifiedCoinB,
        );
        expect(first.color[0]).toBe(1);
        expect(second.color[0]).toBe(2);
      });

      it('should keep order if colors are equal', () => {
        const qualifiedCoinC = {
          nonce: new Uint8Array(32),
          color: colorA,
          value: BigInt(50),
          mt_index: BigInt(3),
        };
        const [firstGt, secondGt] = simulator.sortGt(
          qualifiedCoinA,
          qualifiedCoinC,
        );
        expect([qualifiedCoinA, qualifiedCoinC]).toContainEqual(firstGt);
        expect([qualifiedCoinA, qualifiedCoinC]).toContainEqual(secondGt);
        expect(firstGt.color).toEqual(secondGt.color);
        const [firstLt, secondLt] = simulator.sortLt(
          qualifiedCoinA,
          qualifiedCoinC,
        );
        expect([qualifiedCoinA, qualifiedCoinC]).toContainEqual(firstLt);
        expect([qualifiedCoinA, qualifiedCoinC]).toContainEqual(secondLt);
        expect(firstLt.color).toEqual(secondLt.color);
      });
    });
  });

  // ============================================================================
  // BOOLEAN OPERATIONS (COMPARISONS)
  // ============================================================================

  describe('Value-based Comparisons', () => {
    const qualifiedCoinA = {
      nonce: new Uint8Array(32),
      color: new Uint8Array(32),
      value: BigInt(100),
      mt_index: BigInt(1),
    };
    const qualifiedCoinB = {
      nonce: new Uint8Array(32),
      color: new Uint8Array(32),
      value: BigInt(200),
      mt_index: BigInt(2),
    };
    const qualifiedCoinC = {
      nonce: new Uint8Array(32),
      color: new Uint8Array(32),
      value: BigInt(100),
      mt_index: BigInt(3),
    };

    it('should compare values for equality', () => {
      expect(simulator.eqValue(qualifiedCoinA, qualifiedCoinB)).toBe(false);
      expect(simulator.eqValue(qualifiedCoinA, qualifiedCoinC)).toBe(true);
    });

    it('should compare values for less than', () => {
      expect(simulator.ltValue(qualifiedCoinA, qualifiedCoinB)).toBe(true);
      expect(simulator.ltValue(qualifiedCoinB, qualifiedCoinA)).toBe(false);
      expect(simulator.ltValue(qualifiedCoinA, qualifiedCoinC)).toBe(false);
    });

    it('should compare values for less than or equal', () => {
      expect(simulator.lteValue(qualifiedCoinA, qualifiedCoinB)).toBe(true);
      expect(simulator.lteValue(qualifiedCoinB, qualifiedCoinA)).toBe(false);
      expect(simulator.lteValue(qualifiedCoinA, qualifiedCoinC)).toBe(true);
    });

    it('should compare values for greater than', () => {
      expect(simulator.gtValue(qualifiedCoinA, qualifiedCoinB)).toBe(false);
      expect(simulator.gtValue(qualifiedCoinB, qualifiedCoinA)).toBe(true);
      expect(simulator.gtValue(qualifiedCoinA, qualifiedCoinC)).toBe(false);
    });

    it('should compare values for greater than or equal', () => {
      expect(simulator.gteValue(qualifiedCoinA, qualifiedCoinB)).toBe(false);
      expect(simulator.gteValue(qualifiedCoinB, qualifiedCoinA)).toBe(true);
      expect(simulator.gteValue(qualifiedCoinA, qualifiedCoinC)).toBe(true);
    });
  });

  describe('Color-based Comparisons', () => {
    const colorA = new Uint8Array(32);
    colorA[0] = 1;
    const colorB = new Uint8Array(32);
    colorB[0] = 2;
    const colorC = new Uint8Array(32);
    colorC[0] = 1;

    const qualifiedCoinA = {
      nonce: new Uint8Array(32),
      color: colorA,
      value: BigInt(100),
      mt_index: BigInt(1),
    };
    const qualifiedCoinB = {
      nonce: new Uint8Array(32),
      color: colorB,
      value: BigInt(100),
      mt_index: BigInt(2),
    };
    const qualifiedCoinC = {
      nonce: new Uint8Array(32),
      color: colorC,
      value: BigInt(100),
      mt_index: BigInt(3),
    };

    it('should compare colors for equality', () => {
      expect(simulator.eqColor(qualifiedCoinA, qualifiedCoinB)).toBe(false);
      expect(simulator.eqColor(qualifiedCoinA, qualifiedCoinC)).toBe(true);
    });

    it('should compare colors for less than (lexicographic)', () => {
      expect(simulator.ltColor(qualifiedCoinA, qualifiedCoinB)).toBe(true);
      expect(simulator.ltColor(qualifiedCoinB, qualifiedCoinA)).toBe(false);
      expect(simulator.ltColor(qualifiedCoinA, qualifiedCoinC)).toBe(false);
    });

    it('should compare colors for less than or equal', () => {
      expect(simulator.lteColor(qualifiedCoinA, qualifiedCoinB)).toBe(true);
      expect(simulator.lteColor(qualifiedCoinB, qualifiedCoinA)).toBe(false);
      expect(simulator.lteColor(qualifiedCoinA, qualifiedCoinC)).toBe(true);
    });

    it('should compare colors for greater than', () => {
      expect(simulator.gtColor(qualifiedCoinA, qualifiedCoinB)).toBe(false);
      expect(simulator.gtColor(qualifiedCoinB, qualifiedCoinA)).toBe(true);
      expect(simulator.gtColor(qualifiedCoinA, qualifiedCoinC)).toBe(false);
    });

    it('should compare colors for greater than or equal', () => {
      expect(simulator.gteColor(qualifiedCoinA, qualifiedCoinB)).toBe(false);
      expect(simulator.gteColor(qualifiedCoinB, qualifiedCoinA)).toBe(true);
      expect(simulator.gteColor(qualifiedCoinA, qualifiedCoinC)).toBe(true);
    });
  });

  describe('Combined Comparisons', () => {
    const qualifiedCoinA = {
      nonce: new Uint8Array(32),
      color: new Uint8Array(32),
      value: BigInt(100),
      mt_index: BigInt(1),
    };
    const qualifiedCoinB = {
      nonce: new Uint8Array(32),
      color: new Uint8Array(32),
      value: BigInt(200),
      mt_index: BigInt(2),
    };
    const qualifiedCoinC = {
      nonce: new Uint8Array(32),
      color: new Uint8Array(32),
      value: BigInt(100),
      mt_index: BigInt(3),
    };

    it('should check complete equality including mt_index', () => {
      expect(simulator.eq(qualifiedCoinA, qualifiedCoinB)).toBe(false);
      expect(simulator.eq(qualifiedCoinA, qualifiedCoinC)).toBe(false); // Different mt_index

      const qualifiedCoinD = {
        nonce: new Uint8Array(32),
        color: new Uint8Array(32),
        value: BigInt(100),
        mt_index: BigInt(1), // Same mt_index as qualifiedCoinA
      };
      expect(simulator.eq(qualifiedCoinA, qualifiedCoinD)).toBe(true);
    });

    it('should check same color', () => {
      expect(simulator.isSameColor(qualifiedCoinA, qualifiedCoinB)).toBe(true);
      expect(simulator.isSameColor(qualifiedCoinA, qualifiedCoinC)).toBe(true);
    });

    it('should check same value', () => {
      expect(simulator.isSameValue(qualifiedCoinA, qualifiedCoinB)).toBe(false);
      expect(simulator.isSameValue(qualifiedCoinA, qualifiedCoinC)).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero values', () => {
      const zeroCoin = {
        nonce: new Uint8Array(32),
        color: new Uint8Array(32),
        value: BigInt(0),
        mt_index: BigInt(1),
      };
      const nonZeroCoin = {
        nonce: new Uint8Array(32),
        color: new Uint8Array(32),
        value: BigInt(100),
        mt_index: BigInt(2),
      };

      expect(simulator.eqValue(zeroCoin, nonZeroCoin)).toBe(false);
      expect(simulator.ltValue(zeroCoin, nonZeroCoin)).toBe(true);
      expect(simulator.gtValue(zeroCoin, nonZeroCoin)).toBe(false);
    });

    it('should handle zero colors', () => {
      const zeroColor = new Uint8Array(32);
      const nonZeroColor = new Uint8Array(32);
      nonZeroColor[0] = 1;

      const qualifiedCoinA = {
        nonce: new Uint8Array(32),
        color: zeroColor,
        value: BigInt(100),
        mt_index: BigInt(1),
      };
      const qualifiedCoinB = {
        nonce: new Uint8Array(32),
        color: nonZeroColor,
        value: BigInt(100),
        mt_index: BigInt(2),
      };

      expect(simulator.eqColor(qualifiedCoinA, qualifiedCoinB)).toBe(false);
      expect(simulator.ltColor(qualifiedCoinA, qualifiedCoinB)).toBe(true);
      expect(simulator.gtColor(qualifiedCoinA, qualifiedCoinB)).toBe(false);
    });

    it('should handle large values', () => {
      const largeCoin = {
        nonce: new Uint8Array(32),
        color: new Uint8Array(32),
        value: BigInt('18446744073709551615'), // 2^64 - 1
        mt_index: BigInt(1),
      };
      const smallCoin = {
        nonce: new Uint8Array(32),
        color: new Uint8Array(32),
        value: BigInt(100),
        mt_index: BigInt(2),
      };

      expect(simulator.gtValue(largeCoin, smallCoin)).toBe(true);
      expect(simulator.ltValue(smallCoin, largeCoin)).toBe(true);
    });
  });
});
