/**
 * Format dust balance/cap for display (matches Lace wallet: e.g. 10K / 10K tDUST).
 * Dust amounts from the wallet API are in smallest units; we divide by 10^15
 * to get human-readable units before formatting.
 */
const DUST_DECIMALS = 15;
const DUST_DIVISOR = 10 ** DUST_DECIMALS;

const compactFormatter = new Intl.NumberFormat(undefined, {
  notation: 'compact',
  maximumFractionDigits: 1,
  minimumFractionDigits: 0,
});

/**
 * Format a raw dust amount (bigint from wallet API) for display.
 * E.g. 10000000000000000000n → "10K"
 */
export function formatDustAmount(raw: bigint): string {
  const value = Number(raw / BigInt(DUST_DIVISOR));
  return compactFormatter.format(value);
}
