# `@openzeppelin/midnight-apps-math-contracts`

A comprehensive mathematical operations library for Midnight Network smart contracts, providing efficient and secure arithmetic operations for various integer types.

## Overview

This package provides mathematical contract operations for the Midnight Network, including:

- **Uint64 and Uint128 arithmetic operations** with overflow protection
- **Square root calculations** using efficient algorithms
- **Division operations** with quotient and remainder results
- **Witness-based computations** for off-chain calculations
- **Type-safe interfaces** for all mathematical operations

> **Note:** Uint256 operations are currently archived due to breaking changes in Compact compiler v0.27.0 which reduced maximum Uint width from 254 to 248 bits. The Uint256 contract uses `Uint<254>` internally and will be updated in a future release.

## Features

### Supported Integer Types
- `Uint<64>` - 64-bit unsigned integers
- `Uint<128>` - 128-bit unsigned integers  
- `Uint<256>` - 256-bit unsigned integers (archived - see note above)

### Mathematical Operations
- **Basic Arithmetic**: Addition, subtraction, multiplication, division
- **Advanced Operations**: Square root, modulo, power operations
- **Safe Operations**: All operations include overflow/underflow protection
- **Witness Functions**: Off-chain computation capabilities for complex operations

### Key Components

#### Core Contracts
- `Uint64.compact` - 64-bit mathematical operations
- `Uint128.compact` - 128-bit mathematical operations
- `Uint256.compact` - 256-bit mathematical operations (archived)

#### Archived Contracts
- `Field254.compact` - Field arithmetic operations
- `Bytes32.compact` - Byte array operations

#### Utility Functions
- `sqrtBigint()` - Efficient square root calculation using Newton-Raphson method
- `consts.ts` - Mathematical constants

#### Witness Implementations
- Off-chain computation for division and square root operations
- Type-safe witness contexts
- Private state management

## Circuit Information

The following table shows the constraint counts and circuit sizes for each mathematical operation:

### Uint64 Operations
| Operation | Circuit Name | K (Constraint Degree) | Rows |
|-----------|--------------|----------------------|------|
| Division | `div` | 10 | 240 |
| Division with Remainder | `divRem` | 10 | 277 |
| Remainder | `rem` | 10 | 240 |
| Square Root | `sqrt` | 10 | 122 |
| Is Multiple | `isMultiple` | 10 | 243 |

### Uint128 Operations
| Operation | Circuit Name | K (Constraint Degree) | Rows |
|-----------|--------------|----------------------|------|
| Addition | `add` | 10 | 575 |
| Addition (U128) | `addU128` | 10 | 451 |
| Division | `div` | 12 | 2,778 |
| Division with Remainder | `divRem` | 12 | 2,819 |
| Division (U128) | `divU128` | 12 | 2,641 |
| Division with Remainder (U128) | `divRemU128` | 12 | 2,695 |
| Multiplication | `mul` | 11 | 1,874 |
| Multiplication (U128) | `mulU128` | 11 | 1,750 |
| Multiplication (Checked) | `mulChecked` | 11 | 1,876 |
| Multiplication (Checked U128) | `mulCheckedU128` | 11 | 1,752 |
| Remainder | `rem` | 12 | 2,778 |
| Is Multiple | `isMultiple` | 12 | 2,759 |
| Is Multiple (U128) | `isMultipleU128` | 12 | 2,635 |

### Uint256 Operations (Archived)

> These operations are currently archived due to Compact compiler breaking changes. See note above.

| Operation | Circuit Name | K (Constraint Degree) | Rows |
|-----------|--------------|----------------------|------|
| Addition | `add` | 11 | 1,305 |
| Subtraction | `sub` | 11 | 1,271 |
| Division | `div` | 14 | 10,912 |
| Division with Remainder | `divRem` | 14 | 11,020 |
| Multiplication | `mul` | 14 | 9,249 |
| Remainder | `rem` | 14 | 10,912 |
| Square Root | `sqrt` | 14 | 11,693 |
| Is Multiple | `isMultiple` | 14 | 10,897 |
| From U256 | `fromU256` | 10 | 816 |
| To U256 | `toU256` | 10 | 739 |

### Field254 Operations (Archived)
| Operation | Circuit Name | K (Constraint Degree) | Rows |
|-----------|--------------|----------------------|------|
| Addition | `add` | 12 | 3,008 |
| Multiplication | `mul` | 14 | 10,956 |
| Division | `div` | 14 | 12,623 |
| Division with Remainder | `divRem` | 14 | 12,101 |
| Equality | `eq` | 11 | 1,410 |
| Greater Than | `gt` | 11 | 1,495 |
| Greater Than or Equal | `gte` | 11 | 1,518 |
| Less Than | `lt` | 11 | 1,495 |
| Less Than or Equal | `lte` | 11 | 1,518 |
| Is Zero | `isZero` | 10 | 724 |
| From Field | `fromField` | 10 | 739 |
| Maximum | `max` | 12 | 2,208 |
| Minimum | `min` | 12 | 2,208 |

