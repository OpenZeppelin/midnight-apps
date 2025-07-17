// Type definitions for Midnight Lace wallet integration

export interface WalletState {
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  address?: string;
  error?: string;
}

export interface ServiceUriConfig {
  proverServerUri: string;
  // Add other service URIs as needed
}

export interface DAppConnectorWalletAPI {
  state(): Promise<WalletState>;
  // Midnight.js specific providers
  publicDataProvider?: any;
  walletProvider?: any;
  midnightProvider?: any;
  uris?: ServiceUriConfig;
  // Add other wallet methods as needed
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
