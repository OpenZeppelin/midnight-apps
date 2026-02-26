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
 * If VITE_PROOF_SERVER_URL is set (e.g. http://localhost:6300 for a local proof server), it overrides PROOF_SERVER_URL.
 */
export function getActiveNetworkConfig(config: AppConfig): NetworkConfig {
  const id = config.DEFAULT_NETWORK ?? 'preprod';
  const network = config.NETWORKS?.[id];
  const base =
    network ?? (config.NETWORKS && Object.values(config.NETWORKS)[0]);
  if (!base) {
    throw new Error(
      `No network configured. Ensure config.json has NETWORKS and DEFAULT_NETWORK.`,
    );
  }
  const proofServerOverride =
    typeof import.meta !== 'undefined' &&
    (import.meta as { env?: { VITE_PROOF_SERVER_URL?: string } }).env
      ?.VITE_PROOF_SERVER_URL;
  if (proofServerOverride) {
    return { ...base, PROOF_SERVER_URL: proofServerOverride };
  }
  return base;
}
