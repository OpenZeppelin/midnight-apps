// SPDX-License-Identifier: MIT
//
// Standalone proof script: mint ShieldedFungibleToken coins to a CONTRACT
// address on preprod, so the resulting tx's Zswap output carries the recipient
// contract address in cleartext (Output.contractAddress). Mirrors index.ts's
// run() flow but mints to a contract recipient (is_left:false) instead of the
// wallet's own coin public key.
//
// Env: TEST_RECOVERY_PHRASE, TOKEN_ADDRESS, RECIPIENT_CONTRACT,
//      MINT_AMOUNT (default 1000), PROOF_SERVER_PORT (default 6300).
import { toHex } from "@midnight-ntwrk/midnight-js-utils";
import { StaticProofServerContainer } from "@midnight-ntwrk/testkit-js";
import { mnemonicToSeedSync, validateMnemonic } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english";
import { WebSocket } from "ws";
import { joinContract } from "./api/contract.js";
import { configureProviders } from "./api/providers.js";
import { PreprodRemoteConfig } from "./config.js";
import { createLogger } from "./logger-utils.js";
import { MidnightWalletProvider } from "./midnight-wallet-provider.js";
import { syncWallet } from "./wallet-utils.js";

// @ts-expect-error: Enable WebSocket for Apollo
globalThis.WebSocket = WebSocket;

function normalizeSeed(inputStr: string): string {
	const t = inputStr.trim();
	if (/^[0-9a-fA-F]+$/.test(t) && (t.length === 64 || t.length === 128)) {
		return t.toLowerCase();
	}
	if (validateMnemonic(t, wordlist)) {
		return toHex(mnemonicToSeedSync(t));
	}
	throw new Error("TEST_RECOVERY_PHRASE is not a valid hex seed or mnemonic");
}

function hexToBytes(hex: string): Uint8Array {
	const c = hex.trim().replace(/^0x/, "");
	const b = new Uint8Array(c.length / 2);
	for (let i = 0; i < c.length; i += 2) b[i / 2] = Number.parseInt(c.slice(i, i + 2), 16);
	return b;
}

async function main(): Promise<void> {
	const TOKEN_ADDRESS = process.env.TOKEN_ADDRESS;
	const RECIPIENT_CONTRACT = process.env.RECIPIENT_CONTRACT;
	const MINT_AMOUNT = BigInt(process.env.MINT_AMOUNT ?? "1000");
	if (!TOKEN_ADDRESS || !RECIPIENT_CONTRACT || !process.env.TEST_RECOVERY_PHRASE) {
		throw new Error("set TOKEN_ADDRESS, RECIPIENT_CONTRACT, TEST_RECOVERY_PHRASE");
	}

	const config = new PreprodRemoteConfig();
	const logger = await createLogger(config.logDir);
	console.log(`[proof] logDir = ${config.logDir}`);
	const testEnv = config.getEnvironment(logger);
	const port = Number(process.env.PROOF_SERVER_PORT ?? "6300");
	const proofServer = new StaticProofServerContainer(port);
	const envConfiguration = await testEnv.start(proofServer);

	const seed = normalizeSeed(process.env.TEST_RECOVERY_PHRASE);
	const walletProvider = await MidnightWalletProvider.build(logger, envConfiguration, seed);
	await walletProvider.start();

	// The CLI wallet builds fresh (no .states restore), so dust must be synced
	// from chain before it can balance the mint fee. This is the slow part on a
	// cold preprod sync (~1M dust events); progress (applyGap) is logged.
	console.log("[proof] syncing wallet to tip (need spendable dust to pay the mint fee)…");
	await syncWallet(logger, walletProvider.wallet);
	console.log("[proof] wallet sync gate passed");

	const providers = configureProviders(walletProvider, config);
	const token = await joinContract(providers, TOKEN_ADDRESS, config.zkConfigPath, logger);

	// Contract-address recipient: is_left:false selects the `right` (ContractAddress) arm.
	const recipient = {
		is_left: false,
		left: { bytes: new Uint8Array(32) },
		right: { bytes: hexToBytes(RECIPIENT_CONTRACT) },
	};

	console.log(`[proof] minting ${MINT_AMOUNT} of token ${TOKEN_ADDRESS} to CONTRACT recipient ${RECIPIENT_CONTRACT}`);
	try {
		const txData = await token.mint(recipient, MINT_AMOUNT);
		console.log(`PROOF_RESULT accepted txHash=${txData?.public?.txHash} block=${txData?.public?.blockHeight}`);
	} catch (e) {
		// dumpTransaction already logged RAW_TX_HEX + the output contractAddress
		// BEFORE submission, so the cleartext-recipient proof is captured even if
		// the node rejects the tx (e.g. a contract-owned output with no co-receive).
		console.log(`PROOF_RESULT rejected_at_submit: ${e instanceof Error ? e.message : String(e)}`);
		console.log("(raw tx + decoded output were dumped to the logDir above)");
	}
	try {
		await (walletProvider as { close?: () => Promise<void> }).close?.();
	} catch {}
}

main()
	.then(() => process.exit(0))
	.catch((e) => {
		console.error("[proof] FATAL:", e instanceof Error ? e.stack : JSON.stringify(e));
		process.exit(1);
	});
