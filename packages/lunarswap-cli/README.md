# LunarSwap CLI

This CLI tool allows you to deploy and interact with LunarSwap contracts on both local and remote testnets.

## Prerequisites

- Node.js 22+ 
- pnpm (recommended) or npm
- Docker and Docker Compose (for local infrastructure)
- Access to a Midnight testnet (for remote deployment)

## Installation

From the root of the midnight-dapps project:

```bash
pnpm install
```

## Usage

### Local Testnet

To run the CLI against your local testnet:

```bash
cd packages/lunarswap-cli
pnpm run testnet-local
```

Make sure you have a local Midnight node running on:
- RPC: http://127.0.0.1:9944
- Indexer: http://127.0.0.1:8088
- Proof Server: http://127.0.0.1:6300

You can start this infrastructure using `pnpm run infra:up`.

### Remote Testnet

To run the CLI against the remote testnet:

```bash
cd packages/lunarswap-cli
pnpm run testnet-remote
```

### Remote Testnet with Proof Server

To run the CLI against the remote testnet with a local proof server:

```bash
cd packages/lunarswap-cli
pnpm run testnet-remote-ps
```

## Infrastructure Management

The CLI includes Docker Compose configurations to easily set up local Midnight network infrastructure.

### Full Local Stack

To run a complete local Midnight network (node, indexer, and proof server):

```bash
# Start the full stack
pnpm run infra:up

# Check status
pnpm run infra:ps

# View logs
pnpm run infra:logs

# Stop the stack
pnpm run infra:down
```

### Proof Server Only

For remote deployments that need a local proof server:

```bash
# Start proof server for local development
pnpm run proof-server:local

# Start proof server for testnet
pnpm run proof-server:testnet

# Stop proof servers
pnpm run proof-server:down
```

### Using an Existing Proof Server

If you already have a proof server running (e.g. via `docker run -p 6300:6300 midnightnetwork/proof-server -- midnight-proof-server --network preprod`), set `PROOF_SERVER_PORT` to skip starting a new container:

```bash
PROOF_SERVER_PORT=6300 pnpm preprod
```

## CLI Features

The LunarSwap CLI provides the following functionality:

1. **Wallet Management**: Build fresh wallets or restore from seeds
2. **Contract Deployment**: Deploy new LunarSwap contracts
3. **Contract Joining**: Connect to existing deployed contracts
4. **Interactive Menu**: Main menu for future operations:
   - Add liquidity to a pair
   - Remove liquidity from a pair
   - Swap tokens (exact input)
   - Swap tokens (exact output)
   - View contract state

## Configuration

The CLI uses different configurations for different environments:

- **Local**: Uses localhost endpoints for development
- **Remote**: Uses the official testnet endpoints with local proof server
- **Remote-PS**: Uses the official testnet endpoints with remote proof server

Configuration files are located in `src/config.ts`.

## Development

### Building

```bash
pnpm run build
```

### Type Checking

```bash
pnpm run types
```

### Linting

```bash
pnpm run lint
pnpm run lint:fix
```

## Logs

Deployment and session logs are saved to:
- Local: `logs/testnet-local/`
- Remote: `logs/testnet-remote/`
- Remote-PS: `logs/testnet-remote-ps/`

Each deployment or session creates a timestamped log file.

## Contract Architecture

The LunarSwap contract leverages Compact's composable design where a single contract imports and combines multiple modules:

- **LunarSwapRouter** - User-facing operations
- **LunarSwapFactory** - Pair management  
- **LunarSwapPair** - Core AMM logic
- **LunarSwapLiquidity** - LP token system
- **LunarSwapFee** - Protocol fee management
- **LunarSwapLibrary** - Mathematical utilities

## Contributing

This CLI is part of the midnight-dapps project. Please refer to the main project README for contribution guidelines.