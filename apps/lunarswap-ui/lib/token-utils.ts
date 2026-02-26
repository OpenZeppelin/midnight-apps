import { popularTokens, type Token } from './token-config';

// Generate a consistent color based on token symbol
export function getTokenColor(symbol: string): string {
  // Use a hash function to generate consistent colors
  const hash = symbol.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);

  // Generate hue from hash (0-360)
  const _hue = Math.abs(hash) % 360;

  // Use different saturation and lightness for different token types
  let _saturation = 70;
  let _lightness = 50;

  // Adjust based on token type
  if (symbol.startsWith('T')) {
    // Test tokens - more vibrant
    _saturation = 80;
    _lightness = 45;
  } else if (symbol === 'LUNAR') {
    // LUNAR token - golden
    return 'bg-yellow-500';
  }

  // Convert HSL to a Tailwind-like color class
  // For simplicity, we'll use a predefined set of colors
  const colorMap: Record<string, string> = {
    TUSD: 'bg-blue-500',
    TEURO: 'bg-green-500',
    TJPY: 'bg-red-500',
    TCNY: 'bg-orange-500',
    TARS: 'bg-purple-500',
    LUNAR: 'bg-yellow-500',
    TGBP: 'bg-indigo-500',
  };

  return colorMap[symbol] || `bg-gray-${Math.abs(hash % 5) + 4}00`;
}

/**
 * Get a token by its color (type field)
 * @param tokens - If provided, search in this list; otherwise use popularTokens only
 */
export function getTokenByColor(
  color: string,
  tokens?: Token[],
): Token | undefined {
  const list = tokens ?? popularTokens;
  let token = list.find((t) => t.type === color);
  if (!token) {
    const shortColor = color.slice(-4);
    token = list.find((t) => t.type.endsWith(shortColor));
  }
  if (!token) {
    const shortColor = color.slice(-8);
    token = list.find((t) => t.type.endsWith(shortColor));
  }
  return token;
}

/**
 * Get token symbol by color
 */
export function getTokenSymbolByColor(color: string, tokens?: Token[]): string {
  const token = getTokenByColor(color, tokens);
  return token ? token.symbol : color.slice(0, 4);
}

/**
 * Get token name by color
 */
export function getTokenNameByColor(color: string, tokens?: Token[]): string {
  const token = getTokenByColor(color, tokens);
  return token ? token.name : color.slice(0, 4);
}

/**
 * Get token details by symbol
 * @param tokens - If provided, search in this list; otherwise use popularTokens only
 */
export function getTokenDetails(
  symbol: string,
  tokens?: Token[],
): Token | undefined {
  const list = tokens ?? popularTokens;
  return list.find((token) => token.symbol === symbol);
}

/**
 * Get all available token symbols
 * @param tokens - If provided, use this list; otherwise use popularTokens only
 */
export function getAvailableTokenSymbols(tokens?: Token[]): string[] {
  const list = tokens ?? popularTokens;
  return list.map((token) => token.symbol);
}