### Bytes32 Operations (Archived)
| Operation | Circuit Name | K (Constraint Degree) | Rows |
|-----------|--------------|----------------------|------|
| Greater Than | `gt` | 12 | 2,639 |
| Greater Than or Equal | `gte` | 12 | 2,643 |
| Less Than | `lt` | 12 | 2,639 |
| Less Than or Equal | `lte` | 12 | 2,643 |

### Circuit Complexity Notes

- **K (Constraint Degree)**: Represents the maximum degree of constraints in the circuit
- **Rows**: Number of constraint rows in the circuit
- **Higher K values** indicate more complex constraints but potentially better performance
- **More rows** generally mean larger proof sizes and longer verification times
- **U64 operations** are the most efficient with the lowest constraint counts
- **U256 operations** require the most constraints due to larger bit widths
- **Field operations** have moderate complexity but provide field arithmetic guarantees

## Installation

```bash
pnpm add @openzeppelin/midnight-apps-math-contracts
```

## Usage

### Basic Import

```typescript
import { 
  Uint64Witnesses, 
  sqrtBigint,
  type Uint64PrivateState 
} from '@openzeppelin/midnight-apps-math-contracts';
```

### Square Root Calculation

```typescript
import { sqrtBigint } from '@openzeppelin/midnight-apps-math-contracts';

// Calculate square root of a bigint
const result = sqrtBigint(16n); // Returns 4n
const largeNumber = sqrtBigint(1000000000000n); // Efficient for large numbers
```

### Witness Operations

```typescript
import { Uint64Witnesses } from '@openzeppelin/midnight-apps-math-contracts';

// Create witness implementations
const witnesses = Uint64Witnesses();

// Use in contract context
const [newState, sqrtResult] = witnesses.sqrtU64Locally(context, 64n);
const [newState2, divResult] = witnesses.divU64Locally(context, 10n, 3n);
// divResult = { quotient: 3n, remainder: 1n }
```

### Contract Interfaces

The package provides Compact interfaces for mathematical operations:

```compact
// Example: Uint64 interface
module Uint64 {
    export struct DivResultU64 {
        quotient: Uint<64>,
        remainder: Uint<64>
    }

    export witness divU64Locally(a: Uint<64>, b: Uint<64>): DivResultU64;
    export witness sqrtU64Locally(radicand: Uint<64>): Uint<32>;
}
```

## API Reference

### Utility Functions

#### `sqrtBigint(value: bigint): bigint`
Computes the square root of a non-negative bigint using the Newton-Raphson method.

**Parameters:**
- `value` - The non-negative bigint to compute the square root of

**Returns:**
- The floor of the square root as a bigint

**Throws:**
- Error if the input value is negative

**Example:**
```typescript
sqrtBigint(16n) // Returns 4n
sqrtBigint(15n) // Returns 3n (floor of sqrt)
```

### Witness Functions

#### `Uint64Witnesses()`
Factory function that creates witness implementations for Uint64 operations.

**Returns:**
- Object implementing `Uint64Witnesses` interface

**Available Methods:**
- `sqrtU64Locally(context, radicand)` - Computes square root off-chain
- `divU64Locally(context, dividend, divisor)` - Computes division off-chain

### Types

#### `Uint64PrivateState`
Type representing the private state of the Uint64 module.

#### `DivResultU64`
Structure containing division results:
```typescript
{
  quotient: bigint,
  remainder: bigint
}
```

## Development

### Prerequisites
- Node.js 18+
- pnpm 10.4.1+
- TypeScript 5.8+

### Setup
```bash
pnpm install
```

### Available Scripts

```bash
# Build the package
pnpm build

# Run tests
pnpm test

# Type checking
pnpm types

# Check formatting and linting
pnpm lint

# Fix formatting and linting
pnpm lint:fix

# Lint code
pnpm lint

# Fix linting issues
pnpm lint:fix

# Pre-commit checks
pnpm precommit
```

### Testing

The package includes comprehensive tests for all mathematical operations:

```bash
# Run all tests
pnpm test

# Run tests with console trace
pnpm test --printConsoleTrace
```

## Architecture

### Contract Structure
```
src/
├── interfaces/          # Compact interfaces
├── witnesses/          # Witness implementations
├── utils/             # Utility functions
├── types/             # TypeScript type definitions
├── test/              # Test utilities
└── artifacts/         # Generated artifacts
```

### Key Design Principles

1. **Type Safety**: All operations are fully typed with TypeScript
2. **Overflow Protection**: Built-in protection against integer overflow
3. **Efficiency**: Optimized algorithms for large number operations
4. **Witness Pattern**: Off-chain computation for complex operations
5. **Modularity**: Separate contracts for different integer sizes

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## License

ISC License - see package.json for details.

## Related Packages

- `@openzeppelin/midnight-apps-compact` - Core Compact framework
- `@midnight-ntwrk/compact-runtime` - Runtime utilities
- `@midnight-ntwrk/zswap` - ZK-SNARK operations
