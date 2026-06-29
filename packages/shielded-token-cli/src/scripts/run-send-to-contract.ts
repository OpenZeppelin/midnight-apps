// SPDX-License-Identifier: MIT
//
// Use the `send` circuit with a `to:` of type ContractAddress and try to land it
// on preprod. A contract-owned Zswap output is only valid if that contract claims
// it in the same tx; the only contract present in a single `send` call is the
// token contract itself, so RECIPIENT_CONTRACT defaults to the token's own address.
//
// Env: TEST_RECOVERY_PHRASE, TOKEN_ADDRESS, RECIPIENT_CONTRACT (default = TOKEN_ADDRESS),
//      MINT_AMOUNT (default 1000), WALLET_STATES_DIR, PROOF_SERVER_PORT, EXP_OUT.
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
function hexToBytes(hex: string): Uint8Array {
	const c = hex.trim().replace(/^0x/, "");
	const b = new Uint8Array(c.length / 2);
	for (let i = 0; i < c.length; i += 2) b[i / 2] = Number.parseInt(c.slice(i, i + 2), 16);
	return b;
}

const OUT = process.env.EXP_OUT ?? resolve(process.cwd(), "privacy-experiment/out");

async function main(): Promise<void> {
	const TOKEN_ADDRESS = process.env.TOKEN_ADDRESS;
	const MINT_AMOUNT = BigInt(process.env.MINT_AMOUNT ?? "1000");
	if (!TOKEN_ADDRESS || !process.env.TEST_RECOVERY_PHRASE) throw new Error("set TOKEN_ADDRESS, TEST_RECOVERY_PHRASE");
	const RECIPIENT_CONTRACT = process.env.RECIPIENT_CONTRACT ?? TOKEN_ADDRESS;
	mkdirSync(OUT, { recursive: true });

	const config = new PreprodRemoteConfig();
	const logger = await createLogger(process.env.EXP_LOG ?? config.logDir);
	const testEnv = config.getEnvironment(logger);
	const proofServer = new StaticProofServerContainer(Number(process.env.PROOF_SERVER_PORT ?? "6300"));
	const envConfiguration = await testEnv.start(proofServer);

	const seed = normalizeSeed(process.env.TEST_RECOVERY_PHRASE);
	const walletProvider = await MidnightWalletProvider.build(logger, envConfiguration, seed);
	await walletProvider.start();
	logger.info("[send2c] tail-syncing from restored cache…");
	await syncWallet(logger, walletProvider.wallet);

	let phaseLabel = "D-send-contract";
	const origSubmit = walletProvider.submitTx.bind(walletProvider);
	walletProvider.submitTx = async (tx: FinalizedTransaction): Promise<string> => {
		try {
			writeFileSync(resolve(OUT, `${phaseLabel}.hex`), Buffer.from(tx.serialize()).toString("hex"));
			writeFileSync(resolve(OUT, `${phaseLabel}.decode.txt`), tx.toString(false));
			logger.info(`[send2c] captured ${phaseLabel} raw tx -> ${OUT}/${phaseLabel}.hex`);
		} catch (e) {
			logger.warn(`[send2c] capture failed: ${(e as Error).message}`);
		}
		return origSubmit(tx);
	};

	const providers = configureProviders(walletProvider, config);
	const token = await joinContract(providers, TOKEN_ADDRESS, config.zkConfigPath, logger);

	const ownCoinPk = walletProvider.getCoinPublicKey();
	phaseLabel = "D-mint";
	logger.info(`[send2c] minting ${MINT_AMOUNT} to self…`);
	const mintTx = await token.mint(
		{ is_left: true, left: { bytes: encodeCoinPublicKey(String(ownCoinPk)) }, right: { bytes: new Uint8Array(32) } },
		MINT_AMOUNT,
	);
	const coin = mintTx.private.result as { nonce: Uint8Array; color: Uint8Array; value: bigint };
	await waitForShieldedToken(logger, walletProvider.wallet, Buffer.from(coin.color).toString("hex"), coin.value);

	// Contract recipient via the send circuit's `to` (right/ContractAddress arm).
	const contractRecipient = {
		is_left: false,
		left: { bytes: new Uint8Array(32) },
		right: { bytes: hexToBytes(RECIPIENT_CONTRACT) },
	};

	phaseLabel = "D-send-contract";
	logger.info(`[send2c] === send ${coin.value} to CONTRACT ${RECIPIENT_CONTRACT} via send circuit ===`);
	try {
		const txData = await token.send(contractRecipient, coin, coin.value);
		const txHash = (txData as { public?: { txHash?: string; blockHeight?: number } })?.public?.txHash;
		const block = (txData as { public?: { blockHeight?: number } })?.public?.blockHeight;
		logger.info(`[send2c] ACCEPTED txHash=${txHash} block=${block}`);
		writeFileSync(resolve(OUT, "D-send-contract.summary.json"), JSON.stringify({
			circuit: "send", recipientKind: "contract", recipientContract: RECIPIENT_CONTRACT,
			accepted: true, txHash, blockHeight: block,
			explorer: `https://preprod.midnightexplorer.com/transactions/0x${txHash}`,
		}, null, 2));
	} catch (e) {
		logger.warn(`[send2c] REJECTED: ${(e as Error).message}`);
		writeFileSync(resolve(OUT, "D-send-contract.summary.json"), JSON.stringify({
			circuit: "send", recipientKind: "contract", recipientContract: RECIPIENT_CONTRACT,
			accepted: false, error: (e as Error).message,
		}, null, 2));
	}

	try { await (walletProvider as { close?: () => Promise<void> }).close?.(); } catch {}
	try { await walletProvider.stop(); } catch {}
}

main().then(() => process.exit(0)).catch((e) => {
	console.error("[send2c] FATAL:", e instanceof Error ? e.stack : String(e));
	process.exit(1);
});
