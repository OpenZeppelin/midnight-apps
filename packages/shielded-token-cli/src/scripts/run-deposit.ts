// SPDX-License-Identifier: MIT
//
// Valid "send to a contract": mint a ShieldedCoinInfo to self, then call
// `deposit(coin)` on the token contract. The contract claims the coin via
// receiveShielded in the SAME tx, so the contract-owned output is not left
// unclaimed — the node accepts it (unlike `send` to a contract that never
// receives, which the node rejects with Custom error 186).
//
// Env: TEST_RECOVERY_PHRASE, TOKEN_ADDRESS, MINT_AMOUNT (default 1000),
//      WALLET_STATES_DIR, PROOF_SERVER_PORT, EXP_OUT.
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
	encodeCoinPublicKey,
	type FinalizedTransaction,
} from "@midnight-ntwrk/ledger-v8";
import { toHex } from "@midnight-ntwrk/midnight-js-utils";
import { StaticProofServerContainer } from "@midnight-ntwrk/testkit-js";
import { mnemonicToSeedSync, validateMnemonic } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english";
import { WebSocket } from "ws";
import { joinContract } from "../api/contract.js";
import { configureProviders } from "../api/providers.js";
import { PreprodRemoteConfig } from "../config.js";
import { createLogger } from "../logger-utils.js";
import { MidnightWalletProvider } from "../midnight-wallet-provider.js";
import { syncWallet, waitForShieldedToken } from "../wallet-utils.js";

// @ts-expect-error: Enable WebSocket for Apollo
globalThis.WebSocket = WebSocket;

function normalizeSeed(s: string): string {
	const t = s.trim();
	if (/^[0-9a-fA-F]+$/.test(t) && (t.length === 64 || t.length === 128)) return t.toLowerCase();
	if (validateMnemonic(t, wordlist)) return toHex(mnemonicToSeedSync(t));
	throw new Error("TEST_RECOVERY_PHRASE invalid");
}

const OUT = process.env.EXP_OUT ?? resolve(process.cwd(), "privacy-experiment/out");

async function main(): Promise<void> {
	const TOKEN_ADDRESS = process.env.TOKEN_ADDRESS;
	const MINT_AMOUNT = BigInt(process.env.MINT_AMOUNT ?? "1000");
	if (!TOKEN_ADDRESS || !process.env.TEST_RECOVERY_PHRASE) throw new Error("set TOKEN_ADDRESS, TEST_RECOVERY_PHRASE");
	mkdirSync(OUT, { recursive: true });

	const config = new PreprodRemoteConfig();
	const logger = await createLogger(process.env.EXP_LOG ?? config.logDir);
	const testEnv = config.getEnvironment(logger);
	const proofServer = new StaticProofServerContainer(Number(process.env.PROOF_SERVER_PORT ?? "6300"));
	const envConfiguration = await testEnv.start(proofServer);

	const seed = normalizeSeed(process.env.TEST_RECOVERY_PHRASE);
	const walletProvider = await MidnightWalletProvider.build(logger, envConfiguration, seed);
	await walletProvider.start();
	logger.info("[deposit] tail-syncing from restored cache…");
	await syncWallet(logger, walletProvider.wallet);

	let phaseLabel = "C-deposit-contract";
	const origSubmit = walletProvider.submitTx.bind(walletProvider);
	walletProvider.submitTx = async (tx: FinalizedTransaction): Promise<string> => {
		try {
			writeFileSync(resolve(OUT, `${phaseLabel}.hex`), Buffer.from(tx.serialize()).toString("hex"));
			writeFileSync(resolve(OUT, `${phaseLabel}.decode.txt`), tx.toString(false));
			logger.info(`[deposit] captured ${phaseLabel} raw tx -> ${OUT}/${phaseLabel}.hex`);
		} catch (e) {
			logger.warn(`[deposit] capture failed: ${(e as Error).message}`);
		}
		return origSubmit(tx);
	};

	const providers = configureProviders(walletProvider, config);
	const token = await joinContract(providers, TOKEN_ADDRESS, config.zkConfigPath, logger);

	// Mint a coin to self, wait for it to sync.
	const ownCoinPk = walletProvider.getCoinPublicKey();
	phaseLabel = "C-mint";
	logger.info(`[deposit] minting ${MINT_AMOUNT} to self…`);
	const mintTx = await token.mint(
		{ is_left: true, left: { bytes: encodeCoinPublicKey(String(ownCoinPk)) }, right: { bytes: new Uint8Array(32) } },
		MINT_AMOUNT,
	);
	const coin = mintTx.private.result as { nonce: Uint8Array; color: Uint8Array; value: bigint };
	const colorHex = Buffer.from(coin.color).toString("hex");
	await waitForShieldedToken(logger, walletProvider.wallet, colorHex, coin.value);

	// Deposit the coin INTO the contract: the contract claims it -> node accepts it.
	phaseLabel = "C-deposit-contract";
	logger.info(`[deposit] === depositing ${coin.value} INTO contract ${TOKEN_ADDRESS} (receiveShielded) ===`);
	const txData = await token.deposit(coin);
	const txHash = (txData as { public?: { txHash?: string; blockHeight?: number } })?.public?.txHash;
	const block = (txData as { public?: { blockHeight?: number } })?.public?.blockHeight;
	logger.info(`[deposit] ACCEPTED txHash=${txHash} block=${block}`);
	writeFileSync(resolve(OUT, "C-deposit-contract.summary.json"), JSON.stringify({
		recipientKind: "contract (this token, via deposit/receiveShielded)",
		recipientContract: TOKEN_ADDRESS,
		accepted: true,
		txHash,
		blockHeight: block,
		explorer: `https://preprod.midnightexplorer.com/transactions/0x${txHash}`,
	}, null, 2));

	try { await (walletProvider as { close?: () => Promise<void> }).close?.(); } catch {}
	try { await walletProvider.stop(); } catch {}
}

main().then(() => process.exit(0)).catch((e) => {
	console.error("[deposit] FATAL:", e instanceof Error ? e.stack : String(e));
	process.exit(1);
});
