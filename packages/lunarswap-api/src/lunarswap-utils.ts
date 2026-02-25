/**
 * TypeScript implementations of LunarswapLibrary circuits that cannot be
 * exported from the contract (impure circuits without verifier keys).
 * @see https://github.com/LFDT-Minokawa/compact/issues/150
 *
 * These mirror the logic in LunarswapLibrary.compact (getIdentity, sortByColor)
 * so the API can offer the same utilities without calling the circuit.
 *
 * TODO: Remove this module and switch Lunarswap API to use contract circuits
 * (getPairId, getIdentity, sortCoinByColor, sortQualifiedCoinByColor) once
 * https://github.com/LFDT-Minokawa/compact/issues/150 is resolved and the
 * contract can export those circuits.
 */

import {
  CompactTypeBytes,
  CompactTypeVector,
  persistentHash,
} from '@midnight-ntwrk/compact-runtime';
import type {
  QualifiedShieldedCoinInfo,
  ShieldedCoinInfo,
} from '@openzeppelin/midnight-apps-contracts/dist/artifacts/lunarswap/Lunarswap/contract';

const IDENTITY_DOMAIN_PAIR = 'pair-id';
const IDENTITY_DOMAIN_RESERVE = 'reserve-id';

/** Pads a string to 32 bytes (UTF-8), zero-padded at the end. Matches Compact pad(32, s). */
function padTo32Bytes(s: string): Uint8Array {
  const encoded = new TextEncoder().encode(s);
  const out = new Uint8Array(32);
  out.set(encoded.subarray(0, 32));
  return out;
}

/**
 * Compares two 32-byte arrays as little-endian 256-bit integers.
 * Matches Bytes32.lt in the contract (toU256 + Uint256_lt).
 */
function bytes32Lt(a: Uint8Array, b: Uint8Array): boolean {
  for (let i = 31; i >= 0; i--) {
    const ai = a[i];
    const bi = b[i];
    if (ai !== bi) return (ai ?? 0) < (bi ?? 0);
  }
  return false;
}

/**
 * Generates a deterministic identity hash for a pair or reserve.
 * Matches LunarswapLibrary getIdentity(type0, type1, isPairId).
 *
 * @param type0 - First color (must be sorted order with type1).
 * @param type1 - Second color.
 * @param isPairId - True for pair identity, false for reserve identity.
 * @returns 32-byte identity hash.
 */
export function getIdentity(
  type0: Uint8Array,
  type1: Uint8Array,
  isPairId: boolean,
): Uint8Array {
  const domainSep = padTo32Bytes(
    isPairId ? IDENTITY_DOMAIN_PAIR : IDENTITY_DOMAIN_RESERVE,
  );
  const rtType = new CompactTypeVector(3, new CompactTypeBytes(32));
  return persistentHash(rtType, [domainSep, type0, type1]);
}

/**
 * Sorts two coins by color (Bytes32.lt order).
 * Matches LunarswapLibrary sortCoinByColor.
 *
 * @throws If both coins have the same color.
 */
export function sortCoinByColor(
  tokenA: ShieldedCoinInfo,
  tokenB: ShieldedCoinInfo,
): [ShieldedCoinInfo, ShieldedCoinInfo] {
  const a = tokenA.color;
  const b = tokenB.color;
  if (a.length !== 32 || b.length !== 32) {
    throw new Error(
      'LunarswapLibrary: sortCoinByColor() - color must be 32 bytes',
    );
  }
  if (a.every((byte, i) => byte === b[i])) {
    throw new Error('LunarswapLibrary: sortCoinByColor() - Identical colors');
  }
  return bytes32Lt(a, b) ? [tokenA, tokenB] : [tokenB, tokenA];
}

/**
 * Sorts two qualified coins by color (Bytes32.lt order).
 * Matches LunarswapLibrary sortQualifiedCoinByColor.
 *
 * @throws If both coins have the same color.
 */
export function sortQualifiedCoinByColor(
  coinA: QualifiedShieldedCoinInfo,
  coinB: QualifiedShieldedCoinInfo,
): [QualifiedShieldedCoinInfo, QualifiedShieldedCoinInfo] {
  const a = coinA.color;
  const b = coinB.color;
  if (a.length !== 32 || b.length !== 32) {
    throw new Error(
      'LunarswapLibrary: sortQualifiedCoinByColor() - color must be 32 bytes',
    );
  }
  if (a.every((byte, i) => byte === b[i])) {
    throw new Error(
      'LunarswapLibrary: sortQualifiedCoinByColor() - Identical colors',
    );
  }
  return bytes32Lt(a, b) ? [coinA, coinB] : [coinB, coinA];
}

/**
 * Pair ID for a token pair (sorted by color then hashed).
 * Matches Router getPairId: sortCoinByColor then getIdentity(..., true).
 */
export function getPairId(
  tokenA: ShieldedCoinInfo,
  tokenB: ShieldedCoinInfo,
): Uint8Array {
  const [token0, token1] = sortCoinByColor(tokenA, tokenB);
  return getIdentity(token0.color, token1.color, true);
}

/**
 * Reserve ID for a token pair (sorted by color then hashed).
 * Matches Router getReserveId: sortCoinByColor then getIdentity(..., false).
 */
export function getReserveId(
  tokenA: ShieldedCoinInfo,
  tokenB: ShieldedCoinInfo,
): Uint8Array {
  const [token0, token1] = sortCoinByColor(tokenA, tokenB);
  return getIdentity(token0.color, token1.color, false);
}
