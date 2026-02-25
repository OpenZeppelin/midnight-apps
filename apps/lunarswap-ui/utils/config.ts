/**
 * Per-network configuration (matches each entry in config.json NETWORKS).
 */
export interface NetworkConfig {
  name: string;
  available: boolean;
  INDEXER_URI: string;
  INDEXER_WS_URI: string;
  LUNARSWAP_ADDRESS: string;
  FAUCET_URL: string;
  EXPLORER_URL: string;
  RPC_URL: string;
  PROOF_SERVER_URL: string;
}

/**
 * Application configuration matching config.json structure.
 * NETWORKS key is network id (e.g. 'preprod', 'preview').
 */
export interface AppConfig {
  LOGGING_LEVEL: string;
  DEFAULT_NETWORK: string;
  NETWORKS: Record<string, NetworkConfig>;
}

/**
 * Get the active network config from app config (uses DEFAULT_NETWORK).
 * Single source of truth: config is loaded from config.json via RuntimeConfigurationProvider.
 */
export function getActiveNetworkConfig(config: AppConfig): NetworkConfig {
  const id = config.DEFAULT_NETWORK ?? 'preprod';
  const network = config.NETWORKS?.[id];
  if (network) return network;
  const first = config.NETWORKS && Object.values(config.NETWORKS)[0];
  if (first) return first;
  throw new Error(
    `No network configured. Ensure config.json has NETWORKS and DEFAULT_NETWORK.`,
  );
}
