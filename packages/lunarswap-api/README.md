# LunarSwap API

This package provides a TypeScript API for interacting with LunarSwap contracts on the Midnight network.

## Features

- **Contract Deployment**: Deploy new LunarSwap contracts
- **Contract Joining**: Connect to existing deployed contracts
- **Liquidity Operations**: Add and remove liquidity from trading pairs
- **Swap Operations**: Execute token swaps with exact input or output amounts
- **State Management**: Reactive state observables for contract state
- **Type Safety**: Full TypeScript support with proper type definitions

## Installation

From the root of the midnight-dapps project:

```bash
pnpm install
```

## Usage

### Basic Setup

```typescript
import { Lunarswap } from '@midnight-dapps/lunarswap-api';
import type { LunarswapProviders } from '@midnight-dapps/lunarswap-api';

// Set up your providers
const providers: LunarswapProviders = {
  // ... provider configuration
};

// Deploy a new contract
const lunarswap = await Lunarswap.deploy(providers, signingKey, logger);

// Or join an existing contract
const lunarswap = await Lunarswap.join(providers, contractAddress, logger);
```

### Adding Liquidity

```typescript
import type { CoinInfo, Either, ZswapCoinPublicKey, ContractAddress } from '@midnight-dapps/compact-std';

const tokenA: CoinInfo = { /* token A info */ };
const tokenB: CoinInfo = { /* token B info */ };
const to: Either<ZswapCoinPublicKey, ContractAddress> = { /* recipient */ };

await lunarswap.addLiquidity(
  tokenA,
  tokenB,
  BigInt(1000000), // amountAMin
  BigInt(2000000), // amountBMin
  to
);
```

### Removing Liquidity

```typescript
const liquidity: CoinInfo = { /* LP token info */ };

const [amountA, amountB] = await lunarswap.removeLiquidity(
  tokenA,
  tokenB,
  liquidity,
  BigInt(500000), // amountAMin
  BigInt(1000000), // amountBMin
  to
);
```

### Swapping Tokens

```typescript
// Exact input swap
await lunarswap.swapExactTokensForTokens(
  tokenIn,
  tokenOut,
  BigInt(1000000), // amountIn
  BigInt(950000),  // amountOutMin
  to
);

// Exact output swap
await lunarswap.swapTokensForExactTokens(
  tokenIn,
  tokenOut,
  BigInt(1000000), // amountOut
  BigInt(1100000), // amountInMax
  to
);
```

### State Observables

```typescript
// Subscribe to contract state changes
lunarswap.state$.subscribe((state) => {
  console.log('Pool state:', state.pool);
  console.log('Private state:', state.privateState);
});
```

## API Reference

### Classes

#### `Lunarswap`

Main class for interacting with LunarSwap contracts.

**Static Methods:**
- `deploy(providers, signingKey, logger?)` - Deploy a new contract
- `join(providers, contractAddress, logger?)` - Join existing contract

**Instance Methods:**
- `addLiquidity(tokenA, tokenB, amountAMin, amountBMin, to)` - Add liquidity
- `removeLiquidity(tokenA, tokenB, liquidity, amountAMin, amountBMin, to)` - Remove liquidity
- `swapExactTokensForTokens(tokenIn, tokenOut, amountIn, amountOutMin, to)` - Exact input swap
- `swapTokensForExactTokens(tokenIn, tokenOut, amountOut, amountInMax, to)` - Exact output swap

**Properties:**
- `deployedContractAddress` - Contract address
- `state$` - Observable of contract state

### Types

- `LunarswapProviders` - Provider configuration
- `LunarswapPublicState` - Public contract state
- `LunarswapPrivateStates` - Private state types
- `DeployedLunarswapContract` - Deployed contract instance
- `ILunarswap` - Interface for LunarSwap operations

## Constructor Parameters

When deploying a new contract, the following parameters are used:

- **LP Token Name**: "Lunarswap LP" (default)
- **LP Token Symbol**: "LP" (default)
- **LP Token Nonce**: Random 32-byte nonce
- **LP Token Decimals**: 18 (default)
- **Fee To Setter**: Address that can modify protocol fees

## Development

### Building

```bash
cd packages/lunarswap-api
pnpm run build
```

### Type Checking

```bash
pnpm run typecheck
```

### Linting

```bash
pnpm run lint
```

## Dependencies

- `@midnight-dapps/lunarswap-v1` - Contract definitions
- `@midnight-dapps/compact-std` - Standard types
- `@midnight-ntwrk/compact-runtime` - Runtime utilities
- `@midnight-ntwrk/midnight-js-contracts` - Contract deployment
- `@midnight-ntwrk/midnight-js-types` - Midnight types
- `rxjs` - Reactive programming
- `pino` - Logging

## Contributing

This API is part of the midnight-dapps project. Please refer to the main project README for contribution guidelines. 