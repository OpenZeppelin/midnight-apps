// Version information utility
export interface VersionInfo {
  compactCompiler: string;
  midnightNtwrkPackages: {
    [key: string]: string;
  };
}

// Extract version information from package.json dependencies
export function getVersionInfo(): VersionInfo {
  // These versions are extracted from the package.json dependencies
  const midnightNtwrkPackages: { [key: string]: string } = {
    '@midnight-ntwrk/dapp-connector-api': '^3.0.0',
    '@midnight-ntwrk/ledger': '^4.0.0',
    '@midnight-ntwrk/midnight-js-contracts': '^2.0.2',
    '@midnight-ntwrk/midnight-js-fetch-zk-config-provider': '^2.0.0',
    '@midnight-ntwrk/midnight-js-http-client-proof-provider': '^2.0.0',
    '@midnight-ntwrk/midnight-js-indexer-public-data-provider': '^2.0.2',
    '@midnight-ntwrk/midnight-js-level-private-state-provider': '^2.0.0',
    '@midnight-ntwrk/midnight-js-network-id': '^2.0.2',
    '@midnight-ntwrk/midnight-js-testing': '^2.0.2',
    '@midnight-ntwrk/midnight-js-types': '^2.0.0',
    '@midnight-ntwrk/wallet-api': '^3.0.0',
    '@midnight-ntwrk/wallet-sdk-address-format': '^2.0.0',
    '@midnight-ntwrk/zswap': '^4.0.0',
  };

  const compactCompiler = '0.23.0';

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
