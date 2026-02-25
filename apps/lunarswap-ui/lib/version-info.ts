// Version information utility
export interface VersionInfo {
  compactCompiler: string;
  midnightNtwrkPackages: {
    [key: string]: string;
  };
}

/** User-facing protocol notices (known limitations / future revisions). */
export interface ProtocolNotice {
  id: string;
  title: string;
  description: string;
}

/** Demo disclaimer – app is not for production use. */
export const DEMO_DISCLAIMER: ProtocolNotice = {
  id: 'demo-only',
  title: 'For demo purposes only',
  description:
    'This application is for demonstration only. It is not intended for production use. Do not use with mainnet assets or for real-world trading or liquidity provision.',
};

export const PROTOCOL_NOTICES: ProtocolNotice[] = [
  {
    id: 'minimum-liquidity',
    title: 'Minimum liquidity not locked',
    description:
      'When a new pool is created, a minimum amount of liquidity is not yet permanently locked to a burn address. This may be revised in a future protocol update to improve security against inflation-style risks.',
  },
  {
    id: 'lp-total-supply',
    title: 'LP token supply display',
    description:
      'If LP tokens are sent directly to a burn address (without using the protocol’s burn flow), the reported total supply for that pool may not decrease. Displayed totals can therefore be approximate in those cases.',
  },
];

// Extract version information from package.json dependencies
export function getVersionInfo(): VersionInfo {
  // These versions are extracted from the package.json dependencies
  const midnightNtwrkPackages: { [key: string]: string } = {
    '@midnight-ntwrk/compact-runtime': '0.14.0',
    '@midnight-ntwrk/dapp-connector-api': '4.0.0',
    '@midnight-ntwrk/ledger-v7': '7.0.0',
    '@midnight-ntwrk/midnight-js-contracts': '3.0.0',
    '@midnight-ntwrk/midnight-js-fetch-zk-config-provider': '3.0.0',
    '@midnight-ntwrk/midnight-js-http-client-proof-provider': '3.0.0',
    '@midnight-ntwrk/midnight-js-indexer-public-data-provider': '3.0.0',
    '@midnight-ntwrk/midnight-js-level-private-state-provider': '3.0.0',
    '@midnight-ntwrk/midnight-js-network-id': '3.1.0',
    '@midnight-ntwrk/midnight-js-testing': '2.0.2',
    '@midnight-ntwrk/midnight-js-types': '3.0.0',
    '@midnight-ntwrk/wallet-api': '5.0.0',
    '@midnight-ntwrk/wallet-sdk-address-format': '3.0.0',
    '@midnight-ntwrk/wallet-sdk-abstractions': '1.0.0',
    '@midnight-ntwrk/zswap': '4.0.0',
  };

  const compactCompiler = '0.29.0';

  return {
    compactCompiler,
    midnightNtwrkPackages,
  };
}

// Get a formatted string of all versions
export function getFormattedVersionInfo(): string {
  const versionInfo = getVersionInfo();

  let formatted = `Compact Compiler: ${versionInfo.compactCompiler}\n\n`;
  formatted += 'Midnight Network Packages:\n';

  for (const [name, version] of Object.entries(
    versionInfo.midnightNtwrkPackages,
  )) {
    formatted += `  ${name}: ${version}\n`;
  }

  return formatted;
}
