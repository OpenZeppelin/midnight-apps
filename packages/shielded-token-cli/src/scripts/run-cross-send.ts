// SPDX-License-Identifier: MIT
//
// Cross-token experiment using ONLY the `send` circuit (color assert removed).
// Two contracts A and B (two ShieldedFungibleToken instances, distinct colors).
// The user holds a coin of each token, then sends the OTHER token into each
// contract via that contract's own `send(to = its own address, coin, value)`:
//   - A.send(to=A, coinB)  -> token B's coin received into contract A
//   - B.send(to=B, coinA)  -> token A's coin received into contract B
// `to` = the executing contract, so the contract claims its own send output
// (valid); and because `send` no longer checks color, A can carry token B's coin.
//
// Env: TEST_RECOVERY_PHRASE, MINT_AMOUNT (default 1000), WALLET_STATES_DIR,
//      PROOF_SERVER_PORT, EXP_OUT.
import { randomBytes } from "node:crypto";
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
import { ShieldedFungibleToken } from "@openzeppelin/midnight-apps-shielded-token-api";
import { WebSocket } from "ws";
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
function contractRecipient(addrHex: string) {
	return { is_left: false, left: { bytes: new Uint8Array(32) }, right: { bytes: hexToBytes(addrHex) } };
}

const OUT = process.env.EXP_OUT ?? resolve(process.cwd(), "privacy-experiment/out");
const EXPL = (h?: string) => `https://preprod.midnightexplorer.com/transactions/0x${h}`;

