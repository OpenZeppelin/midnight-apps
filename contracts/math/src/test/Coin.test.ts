import { beforeEach, describe, expect, it } from 'vitest';
import { CoinContractSimulator } from './CoinSimulator';

describe('Coin Module', () => {
  let simulator: CoinContractSimulator;

  beforeEach(() => {
    simulator = new CoinContractSimulator();
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

      const result = simulator.fromCoin(coin, mt_index);

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

      const result = simulator.toCoin(qualifiedCoin);

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

    const coinA = {
      nonce: new Uint8Array(32),
      color: sameColor,
      value: BigInt(100),
    };
    const coinB = {
      nonce: new Uint8Array(32),
      color: sameColor,
      value: BigInt(50),
    };
    const coinC = {
      nonce: new Uint8Array(32),
      color: differentColor,
      value: BigInt(75),
    };

    describe('Addition', () => {
      it('should add values of coins with same color', () => {
        const result = simulator.add(coinA, coinB);

        expect(result.color).toEqual(sameColor);
        expect(result.nonce).toEqual(coinA.nonce);
        expect(result.value).toBe(BigInt(150)); // 100 + 50
      });

      it('should throw error when adding coins with different colors', () => {
        expect(() => simulator.add(coinA, coinC)).toThrow(
          'colors must be the same',
        );
      });
    });

    describe('Subtraction', () => {
      it('should subtract values of coins with same color', () => {
        const result = simulator.sub(coinA, coinB);

        expect(result.color).toEqual(sameColor);
        expect(result.nonce).toEqual(coinA.nonce);
        expect(result.value).toBe(BigInt(50)); // 100 - 50
      });

      it('should throw error when subtracting coins with different colors', () => {
        expect(() => simulator.sub(coinA, coinC)).toThrow(
          'colors must be the same',
        );
      });

      it('should throw error when result would be negative', () => {
        expect(() => simulator.sub(coinB, coinA)).toThrow(
          'result would be negative',
        );
      });
    });

    describe('Multiplication', () => {
      it('should multiply values of coins with same color', () => {
        const result = simulator.mul(coinA, coinB);

        expect(result.color).toEqual(sameColor);
        expect(result.nonce).toEqual(coinA.nonce);
        expect(result.value).toBe(BigInt(5000)); // 100 * 50
      });

      it('should throw error when multiplying coins with different colors', () => {
        expect(() => simulator.mul(coinA, coinC)).toThrow(
          'colors must be the same',
        );
      });
    });

    describe('Division', () => {
      it('should divide values of coins with same color', () => {
        const result = simulator.div(coinA, coinB);

        expect(result.color).toEqual(sameColor);
        expect(result.nonce).toEqual(coinA.nonce);
        expect(result.value).toBe(BigInt(2)); // 100 / 50
      });

      it('should throw error when dividing coins with different colors', () => {
        expect(() => simulator.div(coinA, coinC)).toThrow(
          'colors must be the same',
        );
      });

      it('should throw error when dividing by zero', () => {
        const zeroCoin = {
          nonce: new Uint8Array(32),
          color: sameColor,
          value: BigInt(0),
        };
        expect(() => simulator.div(coinA, zeroCoin)).toThrow(
          'division by zero',
        );
      });
    });

    describe('Division with Remainder', () => {
      it('should return quotient and remainder for coins with same color', () => {
        const result = simulator.divRem(coinA, coinB);

        expect(result.quotient.color).toEqual(sameColor);
        expect(result.quotient.nonce).toEqual(coinA.nonce);
        expect(result.quotient.value).toBe(BigInt(2)); // 100 / 50 = 2

        expect(result.remainder.color).toEqual(sameColor);
        expect(result.remainder.nonce).toEqual(coinA.nonce);
        expect(result.remainder.value).toBe(BigInt(0)); // 100 % 50 = 0
      });

      it('should handle division with remainder', () => {
        const coinD = {
          nonce: new Uint8Array(32),
          color: sameColor,
          value: BigInt(7),
        };
        const coinE = {
          nonce: new Uint8Array(32),
          color: sameColor,
          value: BigInt(3),
        };

        const result = simulator.divRem(coinD, coinE);

        expect(result.quotient.value).toBe(BigInt(2)); // 7 / 3 = 2
        expect(result.remainder.value).toBe(BigInt(1)); // 7 % 3 = 1
      });

      it('should throw error when dividing coins with different colors', () => {
        expect(() => simulator.divRem(coinA, coinC)).toThrow(
          'colors must be the same',
        );
      });

      it('should throw error when dividing by zero', () => {
        const zeroCoin = {
          nonce: new Uint8Array(32),
          color: sameColor,
          value: BigInt(0),
        };
        expect(() => simulator.divRem(coinA, zeroCoin)).toThrow(
          'division by zero',
        );
      });
    });

    describe('Remainder', () => {
      it('should compute remainder for coins with same color', () => {
        const result = simulator.rem(coinA, coinB);

        expect(result.color).toEqual(sameColor);
        expect(result.nonce).toEqual(coinA.nonce);
        expect(result.value).toBe(BigInt(0)); // 100 % 50 = 0
      });

      it('should handle remainder when not evenly divisible', () => {
        const coinD = {
          nonce: new Uint8Array(32),
          color: sameColor,
          value: BigInt(7),
        };
        const coinE = {
          nonce: new Uint8Array(32),
          color: sameColor,
          value: BigInt(3),
        };

        const result = simulator.rem(coinD, coinE);
        expect(result.value).toBe(BigInt(1)); // 7 % 3 = 1
      });

      it('should throw error when computing remainder for coins with different colors', () => {
        expect(() => simulator.rem(coinA, coinC)).toThrow(
          'colors must be the same',
        );
      });

      it('should throw error when dividing by zero', () => {
        const zeroCoin = {
          nonce: new Uint8Array(32),
          color: sameColor,
          value: BigInt(0),
        };
        expect(() => simulator.rem(coinA, zeroCoin)).toThrow(
          'division by zero',
        );
      });
    });

    describe('Square Root', () => {
      it('should compute square root of a coin value', () => {
        const perfectSquareCoin = {
          nonce: new Uint8Array(32),
          color: sameColor,
          value: BigInt(100), // 10^2
        };

        const result = simulator.sqrt(perfectSquareCoin);

        expect(result.color).toEqual(sameColor);
        expect(result.nonce).toEqual(perfectSquareCoin.nonce);
        expect(result.value).toBe(BigInt(10)); // sqrt(100) = 10
      });

      it('should handle non-perfect squares', () => {
        const nonPerfectSquareCoin = {
          nonce: new Uint8Array(32),
          color: sameColor,
          value: BigInt(15), // sqrt(15) = 3 (floor)
        };

        const result = simulator.sqrt(nonPerfectSquareCoin);
        expect(result.value).toBe(BigInt(3)); // floor(sqrt(15)) = 3
      });

      it('should handle zero value', () => {
        const zeroCoin = {
          nonce: new Uint8Array(32),
          color: sameColor,
          value: BigInt(0),
        };

        const result = simulator.sqrt(zeroCoin);
        expect(result.value).toBe(BigInt(0)); // sqrt(0) = 0
      });

      it('should handle large values', () => {
        const largeCoin = {
          nonce: new Uint8Array(32),
          color: sameColor,
          value: BigInt(1000000), // 1000^2
        };

        const result = simulator.sqrt(largeCoin);
        expect(result.value).toBe(BigInt(1000)); // sqrt(1000000) = 1000
      });
    });

    describe('Minimum', () => {
      it('should return the coin with minimum value for coins with same color', () => {
        const result = simulator.min(coinA, coinB);

        expect(result.color).toEqual(sameColor);
        expect(result.nonce).toEqual(coinA.nonce);
        expect(result.value).toBe(BigInt(50)); // min(100, 50) = 50
      });

      it('should return the first coin when values are equal', () => {
        const coinD = {
          nonce: new Uint8Array(32),
          color: sameColor,
          value: BigInt(100),
        };

        const result = simulator.min(coinA, coinD);

        expect(result.color).toEqual(sameColor);
        expect(result.nonce).toEqual(coinA.nonce);
        expect(result.value).toBe(BigInt(100)); // min(100, 100) = 100 (first coin)
      });

      it('should throw error when comparing coins with different colors', () => {
        expect(() => simulator.min(coinA, coinC)).toThrow(
          'colors must be the same',
        );
      });
    });

    describe('Maximum', () => {
      it('should return the coin with maximum value for coins with same color', () => {
        const result = simulator.max(coinA, coinB);

        expect(result.color).toEqual(sameColor);
        expect(result.nonce).toEqual(coinA.nonce);
        expect(result.value).toBe(BigInt(100)); // max(100, 50) = 100
      });

      it('should return the first coin when values are equal', () => {
        const coinD = {
          nonce: new Uint8Array(32),
          color: sameColor,
          value: BigInt(100),
        };

        const result = simulator.max(coinA, coinD);

        expect(result.color).toEqual(sameColor);
        expect(result.nonce).toEqual(coinA.nonce);
        expect(result.value).toBe(BigInt(100)); // max(100, 100) = 100 (first coin)
      });

      it('should throw error when comparing coins with different colors', () => {
        expect(() => simulator.max(coinA, coinC)).toThrow(
          'colors must be the same',
        );
      });
    });

    describe('Sorting', () => {
      const colorA = new Uint8Array(32);
      colorA[0] = 1;
      const colorB = new Uint8Array(32);
      colorB[0] = 2;
      const coinA = {
        nonce: new Uint8Array(32),
        color: colorA,
        value: BigInt(100),
      };
      const coinB = {
        nonce: new Uint8Array(32),
        color: colorB,
        value: BigInt(200),
      };

      it('should sort coins in descending order by color (sortGt)', () => {
        const [first, second] = simulator.sortGt(coinA, coinB);
        expect(first.color[0]).toBe(2);
        expect(second.color[0]).toBe(1);
      });

      it('should sort coins in ascending order by color (sortLt)', () => {
        const [first, second] = simulator.sortLt(coinA, coinB);
        expect(first.color[0]).toBe(1);
        expect(second.color[0]).toBe(2);
      });

      it('should keep order if colors are equal', () => {
        const coinC = {
          nonce: new Uint8Array(32),
          color: colorA,
          value: BigInt(50),
        };
        const [firstGt, secondGt] = simulator.sortGt(coinA, coinC);
        expect([coinA, coinC]).toContainEqual(firstGt);
        expect([coinA, coinC]).toContainEqual(secondGt);
        expect(firstGt.color).toEqual(secondGt.color);
        const [firstLt, secondLt] = simulator.sortLt(coinA, coinC);
        expect([coinA, coinC]).toContainEqual(firstLt);
        expect([coinA, coinC]).toContainEqual(secondLt);
        expect(firstLt.color).toEqual(secondLt.color);
      });
    });
  });

  // ============================================================================
  // BOOLEAN OPERATIONS (COMPARISONS)
  // ============================================================================

  describe('Value-based Comparisons', () => {
    const coinA = {
      nonce: new Uint8Array(32),
      color: new Uint8Array(32),
      value: BigInt(100),
    };
    const coinB = {
      nonce: new Uint8Array(32),
      color: new Uint8Array(32),
      value: BigInt(200),
    };
    const coinC = {
      nonce: new Uint8Array(32),
      color: new Uint8Array(32),
      value: BigInt(100),
    };

    it('should compare values for equality', () => {
      expect(simulator.eqValue(coinA, coinB)).toBe(false);
      expect(simulator.eqValue(coinA, coinC)).toBe(true);
    });

    it('should compare values for less than', () => {
      expect(simulator.ltValue(coinA, coinB)).toBe(true);
      expect(simulator.ltValue(coinB, coinA)).toBe(false);
      expect(simulator.ltValue(coinA, coinC)).toBe(false);
    });

    it('should compare values for less than or equal', () => {
      expect(simulator.lteValue(coinA, coinB)).toBe(true);
      expect(simulator.lteValue(coinB, coinA)).toBe(false);
      expect(simulator.lteValue(coinA, coinC)).toBe(true);
    });

    it('should compare values for greater than', () => {
      expect(simulator.gtValue(coinA, coinB)).toBe(false);
      expect(simulator.gtValue(coinB, coinA)).toBe(true);
      expect(simulator.gtValue(coinA, coinC)).toBe(false);
    });

    it('should compare values for greater than or equal', () => {
      expect(simulator.gteValue(coinA, coinB)).toBe(false);
      expect(simulator.gteValue(coinB, coinA)).toBe(true);
      expect(simulator.gteValue(coinA, coinC)).toBe(true);
    });
  });

  describe('Color-based Comparisons', () => {
    const colorA = new Uint8Array(32);
    colorA[0] = 1;
    const colorB = new Uint8Array(32);
    colorB[0] = 2;
    const colorC = new Uint8Array(32);
    colorC[0] = 1;

    const coinA = {
      nonce: new Uint8Array(32),
      color: colorA,
      value: BigInt(100),
    };
    const coinB = {
      nonce: new Uint8Array(32),
      color: colorB,
      value: BigInt(100),
    };
    const coinC = {
      nonce: new Uint8Array(32),
      color: colorC,
      value: BigInt(100),
    };

    it('should compare colors for equality', () => {
      expect(simulator.eqColor(coinA, coinB)).toBe(false);
      expect(simulator.eqColor(coinA, coinC)).toBe(true);
    });

    it('should compare colors for less than (lexicographic)', () => {
      expect(simulator.ltColor(coinA, coinB)).toBe(true);
      expect(simulator.ltColor(coinB, coinA)).toBe(false);
      expect(simulator.ltColor(coinA, coinC)).toBe(false);
    });

    it('should compare colors for less than or equal', () => {
      expect(simulator.lteColor(coinA, coinB)).toBe(true);
      expect(simulator.lteColor(coinB, coinA)).toBe(false);
      expect(simulator.lteColor(coinA, coinC)).toBe(true);
    });

    it('should compare colors for greater than', () => {
      expect(simulator.gtColor(coinA, coinB)).toBe(false);
      expect(simulator.gtColor(coinB, coinA)).toBe(true);
      expect(simulator.gtColor(coinA, coinC)).toBe(false);
    });

    it('should compare colors for greater than or equal', () => {
      expect(simulator.gteColor(coinA, coinB)).toBe(false);
      expect(simulator.gteColor(coinB, coinA)).toBe(true);
      expect(simulator.gteColor(coinA, coinC)).toBe(true);
    });
  });

  describe('Combined Comparisons', () => {
    const coinA = {
      nonce: new Uint8Array(32),
      color: new Uint8Array(32),
      value: BigInt(100),
    };
    const coinB = {
      nonce: new Uint8Array(32),
      color: new Uint8Array(32),
      value: BigInt(200),
    };
    const coinC = {
      nonce: new Uint8Array(32),
      color: new Uint8Array(32),
      value: BigInt(100),
    };

    it('should check complete equality', () => {
      expect(simulator.eq(coinA, coinB)).toBe(false);
      expect(simulator.eq(coinA, coinC)).toBe(true);
    });

    it('should check same color', () => {
      expect(simulator.isSameColor(coinA, coinB)).toBe(true);
      expect(simulator.isSameColor(coinA, coinC)).toBe(true);
    });

    it('should check same value', () => {
      expect(simulator.isSameValue(coinA, coinB)).toBe(false);
      expect(simulator.isSameValue(coinA, coinC)).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero values', () => {
      const zeroCoin = {
        nonce: new Uint8Array(32),
        color: new Uint8Array(32),
        value: BigInt(0),
      };
      const nonZeroCoin = {
        nonce: new Uint8Array(32),
        color: new Uint8Array(32),
        value: BigInt(100),
      };

      expect(simulator.eqValue(zeroCoin, nonZeroCoin)).toBe(false);
      expect(simulator.ltValue(zeroCoin, nonZeroCoin)).toBe(true);
      expect(simulator.gtValue(zeroCoin, nonZeroCoin)).toBe(false);
    });

    it('should handle zero colors', () => {
      const zeroColor = new Uint8Array(32);
      const nonZeroColor = new Uint8Array(32);
      nonZeroColor[0] = 1;

      const coinA = {
        nonce: new Uint8Array(32),
        color: zeroColor,
        value: BigInt(100),
      };
      const coinB = {
        nonce: new Uint8Array(32),
        color: nonZeroColor,
        value: BigInt(100),
      };

      expect(simulator.eqColor(coinA, coinB)).toBe(false);
      expect(simulator.ltColor(coinA, coinB)).toBe(true);
      expect(simulator.gtColor(coinA, coinB)).toBe(false);
    });

    it('should handle large values', () => {
      const largeCoin = {
        nonce: new Uint8Array(32),
        color: new Uint8Array(32),
        value: BigInt('18446744073709551615'), // 2^64 - 1
      };
      const smallCoin = {
        nonce: new Uint8Array(32),
        color: new Uint8Array(32),
        value: BigInt(100),
      };

      expect(simulator.gtValue(largeCoin, smallCoin)).toBe(true);
      expect(simulator.ltValue(smallCoin, largeCoin)).toBe(true);
    });
  });
});
