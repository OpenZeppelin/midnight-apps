# Shielded Fungible Token Contract

This package contains the Shielded Fungible Token contract implementation for Midnight DApps.

## Overview

The Shielded Fungible Token is a privacy-preserving fungible token implementation that provides:
- **Minting**: Create new tokens and send them to recipients
- **Burning**: Destroy tokens and optionally return change
- **Privacy**: All operations are shielded using zero-knowledge proofs
- **ERC20 Compatibility**: Follows ERC20 standard interface

## Structure

```
src/
├── ShieldedFungibleToken.compact    # Main contract implementation
├── Index.compact                    # Contract exports
├── index.ts                         # TypeScript exports
├── types/                           # Type definitions
│   ├── index.ts                     # Main types
│   ├── test.ts                      # Test interface types
│   └── state.ts                     # State types
├── witnesses/                       # Witness implementations
│   └── index.ts                     # Witness factory
└── test/                            # Test files
    ├── ShieldedFungibleTokenSimulator.ts  # Contract simulator
    └── ShieldedFungibleToken.test.ts      # Test suite
```

## Usage

### Installation

```bash
cd contracts/shielded-token
pnpm install
```

### Building

```bash
# Compile the contract
pnpm run compact

# Build TypeScript
pnpm run build
```

### Testing

```bash
# Run all tests
pnpm test

# Run tests with verbose output
pnpm test --printConsoleTrace
```

### Development

```bash
# Format code
pnpm run fmt

# Lint code
pnpm run lint

# Fix linting issues
pnpm run lint:fix

# Type checking
pnpm run types
```

## Contract Interface

### Constructor
```typescript
constructor(
    nonce: Bytes<32>,
    name: Opaque<"string">,
    symbol: Opaque<"string">,
    domain: Bytes<32>
)
```

### Functions

#### `name(): Opaque<"string">`
Returns the token name.

#### `symbol(): Opaque<"string">`
Returns the token symbol.

#### `decimals(): Uint<8>`
Returns the number of decimals (always 18).

#### `totalSupply(): Uint<128>`
Returns the total supply of tokens.

#### `mint(recipient: Either<ZswapCoinPublicKey, ContractAddress>, amount: Uint<128>): CoinInfo`
Mints new tokens and sends them to the specified recipient.

#### `burn(coin: CoinInfo, amount: Uint<128>): SendResult`
Burns the specified amount of tokens from the provided coin and returns the burned amount plus any change.

## Testing

The test suite covers:

1. **Constructor and Initialization**
   - Token properties (name, symbol, decimals)
   - Contract address and sender validation

2. **Mint Functionality**
   - Basic minting to recipients
   - Multiple recipients
   - Zero amounts
   - Large amounts
   - Contract addresses

3. **Burn Functionality**
   - Basic burning with change
   - Burning entire coins
   - Zero amount burning
   - Error handling for insufficient amounts

4. **Integration Tests**
   - Mint-burn-mint cycles
   - Multiple burns from same coin
   - State consistency

5. **Edge Cases**
   - Very large amounts
   - Smallest amounts
   - State management

6. **Contract State Management**
   - Public/private state access
   - Circuit context maintenance

## Mathematical Calculations

The tests include detailed mathematical calculations for:
- Total supply tracking
- Mint/burn operations
- Change calculations
- Liquidity management

## Examples

### Basic Usage

```typescript
import { ShieldedFungibleTokenSimulator } from './test/ShieldedFungibleTokenSimulator';

// Create a new token
const token = new ShieldedFungibleTokenSimulator(
    new Uint8Array(32).fill(0x44), // nonce
    "My Token",                     // name
    "MTK",                          // symbol
    new Uint8Array(32).fill(0x44)  // domain
);

// Mint tokens
const recipient = createEitherFromHex("user_address_hex");
const coin = token.mint(recipient, 1000n);

// Burn tokens
const burnResult = token.burn(coin, 300n);
```

## Dependencies

- `@midnight-dapps/compact`: Compact language runtime
- `@midnight-dapps/compact-std`: Standard library
- `@midnight-ntwrk/compact-runtime`: Runtime utilities
- `@midnight-ntwrk/zswap`: Zswap protocol integration
- `vitest`: Testing framework
- `typescript`: Type checking
- `biome`: Code formatting and linting 