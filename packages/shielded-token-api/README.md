# Shielded Token API

This package provides a TypeScript API for interacting with Shielded Token contracts on the Midnight network.

## Overview

The Shielded Token API allows you to:
- Deploy new Shielded Token contracts
- Join existing Shielded Token contracts
- Mint tokens to recipients
- Burn tokens
- Get contract state information

## Installation

```bash
cd packages/shielded-token-api
pnpm install
```

## Usage

### Basic Setup

```typescript
import { ShieldedToken } from '@midnight-dapps/shielded-token-api';
import type { ShieldedTokenProviders } from '@midnight-dapps/shielded-token-api';
import pino from 'pino';

// Create logger
const logger = pino({ level: 'info' });

// Create providers (you'll need to implement these based on your setup)
const providers: ShieldedTokenProviders = {
  publicDataProvider: /* your public data provider */,
  privateStateProvider: /* your private state provider */,
  logger
};
```

### Deploying a Contract

```typescript
// Constructor parameters
const nonce = new Uint8Array(32).fill(0x01); // 32-byte nonce
const name = "My Shielded Token";
const symbol = "MST";
const domain = new Uint8Array(32).fill(0x02); // 32-byte domain

// Deploy the contract using static method
const shieldedToken = await ShieldedToken.deploy(
  providers,
  nonce,
  name,
  symbol,
  domain,
  logger
);

console.log('Contract deployed at:', shieldedToken.deployedContractAddressHex);
```

### Joining an Existing Contract

```typescript
import type { ContractAddress } from '@midnight-dapps/compact-std';

const contractAddress: ContractAddress = {
  bytes: Buffer.from("0x1234567890abcdef...", 'hex')
};

const shieldedToken = await ShieldedToken.join(
  providers,
  contractAddress,
  logger
);
```

### Getting Contract State

```typescript
// Subscribe to state changes
shieldedToken.state$.subscribe((state) => {
  console.log('Ledger state:', state.ledger);
  console.log('Private state:', state.privateState);
});

// Get public state
const publicState = await ShieldedToken.getPublicState(
  providers,
  contractAddress
);

// Get Zswap chain state
const zswapState = await ShieldedToken.getZswapChainState(
  providers,
  contractAddress
);
```

### Minting Tokens

```typescript
import type { Either, ZswapCoinPublicKey, ContractAddress } from '@midnight-dapps/compact-std';

// Create recipient (either a public key or contract address)
const recipient: Either<ZswapCoinPublicKey, ContractAddress> = {
  is_left: true,
  left: { bytes: Buffer.from("0x1234567890abcdef1234567890abcdef12345678", 'hex') },
  right: { bytes: new Uint8Array(32) }
};

const amount = 1000000000000000000n; // 1 token with 18 decimals

await shieldedToken.mint(recipient, amount);
```

### Burning Tokens

```typescript
import type { CoinInfo } from '@midnight-dapps/compact-std';

// Create coin info
const coin: CoinInfo = {
  color: { bytes: Buffer.from("0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef", 'hex') },
  value: 1000000000000000000n
};

const burnAmount = 500000000000000000n; // Burn half the coin

await shieldedToken.burn(coin, burnAmount);
```

## API Reference

### ShieldedToken

#### Static Methods

##### `deploy(providers, nonce, name, symbol, domain, logger?)`
Deploys a new Shielded Token contract.

- `providers: ShieldedTokenProviders` - Provider configuration
- `nonce: Uint8Array` - 32-byte nonce for the contract
- `name: string` - Token name
- `symbol: string` - Token symbol
- `domain: Uint8Array` - 32-byte domain for the contract
- `logger?: Logger` - Optional logger

Returns: `Promise<ShieldedToken>`

##### `join(providers, contractAddress, logger?)`
Joins an existing Shielded Token contract.

- `providers: ShieldedTokenProviders` - Provider configuration
- `contractAddress: ContractAddress` - Address of the deployed contract
- `logger?: Logger` - Optional logger

Returns: `Promise<ShieldedToken>`

##### `getPublicState(providers, contractAddress)`
Gets the public state of a contract.

- `providers: ShieldedTokenProviders` - Provider configuration
- `contractAddress: ContractAddress` - Contract address

Returns: `Promise<Ledger | null>`

##### `getZswapChainState(providers, contractAddress)`
Gets the Zswap chain state for a contract.

- `providers: ShieldedTokenProviders` - Provider configuration
- `contractAddress: ContractAddress` - Contract address

Returns: `Promise<ZswapChainState | null>`

#### Instance Methods

##### `mint(recipient, amount)`
Mints tokens to a recipient.

- `recipient: Either<ZswapCoinPublicKey, ContractAddress>` - Recipient address
- `amount: bigint` - Amount to mint

Returns: `Promise<void>`

##### `burn(coin, amount)`
Burns tokens from a coin.

- `coin: CoinInfo` - Coin to burn from
- `amount: bigint` - Amount to burn

Returns: `Promise<void>`

#### Properties

- `deployedContractAddressHex: string` - The deployed contract address
- `state$: Observable<ShieldedTokenPublicState>` - Observable of contract state

## Types

### ShieldedTokenProviders
```typescript
interface ShieldedTokenProviders {
  publicDataProvider: PublicDataProvider;
  privateStateProvider: PrivateStateProvider;
  logger: Logger;
}
```

### ShieldedTokenPublicState
```typescript
interface ShieldedTokenPublicState {
  ledger: Ledger;
  privateState: ShieldedFungibleTokenPrivateState;
}
```

### MintParams
```typescript
interface MintParams {
  recipient: string; // hex address
  amount: bigint;
}
```

### BurnParams
```typescript
interface BurnParams {
  coinColor: string; // hex color
  coinValue: bigint;
  amount: bigint;
}
```

### TokenInfo
```typescript
interface TokenInfo {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: bigint;
}
```

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

- `@midnight-dapps/shielded-token-contract` - The Shielded Token contract
- `@midnight-ntwrk/compact-runtime` - Compact runtime utilities
- `@midnight-ntwrk/midnight-js-contracts` - Contract deployment utilities
- `@midnight-ntwrk/midnight-js-types` - Midnight types
- `pino` - Logging
- `rxjs` - Reactive programming utilities 