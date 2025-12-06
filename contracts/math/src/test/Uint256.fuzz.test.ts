import { beforeEach, describe, test } from 'vitest';
import * as fc from 'fast-check';
import type { U256 } from '../artifacts/Index/contract/index.d.cts';
import { MAX_UINT64, MAX_UINT128, MAX_UINT256 } from '../utils/consts';
import { Uint256Simulator } from './Uint256Simulator';

let uint256Simulator: Uint256Simulator;

const setup = () => {
  uint256Simulator = new Uint256Simulator();
};

// Maximum value that fits in 254 bits
const MAX_UINT254 = 2n ** 254n - 1n;

// Custom arbitrary for U256 structure
const arbU256 = (): fc.Arbitrary<U256> => {
  return fc.record({
    low: fc.record({
      low: fc.bigUintN(64),
      high: fc.bigUintN(64),
    }),
    high: fc.record({
      low: fc.bigUintN(64),
      high: fc.bigUintN(64),
    }),
  });
};

// Arbitrary for Uint<256> values (limited to 254 bits as per contract constraints)
const arbUint256 = (): fc.Arbitrary<bigint> => {
  return fc.bigUint({ max: MAX_UINT254 });
};

// Helper to convert bigint to U256
const toU256Helper = (value: bigint): U256 => {
  const lowBigInt = value & ((1n << 128n) - 1n);
  const highBigInt = value >> 128n;
  return {
    low: { low: lowBigInt & MAX_UINT64, high: lowBigInt >> 64n },
    high: { low: highBigInt & MAX_UINT64, high: highBigInt >> 64n },
  };
};

// Helper to convert U256 to bigint
const fromU256Helper = (value: U256): bigint => {
  return (
    (value.high.high << 192n) +
    (value.high.low << 128n) +
    (value.low.high << 64n) +
    value.low.low
  );
};

/**
 * Property-based fuzz tests for Uint256 operations
 * Using fast-check for automated test case generation
 */
