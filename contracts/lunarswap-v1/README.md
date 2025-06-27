# <img src="../../static/logo.svg" alt="Lunarswap Logo" width="40" height="40" style="vertical-align: middle;"> <span style="background: linear-gradient(to right, #1f2937, #2563eb); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; font-weight: bold; letter-spacing: -0.025em;">Lunarswap</span>-V1 (UTXO)

A decentralized exchange (DEX) protocol built on the Midnight Network using Compact smart contracts, implementing an automated market maker (AMM) with privacy-preserving features. **Based on Uniswap V2 architecture, adapted for privacy-first blockchain infrastructure.**

## Overview

Lunarswap-V1 is a next-generation decentralized exchange that combines the efficiency of automated market making with the privacy and security features of the Midnight Network. Built using the Compact programming language and **based on the proven Uniswap V2 architecture**, it provides a robust foundation for decentralized trading with enhanced privacy through UTXO-based token management.

**Key Differences from Uniswap V2:**
- **Privacy-First**: UTXO-based token model with shielded transactions
- **Midnight Network**: Built on Midnight Network instead of Ethereum
- **Compact Language**: Written in Compact instead of Solidity
- **Enhanced Security**: Additional privacy and security features

### Key Features

- **Automated Market Making**: Constant product formula for efficient price discovery (Uniswap V2 model)
- **Privacy-Preserving**: UTXO-based token model with shielded transactions
- **Liquidity Provision**: LP token system for liquidity provider rewards
- **Protocol Fees**: Configurable fee collection for sustainable development
- **Price Oracle**: VWAP tracking for external integrations
- **Factory Pattern**: Efficient pair creation and management
- **Router Interface**: User-friendly liquidity operations

## Architecture

Lunarswap V1 follows a modular architecture with clear separation of concerns:

```
Lunarswap Protocol
├── Lunarswap (Main Contract)
│   ├── Router Interface
│   ├── Factory Management
│   └── Fee System
├── LunarswapFactory
│   ├── Pair Creation
│   ├── Pair Storage
│   └── Reserve Management
├── LunarswapPair
│   ├── Liquidity Provision
│   ├── Fee Calculation
│   └── Price Oracle
├── LunarswapRouter
│   ├── User Interface
│   ├── Token Splitting
│   └── Optimal Calculations
├── LunarswapLpTokens
│   ├── Token Minting
│   ├── Token Burning
│   └── Supply Tracking
├── LunarswapFee
│   ├── Fee Collection
│   ├── Fee Distribution
│   └── Access Control
└── LunarswapLibrary
    ├── Mathematical Operations
    ├── Token Utilities
    └── Identity Generation
```

## Smart Contracts

### Core Contracts

#### `Lunarswap.compact`
Main protocol contract providing the primary interface for all Lunarswap operations.

**Key Functions:**
- `addLiquidity()` - Add liquidity to trading pairs
- `getPair()` - Retrieve pair information
- `getPairReserves()` - Get current reserves
- `isPairExists()` - Check pair existence

#### `LunarswapFactory.compact`
Factory contract responsible for creating and managing trading pairs.

**Key Functions:**
- `createPair()` - Create new trading pairs
- `getPair()` - Retrieve pair data
- `getReserves()` - Get pair reserves
- `updatePair()` - Update pair state

#### `LunarswapPair.compact`
Core trading pair implementation handling liquidity and trading logic.

**Key Functions:**
- `mint()` - Mint LP tokens for liquidity providers
- `initializePair()` - Initialize new pairs
- `_mintFee()` - Calculate and distribute protocol fees

#### `LunarswapRouter.compact`
User-friendly interface for liquidity operations.

**Key Functions:**
- `addLiquidity()` - Simplified liquidity addition
- `_addLiquidity()` - Optimal amount calculation

### Supporting Contracts

#### `LunarswapLpTokens.compact`
Manages liquidity provider token lifecycle.

#### `LunarswapFee.compact`
Handles protocol fee collection and distribution.

#### `LunarswapLibrary.compact`
Utility library for mathematical operations and token utilities.

## Development Setup

### Prerequisites

- **Node.js**: Version 22.14.0 or higher
- **pnpm**: Version 10.4.1 or higher
- **Compact Compiler**: Latest version

### Installation

1. **Clone the Repository**:
   ```bash
   git clone <repository-url>
   cd midnight-dapps
   ```

2. **Install Dependencies**:
   ```bash
   pnpm install
   ```

3. **Build Contracts**:
   ```bash
   pnpm build:contracts
   ```

### Development Commands

```bash
# Compile Compact contracts
pnpm compact

# Build all contracts
pnpm build:contracts

# Run tests
pnpm test

# Type checking
pnpm types

# Code formatting
pnpm fmt

# Linting
pnpm lint
```

## Usage Examples

### Adding Liquidity

