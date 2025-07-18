// Type definitions for Midnight Lace wallet integration

// Native token constant (DUST)
export const NATIVE_TOKEN = 'DUST';

// Sync progress interface
export interface SyncProgress {
  synced: boolean;
  lag: {
    applyGap: bigint;
    sourceGap: bigint;
  };
}

// Balance type (using bigint for precision)
export type Balances = Record<string, bigint>;

// Transaction history item
export interface TransactionHistoryItem {
  // Add transaction properties as needed
  id: string;
  // ... other transaction properties
}

export interface WalletState {
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  address?: string;
  addressLegacy?: string;
  coinPublicKey?: string;
  coinPublicKeyLegacy?: string;
  encryptionPublicKey?: string;
  encryptionPublicKeyLegacy?: string;
  error?: string;
  // Sync progress information
  syncProgress?: SyncProgress;
  // Token balances (key is token identifier, value is balance as bigint)
  balances: Balances;
  // Transaction history
  transactionHistory: TransactionHistoryItem[];
}

export interface DAppConnectorWalletAPI {
  state(): Promise<WalletState>;
  // Add other wallet methods as needed
}

export interface MidnightLaceConnector {
  apiVersion: string;
  isEnabled(): Promise<boolean>;
  enable(): Promise<DAppConnectorWalletAPI>;
  serviceUriConfig(): Promise<string>;
}

export interface MidnightWindow {
  midnight?: {
    mnLace?: MidnightLaceConnector;
  };
}

// Extend the global Window interface
declare global {
  interface Window extends MidnightWindow {}
}
