/**
 * Configuration interface matching config.json structure
 */
export interface AppConfig {
  LOGGING_LEVEL: string;
  NETWORK_ID: 'TestNet' | 'MainNet';
  PUBLIC_URL: string;
  INDEXER_URI: string;
  INDEXER_WS_URI: string;
  LUNARSWAP_ADDRESS: string;
  FAUCET_URL: string;
}

/**
 * Load configuration from config.json
 */
export async function loadConfig(): Promise<AppConfig> {
  try {
    const response = await fetch('/config.json');
    if (!response.ok) {
      throw new Error(`Failed to load config: ${response.statusText}`);
    }
    const config = await response.json();
    return config as AppConfig;
  } catch (error) {
    console.error('Failed to load config.json:', error);
    // Return default config
    return {
      LOGGING_LEVEL: 'silent',
      NETWORK_ID: 'TestNet',
      PUBLIC_URL: 'http://127.0.0.1:8080',
      INDEXER_URI: 'https://indexer.testnet-02.midnight.network/api/v1/graphql',
      INDEXER_WS_URI:
        'wss://indexer.testnet-02.midnight.network/api/v1/graphql/ws',
      LUNARSWAP_ADDRESS:
        '0200129e80a111c859f21c2aa752accc90448af7daff4b679fa236147ef30bbb9a35',
      FAUCET_URL: 'https://faucet.testnet-02.midnight.network',
    };
  }
}

/**
 * Get the current network ID from config
 */
export function getNetworkId(): 'TestNet' | 'MainNet' {
  // For now, return the hardcoded value from config.json
  // In a real implementation, this would be loaded dynamically
  return 'TestNet';
}

/**
 * Get the faucet URL from config
 */
export function getFaucetUrl(): string {
  // For now, return the hardcoded value from config.json
  // In a real implementation, this would be loaded dynamically
  return 'https://faucet.testnet-02.midnight.network';
}

/**
 * Check if mainnet is enabled
 */
export function isMainnetEnabled(): boolean {
  // Mainnet is coming soon
  return false;
}