describe('Uint256 - Property-Based Fuzz Tests', () => {
  beforeEach(setup);

  describe('Conversion Properties', () => {
    test('toU256 and fromU256 are inverses', () => {
      fc.assert(
        fc.property(
          arbUint256(),
          (value) => {
            const u256 = uint256Simulator.toU256(value);
            const reconstructed = uint256Simulator.fromU256(u256);
            return reconstructed === value;
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('fromU256 and toU256 are inverses for valid U256', () => {
      fc.assert(
        fc.property(
          arbUint256(),
          (value) => {
            const u256 = toU256Helper(value);
            const extracted = uint256Simulator.fromU256(u256);
            const reconstructed = uint256Simulator.toU256(extracted);
            
            return (
              reconstructed.low.low === u256.low.low &&
              reconstructed.low.high === u256.low.high &&
              reconstructed.high.low === u256.high.low &&
              reconstructed.high.high === u256.high.high
            );
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('toU256 produces valid component bounds', () => {
      fc.assert(
        fc.property(
          arbUint256(),
          (value) => {
            const u256 = uint256Simulator.toU256(value);
            return (
              u256.low.low <= MAX_UINT64 &&
              u256.low.high <= MAX_UINT64 &&
              u256.high.low <= MAX_UINT64 &&
              u256.high.high <= MAX_UINT64
            );
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
          arbU256(),
          arbU256(),
          (a, b) => {
            const resultAB = uint256Simulator.add(a, b);
            const resultBA = uint256Simulator.add(b, a);
            return (
              resultAB.low.low === resultBA.low.low &&
              resultAB.low.high === resultBA.low.high &&
              resultAB.high.low === resultBA.high.low &&
              resultAB.high.high === resultBA.high.high
            );
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('Associativity: (a + b) + c = a + (b + c)', () => {
      fc.assert(
        fc.property(
          arbU256(),
          arbU256(),
          arbU256(),
          (a, b, c) => {
            const resultLeft = uint256Simulator.add(uint256Simulator.add(a, b), c);
            const resultRight = uint256Simulator.add(a, uint256Simulator.add(b, c));
            return (
              resultLeft.low.low === resultRight.low.low &&
              resultLeft.low.high === resultRight.low.high &&
              resultLeft.high.low === resultRight.high.low &&
              resultLeft.high.high === resultRight.high.high
            );
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('Identity: a + 0 = a', () => {
      fc.assert(
        fc.property(
          arbU256(),
          (a) => {
            const zero = uint256Simulator.ZERO_U256();
            const result = uint256Simulator.add(a, zero);
            return (
              result.low.low === a.low.low &&
              result.low.high === a.low.high &&
              result.high.low === a.high.low &&
              result.high.high === a.high.high
            );
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
          arbU256(),
          arbU256(),
          (a, b) => {
            try {
              const sum = uint256Simulator.add(a, b);
              const result = uint256Simulator.sub(sum, b);
              return (
                result.low.low === a.low.low &&
                result.low.high === a.low.high &&
                result.high.low === a.high.low &&
                result.high.high === a.high.high
              );
            } catch {
              // Overflow cases are acceptable
              return true;
            }
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('Identity: a - 0 = a', () => {
      fc.assert(
        fc.property(
          arbU256(),
          (a) => {
            const zero = uint256Simulator.ZERO_U256();
            const result = uint256Simulator.sub(a, zero);
            return (
              result.low.low === a.low.low &&
              result.low.high === a.low.high &&
              result.high.low === a.high.low &&
              result.high.high === a.high.high
            );
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('Self-subtraction: a - a = 0', () => {
      fc.assert(
        fc.property(
          arbU256(),
          (a) => {
            const result = uint256Simulator.sub(a, a);
            const zero = uint256Simulator.ZERO_U256();
            return (
              result.low.low === zero.low.low &&
              result.low.high === zero.low.high &&
              result.high.low === zero.high.low &&
              result.high.high === zero.high.high
            );
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
          arbU256(),
          arbU256(),
          (a, b) => {
            const resultAB = uint256Simulator.mul(a, b);
            const resultBA = uint256Simulator.mul(b, a);
            return (
              resultAB.low.low === resultBA.low.low &&
              resultAB.low.high === resultBA.low.high &&
              resultAB.high.low === resultBA.high.low &&
              resultAB.high.high === resultBA.high.high &&
              resultAB.overflow === resultBA.overflow
            );
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('Identity: a * 1 = a', () => {
      fc.assert(
        fc.property(
          arbU256(),
          (a) => {
            const one = toU256Helper(1n);
            const result = uint256Simulator.mul(a, one);
            return (
              result.low.low === a.low.low &&
              result.low.high === a.low.high &&
              result.high.low === a.high.low &&
              result.high.high === a.high.high
            );
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('Zero property: a * 0 = 0', () => {
      fc.assert(
        fc.property(
          arbU256(),
          (a) => {
            const zero = uint256Simulator.ZERO_U256();
            const result = uint256Simulator.mul(a, zero);
            return (
              result.low.low === zero.low.low &&
              result.low.high === zero.low.high &&
              result.high.low === zero.high.low &&
              result.high.high === zero.high.high
            );
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('Distributivity: a * (b + c) = (a * b) + (a * c) when no overflow', () => {
      fc.assert(
        fc.property(
          fc.bigUintN(84),
          fc.bigUintN(84),
          fc.bigUintN(84),
          (aVal, bVal, cVal) => {
            const a = toU256Helper(aVal);
            const b = toU256Helper(bVal);
            const c = toU256Helper(cVal);
            
            try {
              const left = uint256Simulator.mul(a, uint256Simulator.add(b, c));
              const right = uint256Simulator.add(
                uint256Simulator.mul(a, b),
                uint256Simulator.mul(a, c)
              );
              
              return (
                left.low.low === right.low.low &&
                left.low.high === right.low.high &&
                left.high.low === right.high.low &&
                left.high.high === right.high.high
              );
            } catch {
              // Overflow is acceptable
              return true;
            }
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
          arbU256(),
          (a) => {
            const one = toU256Helper(1n);
            const result = uint256Simulator.div(a, one);
            return (
              result.quotient.low.low === a.low.low &&
              result.quotient.low.high === a.low.high &&
              result.quotient.high.low === a.high.low &&
              result.quotient.high.high === a.high.high
            );
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('Division by self: a / a = 1 (for non-zero a)', () => {
      fc.assert(
        fc.property(
          arbU256(),
          (a) => {
            const aVal = fromU256Helper(a);
            fc.pre(aVal > 0n);
            
            const result = uint256Simulator.div(a, a);
            const one = toU256Helper(1n);
            return (
              result.quotient.low.low === one.low.low &&
              result.quotient.low.high === one.low.high &&
              result.quotient.high.low === one.high.low &&
              result.quotient.high.high === one.high.high
            );
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('Zero dividend: 0 / a = 0 (for non-zero a)', () => {
      fc.assert(
        fc.property(
          arbU256(),
          (a) => {
            const aVal = fromU256Helper(a);
            fc.pre(aVal > 0n);
            
            const zero = uint256Simulator.ZERO_U256();
            const result = uint256Simulator.div(zero, a);
            return (
              result.quotient.low.low === zero.low.low &&
              result.quotient.low.high === zero.low.high &&
              result.quotient.high.low === zero.high.low &&
              result.quotient.high.high === zero.high.high
            );
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('Division quotient-remainder relationship: a = (a / b) * b + (a % b)', () => {
      fc.assert(
        fc.property(
          arbU256(),
          arbU256(),
          (a, b) => {
            const bVal = fromU256Helper(b);
            fc.pre(bVal > 0n);
            
            const divResult = uint256Simulator.div(a, b);
            const quotient = divResult.quotient;
            const remainder = divResult.remainder;
            
            const mulResult = uint256Simulator.mul(quotient, b);
            const reconstructed = uint256Simulator.add(mulResult, remainder);
            
            return (
              reconstructed.low.low === a.low.low &&
              reconstructed.low.high === a.low.high &&
              reconstructed.high.low === a.high.low &&
              reconstructed.high.high === a.high.high
            );
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('Remainder is always less than divisor: (a % b) < b', () => {
      fc.assert(
        fc.property(
          arbU256(),
          arbU256(),
          (a, b) => {
            const bVal = fromU256Helper(b);
            fc.pre(bVal > 0n);
            
            const divResult = uint256Simulator.div(a, b);
            const remainderVal = fromU256Helper(divResult.remainder);
            
            return remainderVal < bVal;
          }
        ),
        { numRuns: 1000 }
      );
    });
  });

  describe('Comparison Properties', () => {
    test('Equality is reflexive: a = a', () => {
      fc.assert(
        fc.property(
          arbU256(),
          (a) => {
            return uint256Simulator.eq(a, a);
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('Equality is symmetric: a = b implies b = a', () => {
      fc.assert(
        fc.property(
          arbU256(),
          arbU256(),
          (a, b) => {
            const eqAB = uint256Simulator.eq(a, b);
            const eqBA = uint256Simulator.eq(b, a);
            return eqAB === eqBA;
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('Less than is transitive: if a < b and b < c, then a < c', () => {
      fc.assert(
        fc.property(
          arbU256(),
          arbU256(),
          arbU256(),
          (a, b, c) => {
            const ltAB = uint256Simulator.lt(a, b);
            const ltBC = uint256Simulator.lt(b, c);
            
            if (ltAB && ltBC) {
              return uint256Simulator.lt(a, c);
            }
            return true;
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('Less than or equal is reflexive: a ≤ a', () => {
      fc.assert(
        fc.property(
          arbU256(),
          (a) => {
            return uint256Simulator.lte(a, a);
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('Greater than is inverse of less than: a > b = b < a', () => {
      fc.assert(
        fc.property(
          arbU256(),
          arbU256(),
          (a, b) => {
            const gtAB = uint256Simulator.gt(a, b);
            const ltBA = uint256Simulator.lt(b, a);
            return gtAB === ltBA;
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('Trichotomy: exactly one of a < b, a = b, a > b is true', () => {
      fc.assert(
        fc.property(
          arbU256(),
          arbU256(),
          (a, b) => {
            const lt = uint256Simulator.lt(a, b);
            const eq = uint256Simulator.eq(a, b);
            const gt = uint256Simulator.gt(a, b);
            
            const count = (lt ? 1 : 0) + (eq ? 1 : 0) + (gt ? 1 : 0);
            return count === 1;
          }
        ),
        { numRuns: 1000 }
      );
    });
  });

  describe('Boundary and Edge Cases', () => {
    test('Operations with MAX_UINT254', () => {
      fc.assert(
        fc.property(
          arbUint256(),
          (a) => {
            const aU256 = toU256Helper(a);
            const maxU256 = toU256Helper(MAX_UINT254);
            
            // Division by MAX_UINT254
            const divResult = uint256Simulator.div(aU256, maxU256);
            
            // Comparison with MAX_UINT254
            const ltResult = uint256Simulator.lte(aU256, maxU256);
            
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
          arbU256(),
          (a) => {
            const zero = uint256Simulator.ZERO_U256();
            
            // Add zero
            const addZero = uint256Simulator.add(a, zero);
            // Multiply by zero
            const mulZero = uint256Simulator.mul(a, zero);
            
            const addResult = (
              addZero.low.low === a.low.low &&
              addZero.low.high === a.low.high &&
              addZero.high.low === a.high.low &&
              addZero.high.high === a.high.high
            );
            
            const mulResult = (
              mulZero.low.low === zero.low.low &&
              mulZero.low.high === zero.low.high &&
              mulZero.high.low === zero.high.low &&
              mulZero.high.high === zero.high.high
            );
            
            return addResult && mulResult;
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('U256 structure validation', () => {
      fc.assert(
        fc.property(
          arbU256(),
          (u256) => {
            // Verify all components are within valid range
            return (
              u256.low.low <= MAX_UINT64 &&
              u256.low.high <= MAX_UINT64 &&
              u256.high.low <= MAX_UINT64 &&
              u256.high.high <= MAX_UINT64
            );
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('Conversion preserves value within 254-bit range', () => {
      fc.assert(
        fc.property(
          arbUint256(),
          (value) => {
            fc.pre(value <= MAX_UINT254);
            const u256 = uint256Simulator.toU256(value);
            const converted = uint256Simulator.fromU256(u256);
            return converted === value;
          }
        ),
        { numRuns: 1000 }
      );
    });
  });
});
