# Midnight.js Integration for Lunarswap UI

This document explains how to integrate compact circuits artifacts with the Lunarswap UI using Midnight.js, based on patterns from the battleship-ui project.

## Overview

The integration provides a seamless way to execute zero-knowledge transactions for token swaps and liquidity operations on the Midnight network. The implementation follows the same patterns used in the battleship-ui project.

## Key Components

### 1. Midnight Providers (`lib/midnight-providers.ts`)

This file contains the core Midnight.js integration components:

- **CachedFetchZkConfigProvider**: Caches ZK circuit artifacts (prover keys, verifier keys, ZKIR) to avoid repeated downloads
- **createProofClient**: Creates a proof provider that communicates with the proof server
- **createMidnightProviders**: Combines all providers needed for Midnight.js transactions

### 2. Transaction Hook (`hooks/use-midnight-transaction.ts`)

A React hook that manages the transaction lifecycle:

- **Transaction States**: idle → preparing → proving → submitting → success/error
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Status Updates**: Real-time status updates during transaction processing

### 3. Enhanced Components

#### SwapCardEnhanced (`components/swap-card-enhanced.tsx`)
- Integrates with Midnight.js for token swaps
- Shows transaction status and progress
- Handles wallet connection requirements
- Provides real-time feedback during transactions

#### AddLiquidityEnhanced (`components/pool/add-liquidity-enhanced.tsx`)
- Manages liquidity pool operations
- Supports multiple fee tiers
- Calculates pool share and rates
- Handles LP token minting

## Usage

### Basic Transaction Flow

```typescript
import { useMidnightTransaction } from '@/hooks/use-midnight-transaction';

const MyComponent = () => {
  const { transactionState, executeTransaction, resetTransaction } = useMidnightTransaction();

  const handleSwap = async () => {
    const result = await executeTransaction(async (providers, walletAPI) => {
      // Your transaction logic here
      // 1. Create transaction
      // 2. Prove transaction
      // 3. Submit to network
      return { txHash: '0x...', success: true };
    });

    if (result) {
      console.log('Transaction successful:', result);
    }
  };

  return (
    <button onClick={handleSwap}>
      {transactionState.status === 'proving' ? 'Generating Proof...' : 'Swap'}
    </button>
  );
};
```

### Transaction States

- **idle**: Ready to execute transaction
- **preparing**: Setting up transaction parameters
- **proving**: Generating zero-knowledge proof
- **submitting**: Submitting transaction to network
- **success**: Transaction completed successfully
- **error**: Transaction failed

### Error Handling

The integration provides comprehensive error handling:

```typescript
if (transactionState.error) {
  console.error('Transaction failed:', transactionState.error);
  // Show error message to user
}
```

## Integration with Existing Components

### Swap Page
The main swap page (`app/page.tsx`) now uses `SwapCardEnhanced` instead of the basic `SwapCard`. This provides:

- Real-time transaction status
- Zero-knowledge proof generation
- Wallet integration
- Error handling

### Pool Page
The pool page (`app/pool/page.tsx`) includes `AddLiquidityEnhanced` for:

- Adding liquidity to pools
- LP token minting
- Fee tier selection
- Pool share calculation

## Dependencies

The integration requires the following Midnight.js packages:

```json
{
  "@midnight-ntwrk/midnight-js-types": "^latest",
  "@midnight-ntwrk/midnight-js-fetch-zk-config-provider": "^latest",
  "@midnight-ntwrk/midnight-js-http-client-proof-provider": "^latest",
  "@midnight-ntwrk/midnight-js-level-private-state-provider": "^latest"
}
```

## Configuration

### Wallet Integration
The integration works with the existing wallet connection system. Ensure your wallet provides:

- `publicDataProvider`
- `walletProvider` 
- `midnightProvider`
- `uris.proverServerUri`

### Circuit Artifacts
Circuit artifacts (prover keys, verifier keys, ZKIR) are automatically downloaded and cached from the configured base URL.

## Development

### Adding New Transaction Types

1. Create a new component using the `useMidnightTransaction` hook
2. Implement the transaction logic in the `executeTransaction` callback
3. Handle success/error states appropriately

### Customizing Providers

You can customize the Midnight providers by modifying `lib/midnight-providers.ts`:

```typescript
// Custom provider configuration
const customProviders = createMidnightProviders(
  publicDataProvider,
  walletProvider,
  midnightProvider,
  walletAPI,
  customCallback
);
```

## Testing

The integration includes comprehensive error handling and status tracking. Test scenarios:

1. **Wallet Not Connected**: Should show appropriate error message
2. **Transaction Failure**: Should display error details
3. **Network Issues**: Should handle timeouts and connection problems
4. **Proof Generation**: Should show progress during proof generation

## Future Enhancements

- **Batch Transactions**: Support for multiple transactions in a single proof
- **Advanced Error Recovery**: Automatic retry mechanisms
- **Transaction History**: Persistent transaction history
- **Gas Estimation**: Real-time gas cost estimation
- **Slippage Protection**: Advanced slippage protection mechanisms

## Troubleshooting

### Common Issues

1. **"Midnight.js providers not available"**: Ensure wallet is connected and supports Midnight.js
2. **Proof generation timeout**: Check proof server connectivity
3. **Transaction submission failure**: Verify network connectivity and gas fees

### Debug Mode

Enable debug logging by setting:

```typescript
localStorage.setItem('midnight-debug', 'true');
```

This will provide detailed logs for transaction processing and error handling. 