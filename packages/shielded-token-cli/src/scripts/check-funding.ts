// SPDX-License-Identifier: MIT
//
// Fast funding probe for the preprod test wallet.
//
// The full deploy run blocks on a ~44 min global dust replay before it ever
// reports the NIGHT balance. The *unshielded* sub-wallet, by contrast, only
// syncs this address's own UTXOs from the node and completes in seconds-to-a-
// minute. This probe builds the wallet, starts it, waits only for the
// unshielded sub-wallet to catch up to the chain tip, then prints the NIGHT
// (unshielded) balance and exits — so we can confirm the wallet is funded
// without paying for a full sync.
//
// Usage: TEST_RECOVERY_PHRASE=... PROOF_SERVER_PORT=6300 node ... check-funding.ts

import { unshieldedToken } from "@midnight-ntwrk/ledger-v8";
import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import { toHex } from "@midnight-ntwrk/midnight-js-utils";
import type { EnvironmentConfiguration } from "@midnight-ntwrk/testkit-js";
import type { FacadeState } from "@midnight-ntwrk/wallet-sdk";
import { preprod } from "@openzeppelin/midnight-networks";
import { mnemonicToSeedSync, validateMnemonic } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english";
import * as Rx from "rxjs";
import { WebSocket } from "ws";
import { createLogger } from "../logger-utils.js";
import { MidnightWalletProvider } from "../midnight-wallet-provider.js";

// @ts-expect-error: Enable WebSocket for Apollo
globalThis.WebSocket = WebSocket;

function normalizeSeed(input: string): string {
	const trimmed = input.trim();
	if (!trimmed) throw new Error("Seed cannot be empty");
	if (
		/^[0-9a-fA-F]+$/.test(trimmed) &&
		(trimmed.length === 64 || trimmed.length === 128)
	) {
		return trimmed.toLowerCase();
	}
	if (validateMnemonic(trimmed, wordlist))
		return toHex(mnemonicToSeedSync(trimmed));
	throw new Error("Invalid seed: expected 64-char hex or a BIP39 mnemonic");
}

const main = async (): Promise<void> => {
	const logger = await createLogger(
		`${process.cwd()}/logs/preprod-remote/check-funding-${new Date().toISOString()}.log`,
	);
	const phrase = process.env.TEST_RECOVERY_PHRASE;
	if (!phrase) throw new Error("TEST_RECOVERY_PHRASE is required");
	const seed = normalizeSeed(phrase);

	setNetworkId(preprod.networkId);
	const port = process.env.PROOF_SERVER_PORT ?? "6300";
	const env: EnvironmentConfiguration = {
		walletNetworkId: preprod.networkId,
		networkId: preprod.networkId,
		indexer: preprod.indexer,
		indexerWS: preprod.indexerWS,
		node: preprod.node,
		nodeWS: preprod.node
			.replace("https://", "wss://")
			.replace("http://", "ws://"),
		faucet: preprod.faucetUrl,
		proofServer: `http://localhost:${port}`,
	} as EnvironmentConfiguration;

	const provider = await MidnightWalletProvider.build(logger, env, seed);
	await provider.start();

	const maxGap = BigInt(process.env.WALLET_SYNC_MAX_GAP ?? "50");
	const timeoutMs = Number(process.env.UNSHIELDED_PROBE_TIMEOUT_MS ?? "300000");
	const nightRaw = unshieldedToken().raw;

	logger.info(
		`Waiting for unshielded sub-wallet to reach chain tip (maxGap=${maxGap}, timeout=${timeoutMs}ms)...`,
	);

	try {
		const state = await Rx.firstValueFrom(
			provider.wallet.state().pipe(
				Rx.tap((s: FacadeState) => {
					const un = s.unshielded as unknown as {
						progress?: {
							appliedId?: bigint;
							highestTransactionId?: bigint;
							isConnected?: boolean;
						};
						balances?: Record<string, bigint>;
					};
					const p = un?.progress;
					logger.info(
						`unshielded: conn=${p?.isConnected} appliedId=${p?.appliedId} highestTxId=${p?.highestTransactionId} balances=${JSON.stringify(un?.balances ?? {})}`,
					);
				}),
				Rx.filter((s: FacadeState) => {
					const p = (
						s.unshielded as unknown as {
							progress?: { isCompleteWithin?: (g: bigint) => boolean };
						}
					)?.progress;
					return (
						typeof p?.isCompleteWithin === "function" &&
						p.isCompleteWithin(maxGap)
					);
				}),
				Rx.timeout({
					each: timeoutMs,
					with: () =>
						Rx.throwError(
							() => new Error(`Unshielded sync timeout after ${timeoutMs}ms`),
						),
				}),
			),
		);

		const balances = state.unshielded.balances ?? {};
		const night = balances[nightRaw];
		logger.info(`Unshielded balances: ${JSON.stringify(balances)}`);
		logger.info(
			night === undefined || night === 0n
				? `RESULT: NOT FUNDED — NIGHT balance is ${night ?? "absent"}`
				: `RESULT: FUNDED — NIGHT balance is ${night}`,
		);
	} finally {
		await provider.stop();
	}
};

main().then(
	() => process.exit(0),
	(e) => {
		console.error(e);
		process.exit(1);
	},
);