async function main(): Promise<void> {
	if (!process.env.TEST_RECOVERY_PHRASE) throw new Error("set TEST_RECOVERY_PHRASE");
	const MINT_AMOUNT = BigInt(process.env.MINT_AMOUNT ?? "1000");
	mkdirSync(OUT, { recursive: true });

	const config = new PreprodRemoteConfig();
	const logger = await createLogger(process.env.EXP_LOG ?? config.logDir);
	const testEnv = config.getEnvironment(logger);
	const proofServer = new StaticProofServerContainer(Number(process.env.PROOF_SERVER_PORT ?? "6300"));
	const envConfiguration = await testEnv.start(proofServer);

	const seed = normalizeSeed(process.env.TEST_RECOVERY_PHRASE);
	const walletProvider = await MidnightWalletProvider.build(logger, envConfiguration, seed);
	await walletProvider.start();
	logger.info("[cross] tail-syncing from restored cache…");
	await syncWallet(logger, walletProvider.wallet);

	// Capture each tx's hash + raw bytes, keyed by the current phase label.
	let phaseLabel = "init";
	const txHashes: Record<string, string> = {};
	const origSubmit = walletProvider.submitTx.bind(walletProvider);
	walletProvider.submitTx = async (tx: FinalizedTransaction): Promise<string> => {
		try {
			const h = Buffer.from(tx.transactionHash() as unknown as Uint8Array).toString("hex");
			txHashes[phaseLabel] = h;
			writeFileSync(resolve(OUT, `${phaseLabel}.hex`), Buffer.from(tx.serialize()).toString("hex"));
			logger.info(`[cross] captured ${phaseLabel} txHash=${h}`);
		} catch (e) {
			logger.warn(`[cross] capture failed for ${phaseLabel}: ${(e as Error).message}`);
		}
		return origSubmit(tx);
	};

	const providers = configureProviders(walletProvider, config);
	const ownCoinPk = walletProvider.getCoinPublicKey();
	const selfRecipient = { is_left: true, left: { bytes: encodeCoinPublicKey(String(ownCoinPk)) }, right: { bytes: new Uint8Array(32) } };

	// --- Deploy token A and token B (distinct random colors) ---
	phaseLabel = "deploy-A";
	logger.info("[cross] deploying token A…");
	const tokenA = await ShieldedFungibleToken.deploy(providers, randomBytes(32), "Cross Token A", "XTA", randomBytes(32), config.zkConfigPath, logger);
	const addrA = tokenA.deployedContractAddressHex;
	phaseLabel = "deploy-B";
	logger.info("[cross] deploying token B…");
	const tokenB = await ShieldedFungibleToken.deploy(providers, randomBytes(32), "Cross Token B", "XTB", randomBytes(32), config.zkConfigPath, logger);
	const addrB = tokenB.deployedContractAddressHex;
	logger.info(`[cross] A=${addrA}  B=${addrB}`);

	// --- Mint a coin from each token to self ---
	phaseLabel = "mint-A";
	const mA = await tokenA.mint(selfRecipient, MINT_AMOUNT);
	const coinA = mA.private.result as { nonce: Uint8Array; color: Uint8Array; value: bigint };
	phaseLabel = "mint-B";
	const mB = await tokenB.mint(selfRecipient, MINT_AMOUNT);
	const coinB = mB.private.result as { nonce: Uint8Array; color: Uint8Array; value: bigint };
	const colorA = Buffer.from(coinA.color).toString("hex");
	const colorB = Buffer.from(coinB.color).toString("hex");
	logger.info(`[cross] minted coinA color=${colorA} and coinB color=${colorB}; waiting to sync…`);
	await waitForShieldedToken(logger, walletProvider.wallet, colorA, coinA.value);
	await waitForShieldedToken(logger, walletProvider.wallet, colorB, coinB.value);

	const summary: Record<string, unknown> = {
		tokenA: { address: addrA, color: colorA },
		tokenB: { address: addrB, color: colorB },
		sends: {},
	};

	// --- send token B INTO contract A via A.send(to=A, coinB) ---
	phaseLabel = "send-B-into-A";
	logger.info(`[cross] === A.send(to=A=${addrA}, coinB) -> token B into contract A ===`);
	try {
		const r = await tokenA.send(contractRecipient(addrA), coinB, coinB.value);
		const h = (r as { public?: { txHash?: string; blockHeight?: number } })?.public;
		logger.info(`[cross] B->A ACCEPTED txHash=${h?.txHash} block=${h?.blockHeight}`);
		(summary.sends as Record<string, unknown>)["B_into_A"] = { accepted: true, txHash: h?.txHash, block: h?.blockHeight, explorer: EXPL(h?.txHash) };
	} catch (e) {
		logger.warn(`[cross] B->A REJECTED: ${(e as Error).message}`);
		(summary.sends as Record<string, unknown>)["B_into_A"] = { accepted: false, error: (e as Error).message };
	}

	// --- send token A INTO contract B via B.send(to=B, coinA) ---
	phaseLabel = "send-A-into-B";
	logger.info(`[cross] === B.send(to=B=${addrB}, coinA) -> token A into contract B ===`);
	try {
		const r = await tokenB.send(contractRecipient(addrB), coinA, coinA.value);
		const h = (r as { public?: { txHash?: string; blockHeight?: number } })?.public;
		logger.info(`[cross] A->B ACCEPTED txHash=${h?.txHash} block=${h?.blockHeight}`);
		(summary.sends as Record<string, unknown>)["A_into_B"] = { accepted: true, txHash: h?.txHash, block: h?.blockHeight, explorer: EXPL(h?.txHash) };
	} catch (e) {
		logger.warn(`[cross] A->B REJECTED: ${(e as Error).message}`);
		(summary.sends as Record<string, unknown>)["A_into_B"] = { accepted: false, error: (e as Error).message };
	}

	summary.allTxHashes = txHashes;
	summary.explorer = Object.fromEntries(Object.entries(txHashes).map(([k, v]) => [k, EXPL(v)]));
	writeFileSync(resolve(OUT, "cross-send.summary.json"), JSON.stringify(summary, null, 2));
	logger.info(`[cross] summary -> ${OUT}/cross-send.summary.json`);

	try { await (walletProvider as { close?: () => Promise<void> }).close?.(); } catch {}
	try { await walletProvider.stop(); } catch {}
}

main().then(() => process.exit(0)).catch((e) => {
	console.error("[cross] FATAL:", e instanceof Error ? e.stack : String(e));
	process.exit(1);
});
