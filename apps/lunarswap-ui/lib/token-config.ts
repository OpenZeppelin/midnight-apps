import {
  decodeRawTokenType,
  type RawTokenType,
} from '@midnight-ntwrk/ledger-v7';

export interface Token {
  symbol: string;
  name: string;
  type: RawTokenType;
  address: string;
  shielded: boolean;
}

export const popularTokens: Token[] = [
  {
    symbol: 'tDUST',
    name: 'Test Dust',
    type: '02000000000000000000000000000000000000000000000000000000000000000000',
    address: '',
    shielded: true,
  },
  {
    symbol: 'tUSD',
    name: 'Test United States Dollar',
    type: '020044c5e6f0e5e31c4db5ae99e28bb2d9bfe5416fc81a07c6f182188d74bd1968ac',
    address:
      '02003a6c827a7373c2accc93b25674f8438c102f898aaf41297363ca7b07ade914ee',
    shielded: true,
  },
  {
    symbol: 'tEURO',
    name: 'Test Euro',
    type: '020093d51b1346b4e1971307a47b061667a689e763aea258ccb239f9e2507ad1d2df',
    address:
      '02005b4fe8c79a87daeb4c3dde0e10d7be9e28c564375489c9a95f029018751f861e',
    shielded: true,
  },
  {
    symbol: 'tJPY',
    name: 'Test Japanese Yen',
    type: '0200f5d20d43ce7e1ca8b007cf119d16551a133fcd54723bd78e6d1ee981fd2b3afa',
    address:
      '0200e613d9d447788172c1d8ed32bbc60f73c359a12fd92a47d6130470335b531cf1',
    shielded: true,
  },
  {
    symbol: 'tCNY',
    name: 'Test Chinese Yuan',
    type: '020099e7ced5a6086564cc693cf1ef3019468a0834f92fc34bc466d2830d736bbe29',
    address:
      '02003e017dcade0bcad3d6dd5308fa91ea31deb93a05df0034f5334ee6315acdb08f',
    shielded: true,
  },
  {
    symbol: 'tARS',
    name: 'Test Argentine Peso',
    type: '0200c387a2e85d32deb9bea6566a83f8ea7c6cf12409addf3450bc9b7967655c496e',
    address:
      '020039b1a5cf93e554f06a79121fb6cdaec3b0c5115690c7fbdf58b21e040493cd72',
    shielded: true,
  },
  {
    symbol: 'tAAVE',
    name: 'Test AAVE',
    type: '0200122ddb05cd1c4441faf9d06ec73208e24e7d9e4bcbf093cc61e939d132cd60ea',
    address:
      '0200b13f1ce4f48330e7be35a109726fe3a9c5e2590e941843049f6ead550f79a665',
    shielded: true,
  },
  {
    symbol: 'tUNI',
    name: 'Test Uni',
    type: '0200a3639f980eba5c19ea0135e077ee0e6aaf177aa93c8a5986e302b51ee03bb948',
    address:
      '020032d30d7719c83c4fac8b0e699a149799298886971a9713c6acd4ffd6ccbeb11b',
    shielded: true,
  },
  {
    symbol: 'tWEth',
    name: 'Test Wrapped Ether',
    type: '02009ddd08504ff70190074f4020c3a6818df3443effcb77809dbcd1efe3f2450640',
    address:
      '020063e3628baf77a6c24cafccde768b15ce9f4caff246a80cb7aa0b5cc8f433616e',
    shielded: true,
  },
  {
    symbol: 'tWBTC',
    name: 'Test Wrapped BTC',
    type: '020062aef3cadbe5300459a8fa98dde46eceac07c480e5561d7c0670fc90a34b6191',
    address:
      '0200301d8a841b7da59442371c92f39ae4369f4f09e946a5e2ce3bb8edd9c3b677d2',
    shielded: true,
  },
];

/**
 * Get a token by its name
 */
export function getTokenByName(name: string): Token | undefined {
  return popularTokens.find((token) => token.name === name);
}

/**
 * Get a token by its symbol
 */
export function getTokenBySymbol(symbol: string): Token | undefined {
  return popularTokens.find((token) => token.symbol === symbol);
}

/**
 * Get a token by its address
 */
export function getTokenByAddress(address: string): Token | undefined {
  return popularTokens.find((token) => token.address === address);
}

/**
 * Get a token by its type
 */
export function getTokenByType(type: RawTokenType): Token | undefined {
  return popularTokens.find((token) => token.type === type);
}

/**
 * Get all token symbols
 */
export function getAllTokenSymbols(): string[] {
  return popularTokens.map((token) => token.symbol);
}

/**
 * Get all token addresses
 */
export function getAllTokenAddresses(): string[] {
  return popularTokens.map((token) => token.address);
}

/**
 * Get all token types
 */
export function getAllTokenTypes(): RawTokenType[] {
  return popularTokens.map((token) => token.type);
}

/**
 * Get tokens from available pools
 * This function extracts unique tokens from the pools data
 */
export function getTokensFromPools(
  pools: Array<{ pair: { token0Type: Uint8Array; token1Type: Uint8Array } }>,
): Token[] {
  const uniqueTokenTypes = new Set<RawTokenType>();
  const tokensFromPools: Token[] = [];

  for (const pool of pools) {
    const token0Type = decodeRawTokenType(pool.pair.token0Type);
    const token1Type = decodeRawTokenType(pool.pair.token1Type);
    uniqueTokenTypes.add(token0Type);
    uniqueTokenTypes.add(token1Type);
  }

  // Find tokens in popularTokens that match the pool token types
  for (const tokenType of uniqueTokenTypes) {
    const token = popularTokens.find((t) => {
      const popularTokenType = t.type.replace(/^0x/i, '').toLowerCase();
      const popularTokenTypeWithoutPrefix = popularTokenType.replace(
        /^0200/,
        '',
      );

      // Match with or without the 0200 prefix
      return (
        popularTokenType === tokenType ||
        popularTokenTypeWithoutPrefix === tokenType ||
        popularTokenType === `0200${tokenType}` ||
        popularTokenTypeWithoutPrefix === tokenType.replace(/^0200/, '')
      );
    });
    if (token) {
      tokensFromPools.push(token);
    }
  }

  return tokensFromPools;
}

/**
 * Get available tokens for selection (only tokens that are in pools)
 */
export function getAvailableTokensForSelection(
  pools: Array<{ pair: { token0Type: Uint8Array; token1Type: Uint8Array } }>,
): Token[] {
  return getTokensFromPools(pools);
}
