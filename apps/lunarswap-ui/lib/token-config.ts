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

export const popularTokens: Token[] = [];

/**
 * Merge popular tokens with user-deployed tokens (e.g. from ShieldedToken context).
 * Use this as the single source of tokens for the UI.
 */
export function getAllTokens(userDeployedTokens?: Token[]): Token[] {
  const extra = userDeployedTokens ?? [];
  return [...popularTokens, ...extra];
}

/**
 * Get a token by its name
 * @param tokens - If provided, search in this list; otherwise use popularTokens only
 */
export function getTokenByName(
  name: string,
  tokens?: Token[],
): Token | undefined {
  const list = tokens ?? popularTokens;
  return list.find((token) => token.name === name);
}

/**
 * Get a token by its symbol
 * @param tokens - If provided, search in this list; otherwise use popularTokens only
 */
export function getTokenBySymbol(
  symbol: string,
  tokens?: Token[],
): Token | undefined {
  const list = tokens ?? popularTokens;
  return list.find((token) => token.symbol === symbol);
}

/**
 * Get a token by its address
 * @param tokens - If provided, search in this list; otherwise use popularTokens only
 */
export function getTokenByAddress(
  address: string,
  tokens?: Token[],
): Token | undefined {
  const list = tokens ?? popularTokens;
  return list.find((token) => token.address === address);
}

/**
 * Get a token by its type
 * @param tokens - If provided, search in this list; otherwise use popularTokens only
 */
export function getTokenByType(
  type: RawTokenType,
  tokens?: Token[],
): Token | undefined {
  const list = tokens ?? popularTokens;
  return list.find((token) => token.type === type);
}

/**
 * Get all token symbols from the given list (default: popularTokens)
 */
export function getAllTokenSymbols(tokens?: Token[]): string[] {
  const list = tokens ?? popularTokens;
  return list.map((token) => token.symbol);
}

/**
 * Get all token addresses from the given list (default: popularTokens)
 */
export function getAllTokenAddresses(tokens?: Token[]): string[] {
  const list = tokens ?? popularTokens;
  return list.map((token) => token.address);
}

/**
 * Get all token types from the given list (default: popularTokens)
 */
export function getAllTokenTypes(tokens?: Token[]): RawTokenType[] {
  const list = tokens ?? popularTokens;
  return list.map((token) => token.type);
}

/**
 * Get tokens from available pools
 * @param tokens - If provided, match pool types against this list; otherwise use popularTokens only
 */
export function getTokensFromPools(
  pools: Array<{ pair: { token0Type: Uint8Array; token1Type: Uint8Array } }>,
  tokens?: Token[],
): Token[] {
  const list = tokens ?? popularTokens;
  const uniqueTokenTypes = new Set<RawTokenType>();
  const tokensFromPools: Token[] = [];

  for (const pool of pools) {
    const token0Type = decodeRawTokenType(pool.pair.token0Type);
    const token1Type = decodeRawTokenType(pool.pair.token1Type);
    uniqueTokenTypes.add(token0Type);
    uniqueTokenTypes.add(token1Type);
  }

  for (const tokenType of uniqueTokenTypes) {
    const token = list.find((t) => {
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
 * @param tokens - If provided, match pool types against this list; otherwise use popularTokens only
 */
export function getAvailableTokensForSelection(
  pools: Array<{ pair: { token0Type: Uint8Array; token1Type: Uint8Array } }>,
  tokens?: Token[],
): Token[] {
  return getTokensFromPools(pools, tokens);
}
