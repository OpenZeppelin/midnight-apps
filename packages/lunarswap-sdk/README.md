# Lunarswap SDK

A TypeScript SDK for Lunarswap liquidity calculations. Provides a simple function to calculate minimum amounts for `addLiquidity` calls.

## Installation

```bash
pnpm add @midnight-dapps/lunarswap-sdk
```

## Usage

### Calculate Minimum Amounts for addLiquidity

```typescript
import { 
  calculateLiquidityAmounts, 
  SLIPPAGE_TOLERANCE 
} from '@midnight-dapps/lunarswap-sdk';

// Calculate minimum amounts for adding liquidity to an existing pair
const result = calculateLiquidityAmounts(
  1000n,  // desired USDC
  1000n,  // desired NIGHT
  2000n,  // reserve USDC
  1000n,  // reserve NIGHT
  SLIPPAGE_TOLERANCE.LOW // 0.5%
);

console.log(result);
// {
//   amountAOptimal: 1000n,  // Optimal USDC amount
//   amountBOptimal: 500n,   // Optimal NIGHT amount (maintains ratio)
//   amountAMin: 995n,       // Minimum USDC with 0.5% slippage
//   amountBMin: 497n        // Minimum NIGHT with 0.5% slippage
// }

// Use in addLiquidity call
lunarswap.addLiquidity(
  usdcCoin,
  nightCoin,
  result.amountAMin,  // amountAMin
  result.amountBMin,  // amountBMin
  recipient
);
```

### Adding Liquidity to New Pairs

```typescript
// For new pairs (first liquidity provision)
const result = calculateLiquidityAmounts(
  2000n,  // desired USDC
  1000n,  // desired NIGHT
  0n,     // reserve USDC (new pair)
  0n,     // reserve NIGHT (new pair)
  SLIPPAGE_TOLERANCE.LOW
);

// amountAMin and amountBMin will be ~95% of desired amounts
```

### Slippage Tolerance Options

```typescript
import { SLIPPAGE_TOLERANCE } from '@midnight-dapps/lunarswap-sdk';

// Available slippage tolerance values:
// SLIPPAGE_TOLERANCE.VERY_LOW  // 0.1%
// SLIPPAGE_TOLERANCE.LOW       // 0.5%
// SLIPPAGE_TOLERANCE.MEDIUM    // 1%
// SLIPPAGE_TOLERANCE.HIGH      // 5%
// SLIPPAGE_TOLERANCE.VERY_HIGH // 10%
```

## API Reference

### `calculateLiquidityAmounts`

Main function for calculating optimal and minimum amounts when adding liquidity.

```typescript
function calculateLiquidityAmounts(
  amountADesired: bigint,
  amountBDesired: bigint,
  reserveA: bigint,
  reserveB: bigint,
  slippageTolerance: number
): {
  amountAOptimal: bigint;
  amountBOptimal: bigint;
  amountAMin: bigint;
  amountBMin: bigint;
}
```

**Parameters:**
- `amountADesired` - The desired amount of token A
- `amountBDesired` - The desired amount of token B  
- `reserveA` - Current reserve of token A in the pair
- `reserveB` - Current reserve of token B in the pair
- `slippageTolerance` - Slippage tolerance in basis points (e.g., 50 = 0.5%)

**Returns:**
- `amountAOptimal` - Optimal amount of token A
- `amountBOptimal` - Optimal amount of token B
- `amountAMin` - Minimum acceptable amount of token A (with slippage)
- `amountBMin` - Minimum acceptable amount of token B (with slippage)

### `SLIPPAGE_TOLERANCE`

Predefined slippage tolerance values in basis points.

```typescript
const SLIPPAGE_TOLERANCE = {
  VERY_LOW: 10,    // 0.1%
  LOW: 50,         // 0.5%
  MEDIUM: 100,     // 1%
  HIGH: 500,       // 5%
  VERY_HIGH: 1000  // 10%
} as const;
```

## Development

### Setup

```bash
# Install dependencies
pnpm install

# Build the package
pnpm build

# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Lint code
pnpm lint

# Format code
pnpm fmt
```

## License

ISC 