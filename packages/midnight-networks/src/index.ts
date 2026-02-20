export interface NetworkConfig {
	/** Human-readable network name */
	name: string;
	/** Network ID string for setNetworkId() — 'undeployed' | 'test' | 'mainnet' */
	networkId: string;
	/** Indexer GraphQL HTTP endpoint */
	indexer: string;
	/** Indexer GraphQL WebSocket endpoint */
	indexerWS: string;
	/** Substrate/RPC node endpoint */
	node: string;
	/** ZK proof server endpoint */
	proofServer: string;
	/** Faucet URL (if available) */
	faucetUrl?: string;
}

export const local: NetworkConfig = {
	name: 'Undeployed',
	networkId: 'undeployed',
	indexer: 'http://localhost:8088/api/v3/graphql',
	indexerWS: 'ws://localhost:8088/api/v3/graphql/ws',
	node: 'http://localhost:9944',
	proofServer: 'http://localhost:6300',
};

export const preview: NetworkConfig = {
	name: 'Preview',
	networkId: 'preview',
	indexer: 'https://indexer.preview.midnight.network/api/v3/graphql',
	indexerWS: 'wss://indexer.preview.midnight.network/api/v3/graphql/ws',
	node: 'https://rpc.preview.midnight.network',
	proofServer: 'https://lace-proof-pub.preview.midnight.network',
};

export const preprod: NetworkConfig = {
	name: 'Preprod',
	networkId: 'preprod',
	indexer: 'https://indexer.preprod.midnight.network/api/v3/graphql',
	indexerWS: 'wss://indexer.preprod.midnight.network/api/v3/graphql/ws',
	node: 'https://rpc.preprod.midnight.network',
	proofServer: 'https://lace-proof-pub.preprod.midnight.network',
};

export const testnet: NetworkConfig = {
	name: 'Testnet',
	networkId: 'test',
	indexer: 'https://indexer.testnet-02.midnight.network/api/v1/graphql',
	indexerWS: 'wss://indexer.testnet-02.midnight.network/api/v1/graphql/ws',
	node: 'https://rpc.testnet-02.midnight.network',
	proofServer: 'http://localhost:6300',
	faucetUrl: 'https://faucet.testnet-02.midnight.network',
};
