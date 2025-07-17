# Shielded Token CLI

A command-line interface for interacting with Shielded Token contracts on the Midnight network.

## Overview

The Shielded Token CLI provides easy-to-use commands for:
- Deploying new Shielded Token contracts
- Minting tokens to recipients
- Burning tokens
- Viewing token information

## Installation

```bash
cd packages/shielded-token-cli
pnpm install
```

## Quick Start

### 1. Deploy a Contract

```bash
# Deploy a new Shielded Token contract
pnpm deploy 0000000000000000000000000000000000000000000000000000000000000001 "My Token" "MTK" 0000000000000000000000000000000000000000000000000000000000000002
```

### 2. Set Contract Address

```bash
# Set the contract address for subsequent commands
export SHIELDED_TOKEN_CONTRACT_ADDRESS="0x1234567890abcdef..."
```

### 3. Mint Tokens

```bash
# Mint 1000 tokens to a recipient
pnpm mint 0x1234567890abcdef1234567890abcdef12345678 1000000000000000000000
```

### 4. View Token Information

```bash
# Get information about the token
pnpm info
```

## Commands

### Deploy

Deploys a new Shielded Token contract.

```bash
pnpm deploy <nonce> <name> <symbol> <domain>
```

**Parameters:**
- `nonce` - 32-byte hex string for contract nonce
- `name` - Token name (e.g., "My Shielded Token")
- `symbol` - Token symbol (e.g., "MST")
- `domain` - 32-byte hex string for contract domain

**Examples:**
```bash
# Without 0x prefix
pnpm deploy 0000000000000000000000000000000000000000000000000000000000000001 "My Token" "MTK" 0000000000000000000000000000000000000000000000000000000000000002

# With 0x prefix
pnpm deploy 0x0000000000000000000000000000000000000000000000000000000000000001 "My Token" "MTK" 0x0000000000000000000000000000000000000000000000000000000000000002
```

### Mint

Mints tokens to a recipient.

```bash
pnpm mint <recipient> <amount>
```

**Parameters:**
- `recipient` - Hex address of the recipient
- `amount` - Amount of tokens to mint (in smallest unit)

**Examples:**
```bash
# Mint 1 token (with 18 decimals)
pnpm mint 0x1234567890abcdef1234567890abcdef12345678 1000000000000000000

# Mint 1000 tokens
pnpm mint 1234567890abcdef1234567890abcdef12345678 1000000000000000000000
```

### Burn

Burns tokens from a coin.

```bash
pnpm burn <coinColor> <coinValue> <amount>
```

**Parameters:**
- `coinColor` - Hex color of the coin to burn
- `coinValue` - Total value of the coin
- `amount` - Amount of tokens to burn (must be <= coinValue)

**Examples:**
```bash
# Burn 500 tokens from a 1000 token coin
pnpm burn 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef 1000000000000000000000 500000000000000000000
```

### Info

Displays information about the deployed Shielded Token contract.

```bash
pnpm info
```

**Output:**
```
📋 Shielded Token Information
============================
Contract Address: 0x1234567890abcdef...
Token Name: My Token
Token Symbol: MTK
Decimals: 18
Total Supply: 1000000000000000000000
Formatted Supply: 1000.0 MTK

Available Commands:
  pnpm mint <recipient> <amount>  - Mint tokens to a recipient
  pnpm burn <coinColor> <coinValue> <amount>  - Burn tokens
  pnpm info  - Show this information
```

## Environment Variables

The CLI uses the following environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `SHIELDED_TOKEN_NETWORK_ID` | Network ID | `testnet` |
| `SHIELDED_TOKEN_RPC_URL` | RPC endpoint URL | `http://localhost:8080` |
| `SHIELDED_TOKEN_CONTRACT_ADDRESS` | Address of deployed contract | Required for mint/burn/info |
| `SHIELDED_TOKEN_TEST_SEED` | Test wallet seed | Optional |
| `SHIELDED_TOKEN_LOG_LEVEL` | Logging level | `info` |

## Examples

### Complete Workflow

```bash
# 1. Deploy a new token
pnpm deploy 0000000000000000000000000000000000000000000000000000000000000001 "My Shielded Token" "MST" 0000000000000000000000000000000000000000000000000000000000000002

# 2. Set the contract address (from the output above)
export SHIELDED_TOKEN_CONTRACT_ADDRESS="0x1234567890abcdef..."

# 3. Check token information
pnpm info

# 4. Mint tokens to yourself
pnpm mint 0x1234567890abcdef1234567890abcdef12345678 1000000000000000000000

# 5. Mint tokens to another address
pnpm mint 0xabcdef1234567890abcdef1234567890abcdef12 500000000000000000000

# 6. Check updated information
pnpm info
```

### Advanced Usage

```bash
# Deploy with custom network settings
SHIELDED_TOKEN_NETWORK_ID=mainnet \
SHIELDED_TOKEN_RPC_URL=https://mainnet.midnight.network \
pnpm deploy 0000000000000000000000000000000000000000000000000000000000000001 "Production Token" "PROD" 0000000000000000000000000000000000000000000000000000000000000002

# Use with verbose logging
SHIELDED_TOKEN_LOG_LEVEL=debug pnpm mint 0x1234567890abcdef1234567890abcdef12345678 1000000000000000000
```

## Error Handling

The CLI provides clear error messages for common issues:

- **Missing contract address**: Set `SHIELDED_TOKEN_CONTRACT_ADDRESS`
- **Invalid hex format**: Ensure hex strings are properly formatted
- **Invalid amounts**: Amounts must be positive integers
- **Insufficient coin value**: Burn amount cannot exceed coin value

## Development

### Building
```bash
pnpm run build
```

### Formatting
```bash
pnpm run fmt
```

### Linting
```bash
pnpm run lint
pnpm run lint:fix
```

### Type Checking
```bash
pnpm run types
```

## Dependencies

- `@midnight-dapps/shielded-token-api` - The Shielded Token API
- `@midnight-dapps/shielded-token-contract` - The Shielded Token contract
- `@midnight-ntwrk/compact-runtime` - Compact runtime utilities
- `@midnight-ntwrk/zswap` - Zswap protocol integration
- `pino` - Logging
- `pino-pretty` - Pretty logging output 