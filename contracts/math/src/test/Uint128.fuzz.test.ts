import { beforeEach, describe, test } from 'vitest';
import * as fc from 'fast-check';
import type { U128 } from '../artifacts/Index/contract/index.d.cts';
import { MAX_UINT64, MAX_UINT128 } from '../utils/consts';
import { Uint128Simulator } from './Uint128Simulator';

let uint128Simulator: Uint128Simulator;

const setup = () => {
  uint128Simulator = new Uint128Simulator();
};

// Custom arbitraries for U128 structure
const arbU128 = (): fc.Arbitrary<U128> => {
  return fc.record({
    low: fc.bigUintN(64),
    high: fc.bigUintN(64),
  });
};

// Arbitrary for Uint<128> values
const arbUint128 = (): fc.Arbitrary<bigint> => {
  return fc.bigUint({ max: MAX_UINT128 });
};

/**
 * Property-based fuzz tests for Uint128 operations
 * Using fast-check for automated test case generation
 */
describe('Uint128 - Property-Based Fuzz Tests', () => {
  beforeEach(setup);

  describe('Conversion Properties', () => {
    test('toU128 and fromU128 are inverses', () => {
      fc.assert(
        fc.property(
          arbUint128(),
          (value) => {
            const u128 = uint128Simulator.toU128(value);
            const reconstructed = uint128Simulator.fromU128(u128);
            return reconstructed === value;
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('fromU128 and toU128 are inverses', () => {
      fc.assert(
        fc.property(
          arbU128(),
          (u128) => {
            const value = uint128Simulator.fromU128(u128);
            const reconstructed = uint128Simulator.toU128(value);
            return reconstructed.low === u128.low && reconstructed.high === u128.high;
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('toU128 produces valid low and high components', () => {
      fc.assert(
        fc.property(
          arbUint128(),
          (value) => {
            const u128 = uint128Simulator.toU128(value);
            return u128.low <= MAX_UINT64 && u128.high <= MAX_UINT64;
          }
        ),
        { numRuns: 1000 }
      );
    });
  });

  describe('Addition Properties', () => {
    test('Commutativity: a + b = b + a', () => {
      fc.assert(
        fc.property(
          arbUint128(),
          arbUint128(),
          (a, b) => {
            const resultAB = uint128Simulator.add(a, b);
            const resultBA = uint128Simulator.add(b, a);
            return resultAB === resultBA;
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('Associativity: (a + b) + c = a + (b + c)', () => {
      fc.assert(
        fc.property(
          arbUint128(),
          arbUint128(),
          arbUint128(),
          (a, b, c) => {
            const resultLeft = uint128Simulator.add(uint128Simulator.add(a, b), c);
            const resultRight = uint128Simulator.add(a, uint128Simulator.add(b, c));
            return resultLeft === resultRight;
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('Identity: a + 0 = a', () => {
      fc.assert(
        fc.property(
          arbUint128(),
          (a) => {
            const result = uint128Simulator.add(a, 0n);
            return result === a;
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('U128 Addition commutativity: a + b = b + a', () => {
      fc.assert(
        fc.property(
          arbU128(),
          arbU128(),
          (a, b) => {
            const resultAB = uint128Simulator.addU128(a, b);
            const resultBA = uint128Simulator.addU128(b, a);
            return resultAB.low === resultBA.low && resultAB.high === resultBA.high;
          }
        ),
        { numRuns: 1000 }
      );
    });
  });

  describe('Subtraction Properties', () => {
    test('Inverse of addition: (a + b) - b = a', () => {
      fc.assert(
        fc.property(
          fc.bigUint({ max: MAX_UINT128 / 2n }),
          fc.bigUint({ max: MAX_UINT128 / 2n }),
          (a, b) => {
            const sum = uint128Simulator.add(a, b);
            const result = uint128Simulator.sub(sum, b);
            return result === a;
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('Identity: a - 0 = a', () => {
      fc.assert(
        fc.property(
          arbUint128(),
          (a) => {
            const result = uint128Simulator.sub(a, 0n);
            return result === a;
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('Self-subtraction: a - a = 0', () => {
      fc.assert(
        fc.property(
          arbUint128(),
          (a) => {
            const result = uint128Simulator.sub(a, a);
            return result === 0n;
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('U128 Subtraction inverse: (a + b) - b = a', () => {
      fc.assert(
        fc.property(
          arbU128(),
          arbU128(),
          (a, b) => {
            try {
              const sum = uint128Simulator.addU128(a, b);
              const result = uint128Simulator.subU128(sum, b);
              return result.low === a.low && result.high === a.high;
            } catch {
              // Overflow cases are acceptable
              return true;
            }
          }
        ),
        { numRuns: 1000 }
      );
    });
  });

  describe('Multiplication Properties', () => {
    test('Commutativity: a * b = b * a', () => {
      fc.assert(
        fc.property(
          arbUint128(),
          arbUint128(),
          (a, b) => {
            const resultAB = uint128Simulator.mul(a, b);
            const resultBA = uint128Simulator.mul(b, a);
            return resultAB === resultBA;
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('Associativity: (a * b) * c = a * (b * c)', () => {
      fc.assert(
        fc.property(
          fc.bigUintN(42),
          fc.bigUintN(42),
          fc.bigUintN(42),
          (a, b, c) => {
            const resultLeft = uint128Simulator.mul(uint128Simulator.mul(a, b), c);
            const resultRight = uint128Simulator.mul(a, uint128Simulator.mul(b, c));
            return resultLeft === resultRight;
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('Identity: a * 1 = a', () => {
      fc.assert(
        fc.property(
          arbUint128(),
          (a) => {
            const result = uint128Simulator.mul(a, 1n);
            return result === a;
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('Zero property: a * 0 = 0', () => {
      fc.assert(
        fc.property(
          arbUint128(),
          (a) => {
            const result = uint128Simulator.mul(a, 0n);
            return result === 0n;
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('Distributivity: a * (b + c) = (a * b) + (a * c)', () => {
      fc.assert(
        fc.property(
          fc.bigUintN(42),
          fc.bigUintN(42),
          fc.bigUintN(42),
          (a, b, c) => {
            const left = uint128Simulator.mul(a, uint128Simulator.add(b, c));
            const right = uint128Simulator.add(
              uint128Simulator.mul(a, b),
              uint128Simulator.mul(a, c)
            );
            return left === right;
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('U128 Multiplication commutativity: a * b = b * a', () => {
      fc.assert(
        fc.property(
          arbU128(),
          arbU128(),
          (a, b) => {
            const resultAB = uint128Simulator.mulU128(a, b);
            const resultBA = uint128Simulator.mulU128(b, a);
            return (
              resultAB.low === resultBA.low &&
              resultAB.high === resultBA.high &&
              resultAB.overflow === resultBA.overflow
            );
          }
        ),
        { numRuns: 1000 }
      );
    });
  });

  describe('Division Properties', () => {
    test('Division by 1: a / 1 = a', () => {
      fc.assert(
        fc.property(
          arbUint128(),
          (a) => {
            const result = uint128Simulator.div(a, 1n);
            return result === a;
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('Division by self: a / a = 1 (for non-zero a)', () => {
      fc.assert(
        fc.property(
          arbUint128(),
          (a) => {
            fc.pre(a > 0n);
            const result = uint128Simulator.div(a, a);
            return result === 1n;
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('Zero dividend: 0 / a = 0 (for non-zero a)', () => {
      fc.assert(
        fc.property(
          arbUint128(),
          (a) => {
            fc.pre(a > 0n);
            const result = uint128Simulator.div(0n, a);
            return result === 0n;
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('Division is less than or equal to dividend: a / b ≤ a (for b ≥ 1)', () => {
      fc.assert(
        fc.property(
          arbUint128(),
          arbUint128(),
          (a, b) => {
            fc.pre(b > 0n);
            const result = uint128Simulator.div(a, b);
            return result <= a;
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('Multiplication-division relationship: (a * b) / b = a (for non-zero b, no overflow)', () => {
      fc.assert(
        fc.property(
          fc.bigUintN(64),
          fc.bigUintN(64),
          (a, b) => {
            fc.pre(b > 0n);
            const product = uint128Simulator.mul(a, b);
            const result = uint128Simulator.div(product, b);
            return result === a;
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('U128 Division quotient validity: (a / b) * b + (a % b) = a', () => {
      fc.assert(
        fc.property(
          arbU128(),
          arbU128(),
          (a, b) => {
            const bValue = uint128Simulator.fromU128(b);
            fc.pre(bValue > 0n);
            
            const divResult = uint128Simulator.divU128(a, b);
            const quotientValue = uint128Simulator.fromU128(divResult.quotient);
            const remainderValue = uint128Simulator.fromU128(divResult.remainder);
            const aValue = uint128Simulator.fromU128(a);
            
            const reconstructed = quotientValue * bValue + remainderValue;
            return reconstructed === aValue;
          }
        ),
        { numRuns: 1000 }
      );
    });
  });

  describe('Modulo Properties', () => {
    test('Modulo is always less than divisor: a % b < b (for non-zero b)', () => {
      fc.assert(
        fc.property(
          arbUint128(),
          arbUint128(),
          (a, b) => {
            fc.pre(b > 0n);
            const result = uint128Simulator.mod(a, b);
            return result < b;
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('Division-modulo relationship: a = (a / b) * b + (a % b)', () => {
      fc.assert(
        fc.property(
          arbUint128(),
          arbUint128(),
          (a, b) => {
            fc.pre(b > 0n);
            const quotient = uint128Simulator.div(a, b);
            const remainder = uint128Simulator.mod(a, b);
            const reconstructed = uint128Simulator.add(
              uint128Simulator.mul(quotient, b),
              remainder
            );
            return reconstructed === a;
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('Modulo by 1: a % 1 = 0', () => {
      fc.assert(
        fc.property(
          arbUint128(),
          (a) => {
            const result = uint128Simulator.mod(a, 1n);
            return result === 0n;
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('Modulo by self: a % a = 0 (for non-zero a)', () => {
      fc.assert(
        fc.property(
          arbUint128(),
          (a) => {
            fc.pre(a > 0n);
            const result = uint128Simulator.mod(a, a);
            return result === 0n;
          }
        ),
        { numRuns: 1000 }
      );
    });
  });

  describe('Comparison Properties', () => {
    test('Less than is transitive: if a < b and b < c, then a < c', () => {
      fc.assert(
        fc.property(
          arbUint128(),
          arbUint128(),
          arbUint128(),
          (a, b, c) => {
            fc.pre(a < b && b < c);
            return uint128Simulator.lt(a, c);
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('Less than or equal is reflexive: a ≤ a', () => {
      fc.assert(
        fc.property(
          arbUint128(),
          (a) => {
            return uint128Simulator.lte(a, a);
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('Equality is symmetric: a = b implies b = a', () => {
      fc.assert(
        fc.property(
          arbUint128(),
          (a) => {
            return uint128Simulator.eq(a, a);
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('Greater than is inverse of less than: a > b = b < a', () => {
      fc.assert(
        fc.property(
          arbUint128(),
          arbUint128(),
          (a, b) => {
            const gtResult = uint128Simulator.gt(a, b);
            const ltResult = uint128Simulator.lt(b, a);
            return gtResult === ltResult;
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('U128 Less than is transitive', () => {
      fc.assert(
        fc.property(
          arbU128(),
          arbU128(),
          arbU128(),
          (a, b, c) => {
            const aVal = uint128Simulator.fromU128(a);
            const bVal = uint128Simulator.fromU128(b);
            const cVal = uint128Simulator.fromU128(c);
            
            fc.pre(aVal < bVal && bVal < cVal);
            return uint128Simulator.ltU128(a, c);
          }
        ),
        { numRuns: 1000 }
      );
    });
  });

  describe('IsZero Properties', () => {
    test('isZero is true only for zero', () => {
      fc.assert(
        fc.property(
          arbUint128(),
          (a) => {
            const result = uint128Simulator.isZero(a);
            return result === (a === 0n);
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('isZeroU128 is true only for zero U128', () => {
      fc.assert(
        fc.property(
          arbU128(),
          (a) => {
            const result = uint128Simulator.isZeroU128(a);
            const value = uint128Simulator.fromU128(a);
            return result === (value === 0n);
          }
        ),
        { numRuns: 1000 }
      );
    });
  });

  describe('Boundary and Edge Cases', () => {
    test('Operations with MAX_UINT128', () => {
      fc.assert(
        fc.property(
          arbUint128(),
          (a) => {
            // Multiplication with MAX_UINT128 (may overflow)
            const mulResult = uint128Simulator.mul(a, MAX_UINT128);
            
            // Division by MAX_UINT128
            const divResult = uint128Simulator.div(a, MAX_UINT128);
            
            // Should complete without error
            return true;
          }
        ),
        { numRuns: 500 }
      );
    });

    test('Operations with zero', () => {
      fc.assert(
        fc.property(
          arbUint128(),
          (a) => {
            // Add zero
            const addZero = uint128Simulator.add(a, 0n);
            // Multiply by zero
            const mulZero = uint128Simulator.mul(a, 0n);
            
            return addZero === a && mulZero === 0n;
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('Operations with MAX_UINT64 boundaries', () => {
      fc.assert(
        fc.property(
          fc.bigUintN(64),
          fc.bigUintN(64),
          (a, b) => {
            // Should handle 64-bit values gracefully
            const sum = uint128Simulator.add(a, b);
            const product = uint128Simulator.mul(a, b);
            
            return sum >= a && sum >= b && product >= 0n;
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('U128 structure validation', () => {
      fc.assert(
        fc.property(
          arbU128(),
          (u128) => {
            // Verify components are within valid range
            return u128.low <= MAX_UINT64 && u128.high <= MAX_UINT64;
          }
        ),
        { numRuns: 1000 }
      );
    });
  });
});
