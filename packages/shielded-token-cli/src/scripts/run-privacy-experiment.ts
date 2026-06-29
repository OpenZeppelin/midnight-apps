// SPDX-License-Identifier: MIT
//
// Privacy experiment driver (Phase 2): using the SAME wallet state the
// compact-deployer synced (restored from ./.states via WALLET_STATES_DIR — no
// fresh resync), mint ShieldedFungibleToken coins and exercise the new `send`
// circuit twice:
//   (A) send to ANOTHER USER  — recipient is a ZswapCoinPublicKey
//   (B) send to ANOTHER CONTRACT — recipient is a ContractAddress
// For each tx we capture the raw serialized bytes + the indexer's-eye decode so
// we can answer: does the recipient ("parent") stay private on-chain?
//
// Env: TEST_RECOVERY_PHRASE, TOKEN_ADDRESS (the just-deployed contract),
//      RECIPIENT_CONTRACT, MINT_AMOUNT (default 1000), WALLET_STATES_DIR,
//      PROOF_SERVER_PORT (default 6300), EXP_OUT (artifact dir).
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
	encodeCoinPublicKey,
	type FinalizedTransaction,
	ZswapSecretKeys,
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
	if (/^[0-9a-fA-F]+$/.test(t) && (t.length === 64 || t.length === 128))
		return t.toLowerCase();
	if (validateMnemonic(t, wordlist)) return toHex(mnemonicToSeedSync(t));
	throw new Error("TEST_RECOVERY_PHRASE is not a valid hex seed or mnemonic");
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
	const RECIPIENT_CONTRACT = process.env.RECIPIENT_CONTRACT;
	const MINT_AMOUNT = BigInt(process.env.MINT_AMOUNT ?? "1000");
	if (!TOKEN_ADDRESS || !RECIPIENT_CONTRACT || !process.env.TEST_RECOVERY_PHRASE) {
		throw new Error("set TOKEN_ADDRESS, RECIPIENT_CONTRACT, TEST_RECOVERY_PHRASE");
	}
	mkdirSync(OUT, { recursive: true });

	const config = new PreprodRemoteConfig();
	const logger = await createLogger(
		process.env.EXP_LOG ?? config.logDir,
	);
	const testEnv = config.getEnvironment(logger);
	const port = Number(process.env.PROOF_SERVER_PORT ?? "6300");
	const proofServer = new StaticProofServerContainer(port);
	const envConfiguration = await testEnv.start(proofServer);

	const seed = normalizeSeed(process.env.TEST_RECOVERY_PHRASE);
	const walletProvider = await MidnightWalletProvider.build(logger, envConfiguration, seed);
	await walletProvider.start();

	logger.info("[exp] syncing wallet tail from restored cache (should be quick)…");
	await syncWallet(logger, walletProvider.wallet);
	logger.info("[exp] wallet sync gate passed");

	// Capture the raw serialized tx for each phase, BEFORE the node submit, by
	// wrapping submitTx. The provider's own dumpTransaction still logs the decode.
	let phaseLabel = "unlabeled";
	const origSubmit = walletProvider.submitTx.bind(walletProvider);
	walletProvider.submitTx = async (tx: FinalizedTransaction): Promise<string> => {
		try {
			const raw = Buffer.from(tx.serialize()).toString("hex");
			writeFileSync(resolve(OUT, `${phaseLabel}.hex`), raw);
			writeFileSync(resolve(OUT, `${phaseLabel}.decode.txt`), tx.toString(false));
			logger.info(`[exp] captured ${phaseLabel} raw tx (${raw.length / 2} bytes) -> ${OUT}/${phaseLabel}.hex`);
		} catch (e) {
			logger.warn(`[exp] capture failed for ${phaseLabel}: ${(e as Error).message}`);
		}
		return origSubmit(tx);
	};

	const providers = configureProviders(walletProvider, config);
	const token = await joinContract(providers, TOKEN_ADDRESS, config.zkConfigPath, logger);
	logger.info(`[exp] joined token at ${token.deployedContractAddressHex}`);

	// Recipients: our own key, a throwaway "other user" key, and the target contract.
	const ownCoinPk = walletProvider.getCoinPublicKey();
	const otherUserSeed = new Uint8Array(32).fill(7); // deterministic throwaway "user 2"
	const otherUserPk = ZswapSecretKeys.fromSeed(otherUserSeed).coinPublicKey;
	const userRecipient = {
		is_left: true,
		left: { bytes: encodeCoinPublicKey(String(otherUserPk)) },
		right: { bytes: new Uint8Array(32) },
	};
	const contractRecipient = {
		is_left: false,
		left: { bytes: new Uint8Array(32) },
		right: { bytes: hexToBytes(RECIPIENT_CONTRACT) },
	};

	const summary: Record<string, unknown> = {
		tokenAddress: TOKEN_ADDRESS,
		ownCoinPublicKey: String(ownCoinPk),
		otherUserCoinPublicKey: String(otherUserPk),
		otherUserCoinPublicKeyEncodedHex: Buffer.from(encodeCoinPublicKey(String(otherUserPk))).toString("hex"),
		recipientContract: RECIPIENT_CONTRACT,
		mintAmount: MINT_AMOUNT.toString(),
		phases: {} as Record<string, unknown>,
	};

	// ---- helper: mint a coin to self, wait for it to sync, return it ----
	const mintAndWait = async (label: string) => {
		phaseLabel = `${label}-mint`;
		logger.info(`[exp] === ${label}: minting ${MINT_AMOUNT} to self ===`);
		const txData = await token.mint(
			{ is_left: true, left: { bytes: encodeCoinPublicKey(String(ownCoinPk)) }, right: { bytes: new Uint8Array(32) } },
			MINT_AMOUNT,
		);
		const coin = txData.private.result as { nonce: Uint8Array; color: Uint8Array; value: bigint };
		const colorHex = Buffer.from(coin.color).toString("hex");
		logger.info(`[exp] ${label}: minted coin color=${colorHex} value=${coin.value}; waiting to sync…`);
		await waitForShieldedToken(logger, walletProvider.wallet, colorHex, coin.value);
		return coin;
	};

	// ---- Phase A: send to ANOTHER USER (ZswapCoinPublicKey) ----
	try {
		const coinA = await mintAndWait("A");
		phaseLabel = "A-send-user";
		logger.info(`[exp] === A: send ${coinA.value} to USER ${String(otherUserPk)} ===`);
		const res = await token.send(userRecipient, coinA, coinA.value);
		logger.info(`[exp] A send accepted: txHash=${res?.public?.txHash} block=${res?.public?.blockHeight}`);
		summary.phases = { ...(summary.phases as object), A: { recipientKind: "user", accepted: true, txHash: res?.public?.txHash, block: res?.public?.blockHeight } };
	} catch (e) {
		logger.warn(`[exp] A send rejected_at_submit (raw tx already captured): ${(e as Error).message}`);
		summary.phases = { ...(summary.phases as object), A: { recipientKind: "user", accepted: false, error: (e as Error).message } };
	}

	// ---- Phase B: send to ANOTHER CONTRACT (ContractAddress) ----
	try {
		const coinB = await mintAndWait("B");
		phaseLabel = "B-send-contract";
		logger.info(`[exp] === B: send ${coinB.value} to CONTRACT ${RECIPIENT_CONTRACT} ===`);
		const res = await token.send(contractRecipient, coinB, coinB.value);
		logger.info(`[exp] B send accepted: txHash=${res?.public?.txHash} block=${res?.public?.blockHeight}`);
		summary.phases = { ...(summary.phases as object), B: { recipientKind: "contract", accepted: true, txHash: res?.public?.txHash, block: res?.public?.blockHeight } };
	} catch (e) {
		logger.warn(`[exp] B send rejected_at_submit (raw tx already captured): ${(e as Error).message}`);
		summary.phases = { ...(summary.phases as object), B: { recipientKind: "contract", accepted: false, error: (e as Error).message } };
	}

	writeFileSync(resolve(OUT, "summary.json"), JSON.stringify(summary, null, 2));
	logger.info(`[exp] summary written to ${OUT}/summary.json`);

	try {
		await (walletProvider as { close?: () => Promise<void> }).close?.();
	} catch {}
	try {
		await walletProvider.stop();
	} catch {}
}

main()
	.then(() => process.exit(0))
	.catch((e) => {
		console.error("[exp] FATAL:", e instanceof Error ? e.stack : String(e));
		process.exit(1);
	});
