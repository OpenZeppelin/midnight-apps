// SPDX-License-Identifier: MIT
//
// Privacy experiment — Phase A (completed): send to ANOTHER USER.
// Sending a shielded coin to a recipient's ZswapCoinPublicKey requires the
// recipient's ENCRYPTION (viewing) public key so the SDK can build the coin
// ciphertext — the Either<ZswapCoinPublicKey, ContractAddress> alone is not
// enough. We supply it via `createCallTxOptions(..., additionalCoinEncPublicKey
// Mappings, ...)` + `submitCallTx`, then capture the raw tx to confirm the
// recipient stays private on-chain (no cleartext key, output contract=undefined).
//
// Env: TEST_RECOVERY_PHRASE, TOKEN_ADDRESS, MINT_AMOUNT (default 1000),
//      WALLET_STATES_DIR, PROOF_SERVER_PORT, EXP_OUT, OTHER_USER_SEED_BYTE (0-255).
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
	if (/^[0-9a-fA-F]+$/.test(t) && (t.length === 64 || t.length === 128)) return t.toLowerCase();
	if (validateMnemonic(t, wordlist)) return toHex(mnemonicToSeedSync(t));
	throw new Error("TEST_RECOVERY_PHRASE invalid");
}

const OUT = process.env.EXP_OUT ?? resolve(process.cwd(), "privacy-experiment/out");
const PRIVATE_STATE_ID = "shieldedFungibleTokenPrivateState";

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
	logger.info("[user-send] tail-syncing from restored cache…");
	await syncWallet(logger, walletProvider.wallet);

	let phaseLabel = "A-send-user";
	const origSubmit = walletProvider.submitTx.bind(walletProvider);
	walletProvider.submitTx = async (tx: FinalizedTransaction): Promise<string> => {
		try {
			writeFileSync(resolve(OUT, `${phaseLabel}.hex`), Buffer.from(tx.serialize()).toString("hex"));
			writeFileSync(resolve(OUT, `${phaseLabel}.decode.txt`), tx.toString(false));
			logger.info(`[user-send] captured ${phaseLabel} raw tx -> ${OUT}/${phaseLabel}.hex`);
		} catch (e) {
			logger.warn(`[user-send] capture failed: ${(e as Error).message}`);
		}
		return origSubmit(tx);
	};

	const providers = configureProviders(walletProvider, config);
	const token = await joinContract(providers, TOKEN_ADDRESS, config.zkConfigPath, logger);

	// Mint a coin to self (self enc key is known), wait for it to sync.
	const ownCoinPk = walletProvider.getCoinPublicKey();
	phaseLabel = "A-mint-user";
	logger.info(`[user-send] minting ${MINT_AMOUNT} to self…`);
	const mintTx = await token.mint(
		{ is_left: true, left: { bytes: encodeCoinPublicKey(String(ownCoinPk)) }, right: { bytes: new Uint8Array(32) } },
		MINT_AMOUNT,
	);
	const coin = mintTx.private.result as { nonce: Uint8Array; color: Uint8Array; value: bigint };
	const colorHex = Buffer.from(coin.color).toString("hex");
	await waitForShieldedToken(logger, walletProvider.wallet, colorHex, coin.value);

	// Build "another user" full keypair + the coinPk -> encPk mapping the SDK needs.
	const otherSeed = new Uint8Array(32).fill(Number(process.env.OTHER_USER_SEED_BYTE ?? "7"));
	const otherKeys = ZswapSecretKeys.fromSeed(otherSeed);
	const otherCoinPk = otherKeys.coinPublicKey;
	const otherEncPk = otherKeys.encryptionPublicKey;
	const mappings = new Map([[otherCoinPk, otherEncPk]]);
	logger.info(`[user-send] recipient user coinPk=${String(otherCoinPk)}`);

	const userRecipient = {
		is_left: true,
		left: { bytes: encodeCoinPublicKey(String(otherCoinPk)) },
		right: { bytes: new Uint8Array(32) },
	};

	phaseLabel = "A-send-user";
	logger.info(`[user-send] === sending ${coin.value} to USER via send circuit (with enc-key mapping) ===`);
	try {
		const txData = await token.send(userRecipient, coin, coin.value, mappings);
		logger.info(`[user-send] ACCEPTED txHash=${(txData as { public?: { txHash?: string } })?.public?.txHash}`);
		writeFileSync(resolve(OUT, "A-send-user.summary.json"), JSON.stringify({
			recipientKind: "user", accepted: true,
			otherUserCoinPublicKey: String(otherCoinPk),
			txHash: (txData as { public?: { txHash?: string } })?.public?.txHash,
		}, null, 2));
	} catch (e) {
		logger.warn(`[user-send] rejected_at_submit (raw tx captured): ${(e as Error).message}`);
		writeFileSync(resolve(OUT, "A-send-user.summary.json"), JSON.stringify({
			recipientKind: "user", accepted: false,
			otherUserCoinPublicKey: String(otherCoinPk),
			error: (e as Error).message,
		}, null, 2));
	}

	try { await (walletProvider as { close?: () => Promise<void> }).close?.(); } catch {}
	try { await walletProvider.stop(); } catch {}
}

main().then(() => process.exit(0)).catch((e) => {
	console.error("[user-send] FATAL:", e instanceof Error ? e.stack : String(e));
	process.exit(1);
});
