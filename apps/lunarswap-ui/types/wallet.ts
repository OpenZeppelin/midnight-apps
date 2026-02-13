// Type definitions for Midnight Lace wallet integration

import type { DAppConnectorWalletAPI } from '@midnight-ntwrk/dapp-connector-api';

export interface WalletState {
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  address?: string;
  error?: string;
}

export interface ServiceUriConfig {
  proverServerUri: string;
  // Add other service URIs as needed
}

export interface MidnightLaceConnector {
  apiVersion: string;
  isEnabled(): Promise<boolean>;
  enable(): Promise<DAppConnectorWalletAPI>;
  serviceUriConfig(): Promise<ServiceUriConfig>;
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