```typescript
// Add liquidity to a trading pair
const result = await lunarswap.addLiquidity(
  tokenA,           // First token
  tokenB,           // Second token
  amountAMin,       // Minimum amount of tokenA
  amountBMin,       // Minimum amount of tokenB
  recipient         // LP token recipient
);
```

### Checking Pair Information

```typescript
// Check if a pair exists
const exists = await lunarswap.isPairExists(tokenA, tokenB);

// Get pair reserves
const [reserveA, reserveB] = await lunarswap.getPairReserves(tokenA, tokenB);

// Get pair identity
const identity = await lunarswap.getPairIdentity(tokenA, tokenB);
```

### LP Token Operations

```typescript
// Get LP token metadata
const name = await lunarswap.getLpTokenName();
const symbol = await lunarswap.getLpTokenSymbol();
const decimals = await lunarswap.getLpTokenDecimals();

// Get total supply for a pair
const totalSupply = await lunarswap.getLpTokenTotalSupply(tokenA, tokenB);
```

## Protocol Mechanics

### Constant Product Formula

Lunarswap uses the constant product formula: `x * y = k`

Where:
- `x` = reserve of token A
- `y` = reserve of token B
- `k` = constant product

### Liquidity Provision

1. **First Liquidity**: Uses geometric mean calculation
2. **Subsequent Liquidity**: Uses ratio-based calculation
3. **Minimum Liquidity**: Prevents division by zero issues

### Fee Structure

- **Trading Fee**: 0.3% per trade
- **Protocol Fee**: Configurable (0.05% of trading fee)
- **LP Fee**: Remaining 0.25% distributed to liquidity providers

### Price Oracle

Lunarswap provides price oracle functionality through:
- VWAP (Volume Weighted Average Price) tracking
- Cumulative price and volume data
- Time-weighted price calculations

#### Why VWAP Instead of TWAP?

Lunarswap uses **VWAP (Volume Weighted Average Price)** instead of TWAP (Time Weighted Average Price) primarily due to **Compact language limitations**:

**Technical Constraint:**
- **No Timestamp Access**: Compact language currently does not support reading block timestamps like Solidity's `block.timestamp`
- **TWAP Requirement**: TWAP calculations require time-based data to weight prices by time intervals
- **VWAP Alternative**: VWAP uses volume data which is readily available in the UTXO model

**VWAP Implementation:**
- **Volume-Based Weighting**: Uses trading volume as the weighting factor instead of time
- **Available Data**: Leverages volume information that's naturally tracked in the UTXO model
- **No Time Dependency**: Eliminates the need for timestamp access

**Future Enhancement:**
- **Compact Language Evolution**: Timestamp support is planned for future Compact language versions
- **TWAP Implementation**: Once timestamp access is available, TWAP could be implemented as an additional oracle option
- **Hybrid Approach**: Future versions may support both VWAP and TWAP for different use cases

**Implementation Details:**
- VWAP calculation: `Σ(Price × Volume) / Σ(Volume)`
- Cumulative tracking of both price and volume data
- Real-time updates with each trade
- Historical data preservation for external integrations

This technical constraint-driven choice actually provides additional benefits for DeFi applications while working within Compact's current capabilities.

## Security Features

### Reentrancy Protection
- UTXO-based token model prevents reentrancy attacks
- Atomic operations ensure state consistency

### Slippage Protection
- Minimum amount requirements for all operations
- User-defined slippage tolerance

### Overflow Protection
- Checked arithmetic operations
- Safe mathematical libraries

### Access Control
- Fee setter privileges for administrative functions
- One-way privilege transfer mechanism

## Testing

### Running Tests

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test lunarswap.test.ts

# Run tests with coverage
pnpm test --coverage
```

### Test Structure

- **Unit Tests**: Individual contract function testing
- **Integration Tests**: Cross-contract interaction testing
- **Security Tests**: Vulnerability and edge case testing

## Contributing

### Development Workflow

1. **Fork the Repository**
2. **Create Feature Branch**: `git checkout -b feature/amazing-feature`
3. **Make Changes**: Follow coding standards and add tests
4. **Commit Changes**: Use conventional commit format
5. **Push Changes**: `git push origin feature/amazing-feature`
6. **Create Pull Request**: Provide detailed description

### Code Standards

- **Compact Code**: Follow Compact language best practices
- **Documentation**: Add comprehensive JSDoc comments
- **Testing**: Maintain high test coverage
- **Linting**: Ensure code passes all linting rules

### Commit Convention

Use conventional commit format:
```
type(scope): description

feat(router): add deadline support for transactions
fix(pair): resolve overflow in liquidity calculation
docs(library): update mathematical function documentation
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- **Documentation**: [Lunarswap Docs](docs/)
- **Issues**: [GitHub Issues](https://github.com/midnight-dapps/lunarswap/issues)
- **Discussions**: [GitHub Discussions](https://github.com/midnight-dapps/lunarswap/discussions)

## Acknowledgments

- Built on the Midnight Network
- Based on Uniswap V2 architecture and design patterns
- Developed using Compact programming language
- Community-driven development and feedback
