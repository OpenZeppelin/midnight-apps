// SPDX-License-Identifier: MIT
//
// Pure helpers for deciding when a wallet is "synced enough" to transact.
// Deliberately free of heavy SDK / WASM imports so they can be unit-tested
// cheaply and in isolation from the wallet runtime.

/** A sub-wallet sync-progress object exposing the SDK's gap check. */
export interface GapCheckable {
	isCompleteWithin?: (maxGap: bigint) => boolean;
}

/**
 * The subset of the facade state we read for readiness. The shielded and dust
 * wallets expose progress at `.state.progress`; the unshielded wallet at
 * `.progress`.
 */
export interface ReadinessState {
	shielded?: { state?: { progress?: GapCheckable } };
	dust?: { state?: { progress?: GapCheckable } };
	unshielded?: { progress?: GapCheckable };
}

/** Default gap (events behind the chain tip) tolerated; matches the SDK default. */
export const DEFAULT_SYNC_MAX_GAP = 50n;

/**
 * Parse the `WALLET_SYNC_MAX_GAP` override into a bigint gap tolerance.
 * Empty / undefined yields the default. Only non-negative integers are
 * accepted; anything else throws so a typo can't silently disable the gate.
 */
export const parseSyncMaxGap = (
	raw: string | undefined = process.env.WALLET_SYNC_MAX_GAP,
): bigint => {
	if (raw === undefined || raw === "") return DEFAULT_SYNC_MAX_GAP;
	const n = Number(raw);
	if (!Number.isInteger(n) || n < 0) {
		throw new Error(
			`Invalid WALLET_SYNC_MAX_GAP: ${raw}. Must be a non-negative integer.`,
		);
	}
	return BigInt(n);
};

/**
 * True once the shielded, dust and unshielded sub-wallets are each within
 * `maxGap` events of the chain tip. This is the "ready to transact" condition,
 * in contrast to the facade's strict `isSynced` (gap 0 on all three) which
 * never holds on a continuously-advancing network like preprod. Defensive: a
 * sub-wallet whose progress object is missing the method is treated as
 * not-ready (returns false) rather than throwing.
 */
export const isReadyToTransact = (
	state: ReadinessState,
	maxGap: bigint,
): boolean => {
	const progresses: Array<GapCheckable | undefined> = [
		state.shielded?.state?.progress,
		state.dust?.state?.progress,
		state.unshielded?.progress,
	];
	return progresses.every(
		(p) =>
			typeof p?.isCompleteWithin === "function" && p.isCompleteWithin(maxGap),
	);
};
