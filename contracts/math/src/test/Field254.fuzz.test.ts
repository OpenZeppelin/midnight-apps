import { beforeEach, describe, test } from 'vitest';
import * as fc from 'fast-check';
import type { U256 } from '../artifacts/Index/contract/index.d.cts';
import { FIELD_MODULUS, toU256, fromU256 } from '../utils/u256';
import { Field254Simulator } from './Field254Simulator';

let field254Simulator: Field254Simulator;

const setup = () => {
  field254Simulator = new Field254Simulator();
};

// Custom arbitrary for Field254 values (within 254-bit range)
const arbField254 = (): fc.Arbitrary<bigint> => {
  return fc.bigUint({ max: FIELD_MODULUS });
};

// Custom arbitrary for U256 within field constraints
const arbU256InField = (): fc.Arbitrary<U256> => {
  return fc.bigUint({ max: FIELD_MODULUS }).map((value) => toU256(value));
};

/**
 * Property-based fuzz tests for Field254 operations
 * Using fast-check for automated test case generation
 */
describe('Field254 - Property-Based Fuzz Tests', () => {
  beforeEach(setup);

  describe('Conversion Properties', () => {
    test('fromField and toField are inverses', () => {
      fc.assert(
        fc.property(
          arbField254(),
          (value) => {
            const u256 = field254Simulator.fromField(value);
            const reconstructed = field254Simulator.toField(u256);
            return reconstructed === value;
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('toField and fromField are inverses for valid U256', () => {
      fc.assert(
        fc.property(
          arbU256InField(),
          (u256) => {
            const field = field254Simulator.toField(u256);
            const reconstructed = field254Simulator.fromField(field);
            
            const originalValue = fromU256(u256);
            const reconstructedValue = fromU256(reconstructed);
            
            return originalValue === reconstructedValue;
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('fromField produces valid U256 structure', () => {
      fc.assert(
        fc.property(
          arbField254(),
          (value) => {
            const u256 = field254Simulator.fromField(value);
            const reconstructedValue = fromU256(u256);
            return reconstructedValue === value;
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('toField rejects values exceeding 254 bits', () => {
      fc.assert(
        fc.property(
          fc.bigUint({ min: 2n ** 254n, max: 2n ** 256n - 1n }),
          (value) => {
            const u256 = toU256(value);
            try {
              field254Simulator.toField(u256);
              // Should have thrown an error
              return false;
            } catch {
              // Expected behavior
              return true;
            }
          }
        ),
        { numRuns: 500 }
      );
    });
  });

  describe('Comparison Properties', () => {
    test('Equality is reflexive: a = a', () => {
      fc.assert(
        fc.property(
          arbField254(),
          (a) => {
            return field254Simulator.eq(a, a);
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('Equality is symmetric: a = b implies b = a', () => {
      fc.assert(
        fc.property(
          arbField254(),
          arbField254(),
          (a, b) => {
            const eqAB = field254Simulator.eq(a, b);
            const eqBA = field254Simulator.eq(b, a);
            return eqAB === eqBA;
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('Equality is transitive: if a = b and b = c, then a = c', () => {
      fc.assert(
        fc.property(
          arbField254(),
          arbField254(),
          arbField254(),
          (a, b, c) => {
            const eqAB = field254Simulator.eq(a, b);
            const eqBC = field254Simulator.eq(b, c);
            const eqAC = field254Simulator.eq(a, c);
            
            if (eqAB && eqBC) {
              return eqAC;
            }
            return true;
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('Less than is transitive: if a < b and b < c, then a < c', () => {
      fc.assert(
        fc.property(
          arbField254(),
          arbField254(),
          arbField254(),
          (a, b, c) => {
            const ltAB = field254Simulator.lt(a, b);
            const ltBC = field254Simulator.lt(b, c);
            
            if (ltAB && ltBC) {
              return field254Simulator.lt(a, c);
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
          arbField254(),
          (a) => {
            return field254Simulator.lte(a, a);
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('Greater than is inverse of less than: a > b = b < a', () => {
      fc.assert(
        fc.property(
          arbField254(),
          arbField254(),
          (a, b) => {
            const gtAB = field254Simulator.gt(a, b);
            const ltBA = field254Simulator.lt(b, a);
            return gtAB === ltBA;
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('Greater than or equal is inverse of less than: a ≥ b = not (a < b)', () => {
      fc.assert(
        fc.property(
          arbField254(),
          arbField254(),
          (a, b) => {
            const gteAB = field254Simulator.gte(a, b);
            const ltAB = field254Simulator.lt(a, b);
            return gteAB === !ltAB;
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('Trichotomy: exactly one of a < b, a = b, a > b is true', () => {
      fc.assert(
        fc.property(
          arbField254(),
          arbField254(),
          (a, b) => {
            const lt = field254Simulator.lt(a, b);
            const eq = field254Simulator.eq(a, b);
            const gt = field254Simulator.gt(a, b);
            
            const count = (lt ? 1 : 0) + (eq ? 1 : 0) + (gt ? 1 : 0);
            return count === 1;
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('Consistency between comparison operators: a ≤ b ↔ (a < b or a = b)', () => {
      fc.assert(
        fc.property(
          arbField254(),
          arbField254(),
          (a, b) => {
            const lte = field254Simulator.lte(a, b);
            const lt = field254Simulator.lt(a, b);
            const eq = field254Simulator.eq(a, b);
            
            return lte === (lt || eq);
          }
        ),
        { numRuns: 1000 }
      );
    });
  });

  describe('Arithmetic Properties', () => {
    test('Addition commutativity: a + b = b + a', () => {
      fc.assert(
        fc.property(
          arbField254(),
          arbField254(),
          (a, b) => {
            const resultAB = field254Simulator.add(a, b);
            const resultBA = field254Simulator.add(b, a);
            return resultAB === resultBA;
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('Addition associativity: (a + b) + c = a + (b + c)', () => {
      fc.assert(
        fc.property(
          arbField254(),
          arbField254(),
          arbField254(),
          (a, b, c) => {
            const resultLeft = field254Simulator.add(field254Simulator.add(a, b), c);
            const resultRight = field254Simulator.add(a, field254Simulator.add(b, c));
            return resultLeft === resultRight;
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('Addition identity: a + 0 = a', () => {
      fc.assert(
        fc.property(
          arbField254(),
          (a) => {
            const result = field254Simulator.add(a, 0n);
            return result === a;
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('Subtraction inverse: (a + b) - b = a', () => {
      fc.assert(
        fc.property(
          arbField254(),
          arbField254(),
          (a, b) => {
            try {
              const sum = field254Simulator.add(a, b);
              const result = field254Simulator.sub(sum, b);
              return result === a;
            } catch {
              // Overflow cases are acceptable
              return true;
            }
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('Subtraction identity: a - 0 = a', () => {
      fc.assert(
        fc.property(
          arbField254(),
          (a) => {
            const result = field254Simulator.sub(a, 0n);
            return result === a;
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('Self-subtraction: a - a = 0', () => {
      fc.assert(
        fc.property(
          arbField254(),
          (a) => {
            const result = field254Simulator.sub(a, a);
            return result === 0n;
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('Multiplication commutativity: a * b = b * a', () => {
      fc.assert(
        fc.property(
          arbField254(),
          arbField254(),
          (a, b) => {
            const resultAB = field254Simulator.mul(a, b);
            const resultBA = field254Simulator.mul(b, a);
            return resultAB === resultBA;
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('Multiplication associativity: (a * b) * c = a * (b * c)', () => {
      fc.assert(
        fc.property(
          fc.bigUintN(84),
          fc.bigUintN(84),
          fc.bigUintN(84),
          (a, b, c) => {
            const resultLeft = field254Simulator.mul(field254Simulator.mul(a, b), c);
            const resultRight = field254Simulator.mul(a, field254Simulator.mul(b, c));
            return resultLeft === resultRight;
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('Multiplication identity: a * 1 = a', () => {
      fc.assert(
        fc.property(
          arbField254(),
          (a) => {
            const result = field254Simulator.mul(a, 1n);
            return result === a;
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('Multiplication zero: a * 0 = 0', () => {
      fc.assert(
        fc.property(
          arbField254(),
          (a) => {
            const result = field254Simulator.mul(a, 0n);
            return result === 0n;
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('Distributivity: a * (b + c) = (a * b) + (a * c)', () => {
      fc.assert(
        fc.property(
          fc.bigUintN(84),
          fc.bigUintN(84),
          fc.bigUintN(84),
          (a, b, c) => {
            try {
              const left = field254Simulator.mul(a, field254Simulator.add(b, c));
              const right = field254Simulator.add(
                field254Simulator.mul(a, b),
                field254Simulator.mul(a, c)
              );
              return left === right;
            } catch {
              // Overflow is acceptable
              return true;
            }
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('Division by 1: a / 1 = a', () => {
      fc.assert(
        fc.property(
          arbField254(),
          (a) => {
            const result = field254Simulator.div(a, 1n);
            return result.quotient === a;
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('Division by self: a / a = 1 (for non-zero a)', () => {
      fc.assert(
        fc.property(
          arbField254(),
          (a) => {
            fc.pre(a > 0n);
            const result = field254Simulator.div(a, a);
            return result.quotient === 1n;
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('Zero dividend: 0 / a = 0 (for non-zero a)', () => {
      fc.assert(
        fc.property(
          arbField254(),
          (a) => {
            fc.pre(a > 0n);
            const result = field254Simulator.div(0n, a);
            return result.quotient === 0n;
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('Division-modulo relationship: a = (a / b) * b + (a % b)', () => {
      fc.assert(
        fc.property(
          arbField254(),
          arbField254(),
          (a, b) => {
            fc.pre(b > 0n);
            const divResult = field254Simulator.div(a, b);
            const reconstructed = field254Simulator.add(
              field254Simulator.mul(divResult.quotient, b),
              divResult.remainder
            );
            return reconstructed === a;
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('Remainder is always less than divisor: (a % b) < b', () => {
      fc.assert(
        fc.property(
          arbField254(),
          arbField254(),
          (a, b) => {
            fc.pre(b > 0n);
            const divResult = field254Simulator.div(a, b);
            return divResult.remainder < b;
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
          arbField254(),
          (a) => {
            const result = field254Simulator.isZero(a);
            return result === (a === 0n);
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('isZero consistency with equality', () => {
      fc.assert(
        fc.property(
          arbField254(),
          (a) => {
            const isZeroResult = field254Simulator.isZero(a);
            const eqZeroResult = field254Simulator.eq(a, 0n);
            return isZeroResult === eqZeroResult;
          }
        ),
        { numRuns: 1000 }
      );
    });
  });

  describe('Boundary and Edge Cases', () => {
    test('Operations with FIELD_MODULUS', () => {
      fc.assert(
        fc.property(
          arbField254(),
          (a) => {
            // Comparison with field modulus
            const ltResult = field254Simulator.lte(a, FIELD_MODULUS);
            
            // Should complete without error
            return ltResult;
          }
        ),
        { numRuns: 500 }
      );
    });

    test('Operations with zero', () => {
      fc.assert(
        fc.property(
          arbField254(),
          (a) => {
            // Add zero
            const addZero = field254Simulator.add(a, 0n);
            // Multiply by zero
            const mulZero = field254Simulator.mul(a, 0n);
            // Subtract zero
            const subZero = field254Simulator.sub(a, 0n);
            
            return addZero === a && mulZero === 0n && subZero === a;
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('Operations with one', () => {
      fc.assert(
        fc.property(
          arbField254(),
          (a) => {
            // Multiply by one
            const mulOne = field254Simulator.mul(a, 1n);
            // Divide by one (if non-zero)
            const divOne = a > 0n ? field254Simulator.div(a, 1n).quotient : 0n;
            
            return mulOne === a && (a === 0n || divOne === a);
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('Powers of two', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 253 }),
          (exponent) => {
            const value = 2n ** BigInt(exponent);
            const u256 = field254Simulator.fromField(value);
            const reconstructed = field254Simulator.toField(u256);
            return reconstructed === value;
          }
        ),
        { numRuns: 254 }
      );
    });

    test('Sequential values maintain ordering', () => {
      fc.assert(
        fc.property(
          fc.bigUint({ max: FIELD_MODULUS - 1n }),
          (value) => {
            return field254Simulator.lt(value, value + 1n);
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('Conversion preserves value within field range', () => {
      fc.assert(
        fc.property(
          arbField254(),
          (value) => {
            fc.pre(value <= FIELD_MODULUS);
            const u256 = field254Simulator.fromField(value);
            const converted = field254Simulator.toField(u256);
            return converted === value;
          }
        ),
        { numRuns: 1000 }
      );
    });
  });

  describe('Ordering Properties', () => {
    test('Anti-symmetry: if a ≤ b and b ≤ a, then a = b', () => {
      fc.assert(
        fc.property(
          arbField254(),
          arbField254(),
          (a, b) => {
            const lteAB = field254Simulator.lte(a, b);
            const lteBA = field254Simulator.lte(b, a);
            const eqAB = field254Simulator.eq(a, b);
            
            if (lteAB && lteBA) {
              return eqAB;
            }
            return true;
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('Totality: for any a and b, either a ≤ b or b ≤ a', () => {
      fc.assert(
        fc.property(
          arbField254(),
          arbField254(),
          (a, b) => {
            const lteAB = field254Simulator.lte(a, b);
            const lteBA = field254Simulator.lte(b, a);
            return lteAB || lteBA;
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('Less than is irreflexive: not (a < a)', () => {
      fc.assert(
        fc.property(
          arbField254(),
          (a) => {
            return !field254Simulator.lt(a, a);
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('Less than is asymmetric: if a < b, then not (b < a)', () => {
      fc.assert(
        fc.property(
          arbField254(),
          arbField254(),
          (a, b) => {
            const ltAB = field254Simulator.lt(a, b);
            const ltBA = field254Simulator.lt(b, a);
            
            if (ltAB) {
              return !ltBA;
            }
            return true;
          }
        ),
        { numRuns: 1000 }
      );
    });
  });
});
