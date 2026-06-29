// SPDX-License-Identifier: MIT
// Based on bboard-cli wallet-utils pattern

import type { UnshieldedTokenType } from "@midnight-ntwrk/ledger-v8";
import { getNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import {
	type EnvironmentConfiguration,
	FaucetClient,
} from "@midnight-ntwrk/testkit-js";
import {
	type FacadeState,
	type ShieldedWalletAPI,
	UnshieldedAddress,
	type UnshieldedWalletAPI,
	type UnshieldedWalletState,
	type WalletFacade,
} from "@midnight-ntwrk/wallet-sdk";
import type { Logger } from "pino";
import * as Rx from "rxjs";
import {
	isReadyToTransact,
	parseSyncMaxGap,
	type ReadinessState,
} from "./sync-readiness.js";

export const getInitialShieldedState = async (
	logger: Logger,
	wallet: ShieldedWalletAPI,
) => {
	logger.info("Getting initial state of wallet...");
	return Rx.firstValueFrom(wallet.state);
};

export const getInitialUnshieldedState = async (
	logger: Logger,
	wallet: UnshieldedWalletAPI,
) => {
	logger.info("Getting initial state of wallet...");
	return Rx.firstValueFrom(wallet.state);
};

const DEFAULT_SYNC_TIMEOUT_MS = 180_000; // 3 min for preprod/indexer latency

// The facade's `state.isSynced` requires every sub-wallet to be *strictly*
// caught up to the chain tip (applyGap === 0, i.e. SyncProgress.isStrictlyComplete).
// On a live network like preprod the dust event stream advances continuously, so
// the dust wallet is perpetually 1-2 events behind the tip and `isSynced` never
// flips true — a full ~1M-event replay completed with applyGap stuck at 1-2 and
// then the sync gate timed out. The wallet is usable once each sub-wallet is
// within a small gap of the tip, which is exactly what the SDK's
// `isCompleteWithin(maxGap)` checks (the SDK itself uses it to await unshielded
// sync). See ./sync-readiness for the pure gate logic; override the tolerance
// with WALLET_SYNC_MAX_GAP.
const SYNC_MAX_GAP = parseSyncMaxGap();

export const syncWallet = (
	logger: Logger,
	wallet: WalletFacade,
	throttleTime = 2_000,
	timeout = DEFAULT_SYNC_TIMEOUT_MS,
) => {
	const effectiveTimeout =
		process.env.WALLET_SYNC_TIMEOUT_MS !== undefined &&
		process.env.WALLET_SYNC_TIMEOUT_MS !== ""
			? Number(process.env.WALLET_SYNC_TIMEOUT_MS)
			: timeout;
	if (Number.isNaN(effectiveTimeout) || effectiveTimeout <= 0) {
		throw new Error(
			`Invalid WALLET_SYNC_TIMEOUT_MS: ${process.env.WALLET_SYNC_TIMEOUT_MS}. Must be a positive number.`,
		);
	}
	logger.info(`Syncing wallet... (timeout: ${effectiveTimeout}ms)`);

	// Surface per-wallet sync progress (sourceGap = indexer ahead of us,
	// applyGap = relevant events still to apply) so a long preprod first-sync is
	// observable: shrinking gaps = progressing, frozen gaps = stalled. Throttled
	// manually so the filter below still sees every emission (cannot miss the
	// synced state).
	const fmtProgress = (s: FacadeState): string => {
		const part = (label: string, prog: unknown): string => {
			const p = prog as
				| {
						appliedIndex?: bigint;
						highestRelevantWalletIndex?: bigint;
						highestIndex?: bigint;
						highestRelevantIndex?: bigint;
						isConnected?: boolean;
				  }
				| undefined;
			if (!p) return `${label}{n/a}`;
			const applyGap =
				p.highestRelevantWalletIndex !== undefined &&
				p.appliedIndex !== undefined
					? p.highestRelevantWalletIndex - p.appliedIndex
					: undefined;
			const sourceGap =
				p.highestIndex !== undefined && p.highestRelevantIndex !== undefined
					? p.highestIndex - p.highestRelevantIndex
					: undefined;
			return `${label}{conn=${p.isConnected} applied=${p.appliedIndex} relevant=${p.highestRelevantWalletIndex} applyGap=${applyGap} sourceGap=${sourceGap} highIdx=${p.highestIndex}}`;
		};
		// shielded/dust expose progress at `.state.progress`; unshielded at `.progress`.
		const sh = (s.shielded as unknown as { state?: { progress?: unknown } })
			?.state?.progress;
		const du = (s.dust as unknown as { state?: { progress?: unknown } })?.state
			?.progress;
		const un = (s.unshielded as unknown as { progress?: unknown })?.progress;
		return `${part("shielded", sh)} ${part("dust", du)} ${part("unshielded", un)}`;
	};
	let lastProgressLog = 0;

	return Rx.firstValueFrom(
		wallet.state().pipe(
			Rx.tap((state: FacadeState) => {
				const now = Date.now();
				if (now - lastProgressLog >= throttleTime) {
					lastProgressLog = now;
					logger.info(
						`Sync progress: isSynced=${state.isSynced} ${fmtProgress(state)}`,
					);
				}
			}),
			Rx.throttleTime(throttleTime),
			Rx.filter((state: FacadeState) =>
				isReadyToTransact(state as unknown as ReadinessState, SYNC_MAX_GAP),
			),
			Rx.tap(() =>
				logger.info(
					`Sync complete (all sub-wallets within ${SYNC_MAX_GAP} of chain tip)`,
				),
			),
			Rx.tap((state: FacadeState) => {
				const shieldedBalances = state.shielded.balances || {};
				const unshieldedBalances = state.unshielded.balances || {};
				const dustBalances = state.dust.balance(new Date(Date.now())) || 0n;

				logger.info(
					`Wallet balances after sync - Shielded: ${JSON.stringify(shieldedBalances)}, Unshielded: ${JSON.stringify(unshieldedBalances)}, Dust: ${dustBalances}`,
				);
			}),
			Rx.timeout({
				each: effectiveTimeout,
				with: () =>
					Rx.throwError(
						() => new Error(`Wallet sync timeout after ${effectiveTimeout}ms`),
					),
			}),
		),
	);
};

export const waitForUnshieldedFunds = async (
	logger: Logger,
	wallet: WalletFacade,
	env: EnvironmentConfiguration,
	tokenType: UnshieldedTokenType,
	fundFromFaucet = false,
): Promise<UnshieldedWalletState> => {
	const initialState = await getInitialUnshieldedState(
		logger,
		wallet.unshielded,
	);
	const unshieldedAddress = UnshieldedAddress.codec.encode(
		getNetworkId(),
		initialState.address,
	);
	logger.info(
		`Using unshielded address: ${unshieldedAddress.toString()} waiting for funds...`,
	);
	if (fundFromFaucet && env.faucet) {
		logger.info("Requesting tokens from faucet...");
		await new FaucetClient(env.faucet, logger).requestTokens(
			unshieldedAddress.toString(),
		);
	}
	const initialBalance = initialState.balances[tokenType.raw];
	if (initialBalance === undefined || initialBalance === 0n) {
		logger.info("Your wallet initial balance is: 0 (not yet initialized)");
		logger.info("Waiting to receive tokens...");
		const facadeState = await syncWallet(logger, wallet);
		return facadeState.unshielded;
	}
	return initialState;
};

/**
 * Polls the wallet's shielded state until it holds at least `minAmount` of the
 * given token type (hex `RawTokenType`). A coin minted to this wallet only
 * becomes spendable once the wallet has synced it from the chain; attempting a
 * burn before then fails coin selection. Returns the observed balance.
 */
export const waitForShieldedToken = async (
	logger: Logger,
	wallet: WalletFacade,
	tokenTypeHex: string,
	minAmount: bigint,
	timeout = DEFAULT_SYNC_TIMEOUT_MS,
): Promise<bigint> => {
	logger.info(
		`Waiting for shielded balance of ${tokenTypeHex} >= ${minAmount} (timeout: ${timeout}ms)...`,
	);
	const state = await Rx.firstValueFrom(
		wallet.state().pipe(
			Rx.tap((s: FacadeState) => {
				const bal = s.shielded.balances?.[tokenTypeHex] ?? 0n;
				logger.debug(
					`Shielded balance ${tokenTypeHex}=${bal} (synced=${s.isSynced})`,
				);
			}),
			Rx.filter(
				(s: FacadeState) =>
					(s.shielded.balances?.[tokenTypeHex] ?? 0n) >= minAmount,
			),
			Rx.timeout({
				each: timeout,
				with: () =>
					Rx.throwError(
						() =>
							new Error(
								`Timeout waiting for shielded token ${tokenTypeHex} >= ${minAmount}`,
							),
					),
			}),
		),
	);
	const bal = state.shielded.balances?.[tokenTypeHex] ?? 0n;
	logger.info(`Shielded balance ready: ${tokenTypeHex}=${bal}`);
	return bal;
};
