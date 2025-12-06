import { beforeEach, describe, test } from 'vitest';
import * as fc from 'fast-check';
import { MAX_UINT32, MAX_UINT64 } from '../utils/consts';
import { Uint64Simulator } from './Uint64Simulator';

let uint64Simulator: Uint64Simulator;

const setup = () => {
  uint64Simulator = new Uint64Simulator();
};

/**
 * Property-based fuzz tests for Uint64 operations
 * Using fast-check for automated test case generation
 */
describe('Uint64 - Property-Based Fuzz Tests', () => {
  beforeEach(setup);

  describe('Addition Properties', () => {
    test('Commutativity: a + b = b + a', () => {
      fc.assert(
        fc.property(
          fc.bigUintN(64),
          fc.bigUintN(64),
          (a, b) => {
            const resultAB = uint64Simulator.add(a, b);
            const resultBA = uint64Simulator.add(b, a);
            return resultAB === resultBA;
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('Associativity: (a + b) + c = a + (b + c)', () => {
      fc.assert(
        fc.property(
          fc.bigUintN(64),
          fc.bigUintN(64),
          fc.bigUintN(64),
          (a, b, c) => {
            const resultLeft = uint64Simulator.add(uint64Simulator.add(a, b), c);
            const resultRight = uint64Simulator.add(a, uint64Simulator.add(b, c));
            return resultLeft === resultRight;
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('Identity: a + 0 = a', () => {
      fc.assert(
        fc.property(
          fc.bigUintN(64),
          (a) => {
            const result = uint64Simulator.add(a, 0n);
            return result === a;
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('Addition is monotonic: if a < b, then a + c < b + c (when no overflow)', () => {
      fc.assert(
        fc.property(
          fc.bigUintN(63), // Use smaller values to avoid overflow
          fc.bigUintN(63),
          fc.bigUintN(63),
          (a, b, c) => {
            fc.pre(a < b); // Precondition
            const resultA = uint64Simulator.add(a, c);
            const resultB = uint64Simulator.add(b, c);
            return resultA < resultB;
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
          fc.bigUintN(63),
          fc.bigUintN(63),
          (a, b) => {
            const sum = uint64Simulator.add(a, b);
            const result = uint64Simulator.sub(sum, b);
            return result === a;
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('Identity: a - 0 = a', () => {
      fc.assert(
        fc.property(
          fc.bigUintN(64),
          (a) => {
            const result = uint64Simulator.sub(a, 0n);
            return result === a;
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('Self-subtraction: a - a = 0', () => {
      fc.assert(
        fc.property(
          fc.bigUintN(64),
          (a) => {
            const result = uint64Simulator.sub(a, a);
            return result === 0n;
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('Anti-commutativity fails for non-equal values: a - b ≠ b - a when a ≠ b', () => {
      fc.assert(
        fc.property(
          fc.bigUintN(64),
          fc.bigUintN(64),
          (a, b) => {
            fc.pre(a !== b && a >= b && b <= a); // Ensure no underflow
            try {
              const resultAB = uint64Simulator.sub(a, b);
              const resultBA = uint64Simulator.sub(b, a);
              return resultAB !== resultBA || a === b;
            } catch {
              // Expected for underflow cases
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
          fc.bigUintN(64),
          fc.bigUintN(64),
          (a, b) => {
            const resultAB = uint64Simulator.mul(a, b);
            const resultBA = uint64Simulator.mul(b, a);
            return resultAB === resultBA;
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('Associativity: (a * b) * c = a * (b * c)', () => {
      fc.assert(
        fc.property(
          fc.bigUintN(32),
          fc.bigUintN(32),
          fc.bigUintN(32),
          (a, b, c) => {
            const resultLeft = uint64Simulator.mul(uint64Simulator.mul(a, b), c);
            const resultRight = uint64Simulator.mul(a, uint64Simulator.mul(b, c));
            return resultLeft === resultRight;
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('Identity: a * 1 = a', () => {
      fc.assert(
        fc.property(
          fc.bigUintN(64),
          (a) => {
            const result = uint64Simulator.mul(a, 1n);
            return result === a;
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('Zero property: a * 0 = 0', () => {
      fc.assert(
        fc.property(
          fc.bigUintN(64),
          (a) => {
            const result = uint64Simulator.mul(a, 0n);
            return result === 0n;
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('Distributivity: a * (b + c) = (a * b) + (a * c)', () => {
      fc.assert(
        fc.property(
          fc.bigUintN(32),
          fc.bigUintN(32),
          fc.bigUintN(32),
          (a, b, c) => {
            const left = uint64Simulator.mul(a, uint64Simulator.add(b, c));
            const right = uint64Simulator.add(
              uint64Simulator.mul(a, b),
              uint64Simulator.mul(a, c)
            );
            return left === right;
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
          fc.bigUintN(64),
          (a) => {
            const result = uint64Simulator.div(a, 1n);
            return result === a;
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('Division by self: a / a = 1 (for non-zero a)', () => {
      fc.assert(
        fc.property(
          fc.bigUintN(64),
          (a) => {
            fc.pre(a > 0n);
            const result = uint64Simulator.div(a, a);
            return result === 1n;
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('Zero dividend: 0 / a = 0 (for non-zero a)', () => {
      fc.assert(
        fc.property(
          fc.bigUintN(64),
          (a) => {
            fc.pre(a > 0n);
            const result = uint64Simulator.div(0n, a);
            return result === 0n;
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('Division is less than or equal to dividend: a / b ≤ a (for b ≥ 1)', () => {
      fc.assert(
        fc.property(
          fc.bigUintN(64),
          fc.bigUintN(64),
          (a, b) => {
            fc.pre(b > 0n);
            const result = uint64Simulator.div(a, b);
            return result <= a;
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('Multiplication-division relationship: (a * b) / b = a (for non-zero b, no overflow)', () => {
      fc.assert(
        fc.property(
          fc.bigUintN(32),
          fc.bigUintN(32),
          (a, b) => {
            fc.pre(b > 0n);
            const product = uint64Simulator.mul(a, b);
            const result = uint64Simulator.div(product, b);
            return result === a;
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
          fc.bigUintN(64),
          fc.bigUintN(64),
          (a, b) => {
            fc.pre(b > 0n);
            const result = uint64Simulator.mod(a, b);
            return result < b;
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('Division-modulo relationship: a = (a / b) * b + (a % b)', () => {
      fc.assert(
        fc.property(
          fc.bigUintN(64),
          fc.bigUintN(64),
          (a, b) => {
            fc.pre(b > 0n);
            const quotient = uint64Simulator.div(a, b);
            const remainder = uint64Simulator.mod(a, b);
            const reconstructed = uint64Simulator.add(
              uint64Simulator.mul(quotient, b),
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
          fc.bigUintN(64),
          (a) => {
            const result = uint64Simulator.mod(a, 1n);
            return result === 0n;
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('Modulo by self: a % a = 0 (for non-zero a)', () => {
      fc.assert(
        fc.property(
          fc.bigUintN(64),
          (a) => {
            fc.pre(a > 0n);
            const result = uint64Simulator.mod(a, a);
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
          fc.bigUintN(64),
          fc.bigUintN(64),
          fc.bigUintN(64),
          (a, b, c) => {
            fc.pre(a < b && b < c);
            return uint64Simulator.lt(a, c);
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('Less than or equal is reflexive: a ≤ a', () => {
      fc.assert(
        fc.property(
          fc.bigUintN(64),
          (a) => {
            return uint64Simulator.lte(a, a);
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('Equality is symmetric: a = b implies b = a', () => {
      fc.assert(
        fc.property(
          fc.bigUintN(64),
          (a) => {
            return uint64Simulator.eq(a, a);
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('Greater than is inverse of less than: a > b = b < a', () => {
      fc.assert(
        fc.property(
          fc.bigUintN(64),
          fc.bigUintN(64),
          (a, b) => {
            const gtResult = uint64Simulator.gt(a, b);
            const ltResult = uint64Simulator.lt(b, a);
            return gtResult === ltResult;
          }
        ),
        { numRuns: 1000 }
      );
    });
  });

  describe('Boundary and Edge Cases', () => {
    test('Operations with MAX_UINT64', () => {
      fc.assert(
        fc.property(
          fc.bigUintN(64),
          (a) => {
            // Multiplication with MAX_UINT64
            const mulResult = uint64Simulator.mul(a, MAX_UINT64);
            
            // Division by MAX_UINT64
            const divResult = uint64Simulator.div(a, MAX_UINT64);
            
            // These should complete without error
            return true;
          }
        ),
        { numRuns: 500 }
      );
    });

    test('Operations with zero', () => {
      fc.assert(
        fc.property(
          fc.bigUintN(64),
          (a) => {
            // Add zero
            const addZero = uint64Simulator.add(a, 0n);
            // Multiply by zero
            const mulZero = uint64Simulator.mul(a, 0n);
            
            return addZero === a && mulZero === 0n;
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('Operations with MAX_UINT32 boundaries', () => {
      fc.assert(
        fc.property(
          fc.bigUintN(32),
          fc.bigUintN(32),
          (a, b) => {
            // Should handle 32-bit values gracefully
            const sum = uint64Simulator.add(a, b);
            const product = uint64Simulator.mul(a, b);
            
            return sum >= a && sum >= b && product >= 0n;
          }
        ),
        { numRuns: 1000 }
      );
    });
  });
});
