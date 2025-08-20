import { decodeTokenType, nativeToken, type TokenType } from "@midnight-ntwrk/ledger";

export interface Token {
  symbol: string;
  name: string;
  type: TokenType;
  address: string;
  shielded: boolean;
}

export const popularTokens: Token[] = [
  {
    symbol: 'tDUST',
    name: 'tDUST',
    type: '02000000000000000000000000000000000000000000000000000000000000000000',
    address: '',
    shielded: true,
  },
  {
    symbol: 'tUSD',
    name: 'tUSD',
    type: '020044c5e6f0e5e31c4db5ae99e28bb2d9bfe5416fc81a07c6f182188d74bd1968ac',
    address:
      '02003a6c827a7373c2accc93b25674f8438c102f898aaf41297363ca7b07ade914ee',
    shielded: true,
  },
  {
    symbol: 'tEURO',
    name: 'tEURO',
    type: '020093d51b1346b4e1971307a47b061667a689e763aea258ccb239f9e2507ad1d2df',
    address:
      '02005b4fe8c79a87daeb4c3dde0e10d7be9e28c564375489c9a95f029018751f861e',
    shielded: true,
  } 
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
export function getTokenByType(type: TokenType): Token | undefined {
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
export function getAllTokenTypes(): TokenType[] {
  return popularTokens.map((token) => token.type);
}

/**
 * Get tokens from available pools
 * This function extracts unique tokens from the pools data
 */
export function getTokensFromPools(
  pools: Array<{ pair: { token0Type: Uint8Array; token1Type: Uint8Array } }>,
): Token[] {
  const uniqueTokenTypes = new Set<TokenType>();
  const tokensFromPools: Token[] = [];

  for (const pool of pools) {
    const token0Type = decodeTokenType(pool.pair.token0Type);
    const token1Type = decodeTokenType(pool.pair.token1Type);
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
