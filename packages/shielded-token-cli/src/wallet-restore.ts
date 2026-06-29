// SPDX-License-Identifier: MIT
//
// Restore the wallet's shielded + dust sub-wallets from the on-disk snapshot
// cache that `@openzeppelin/compact-deployer` writes to `./.states/`, so the CLI
// reuses the deployer's already-synced state instead of re-streaming preprod's
// ~1M-event dust history (~44 min) on every run.
//
// This mirrors the deployer's `wallet/handler.js` (`WalletHandler.build`) exactly:
//   - shielded: `WalletFactory.restoreShieldedWallet(config, serialized)` or fresh
//   - unshielded: always built fresh (cheap, address-filtered sync)
//   - dust: `DustWallet(dustConfig).restore(serialized)` or fresh
// then combined with `WalletFactory.createWalletFacade(...)`.
//
// The cache filename is `${networkId}-${sha256(subWalletSeed)[:16]}-${kind}.gz`,
// identical to the deployer's `computeCacheFilePath`. Because the CLI derives the
// same sub-wallet seeds from the same mnemonic (verified: both produce the
// deployer's coinPublicKey 37b3b92a…), the hashes match and the cache applies.
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { DustSecretKey, ZswapSecretKeys } from "@midnight-ntwrk/ledger-v8";
import {
	DEFAULT_DUST_OPTIONS,
	type DustWalletOptions,
	type EnvironmentConfiguration,
	FluentWalletBuilder,
	WalletFactory,
	WalletSaveStateProvider,
	WalletSeeds,
} from "@midnight-ntwrk/testkit-js";
import type { WalletFacade } from "@midnight-ntwrk/wallet-sdk";
// testkit-js does not re-export these; the deployer imports them the same way.
import { DustWallet } from "@midnight-ntwrk/wallet-sdk-dust-wallet";
import { createKeystore } from "@midnight-ntwrk/wallet-sdk-unshielded-wallet";
import type { Logger } from "pino";

export interface RestoredWallet {
	wallet: WalletFacade;
	zswapSecretKeys: ZswapSecretKeys;
	dustSecretKey: DustSecretKey;
	/** Which sub-wallets were restored from cache (vs built fresh). */
	restored: { shielded: boolean; dust: boolean };
}

/** Default `.states` location: env override, else repo-root `.states`. */
export function defaultStatesDir(): string {
	if (process.env.WALLET_STATES_DIR) return resolve(process.env.WALLET_STATES_DIR);
	return resolve(process.cwd(), ".states");
}

function cacheFilePath(
	networkId: string,
	seed: Uint8Array,
	kind: "shielded" | "dust",
	statesDir: string,
): string {
	const seedHash = createHash("sha256").update(seed).digest("hex").slice(0, 16);
	return resolve(statesDir, `${networkId}-${seedHash}-${kind}.gz`);
}

function dirAndBase(p: string): { dir: string; base: string } {
	const i = p.lastIndexOf("/");
	return i === -1 ? { dir: ".", base: p } : { dir: p.slice(0, i), base: p.slice(i + 1) };
}

function buildDustConfig(config: unknown, dustOptions: DustWalletOptions): unknown {
	return {
		...(config as object),
		costParameters: {
			ledgerParams: dustOptions.ledgerParams,
			additionalFeeOverhead: dustOptions.additionalFeeOverhead,
			feeBlocksMargin: dustOptions.feeBlocksMargin,
		},
	};
}

/**
 * Build a `WalletFacade` restoring shielded + dust from `statesDir` when a
 * snapshot exists for this seed + network; otherwise build that sub-wallet
 * fresh. Never throws on a missing/corrupt cache — falls back to fresh sync.
 */
export async function buildRestoredFacade(
	logger: Logger,
	env: EnvironmentConfiguration,
	seedHex: string,
	statesDir: string = defaultStatesDir(),
): Promise<RestoredWallet> {
	const walletSeeds = WalletSeeds.fromMasterSeed(seedHex);
	const networkId = env.walletNetworkId;

	// Read testkit's per-environment config and inject the #425 batchUpdates knob
	// (size 10 OOMs the dust apply loop on preprod's ~1M events; 5000 is validated).
	const builderForConfig = FluentWalletBuilder.forEnvironment(env);
	const config = (builderForConfig as unknown as { config: Record<string, unknown> })
		.config;
	config.batchUpdates = { size: 5000, timeout: 1, spacing: 4 };

	const dustOptions: DustWalletOptions = {
		...DEFAULT_DUST_OPTIONS,
		// Match the CLI's prior working preprod value (ample given the wallet's dust).
		additionalFeeOverhead:
			networkId === "undeployed" ? 500_000_000_000_000_000n : 1_000n,
	};

	const shieldedPath = cacheFilePath(networkId, walletSeeds.shielded, "shielded", statesDir);
	const dustPath = cacheFilePath(networkId, walletSeeds.dust, "dust", statesDir);

	logger.info(`Wallet cache dir: ${statesDir}`);
	logger.info(`  shielded cache: ${shieldedPath} (exists=${existsSync(shieldedPath)})`);
	logger.info(`  dust cache:     ${dustPath} (exists=${existsSync(dustPath)})`);

	const restored = { shielded: false, dust: false };

	// --- shielded ---
	let shieldedWallet: ReturnType<typeof WalletFactory.createShieldedWallet>;
	if (existsSync(shieldedPath)) {
		try {
			const { dir, base } = dirAndBase(shieldedPath);
			const ser = await new WalletSaveStateProvider(logger, "", dir, base).load();
			shieldedWallet = (await WalletFactory.restoreShieldedWallet(
				config as never,
				ser,
			)) as never;
			restored.shielded = true;
			logger.info(`Restored SHIELDED sub-wallet from ${shieldedPath}`);
		} catch (e) {
			logger.warn(
				{ err: (e as Error).message },
				"Shielded cache restore failed; building fresh",
			);
			shieldedWallet = WalletFactory.createShieldedWallet(config as never, walletSeeds.shielded);
		}
	} else {
		shieldedWallet = WalletFactory.createShieldedWallet(config as never, walletSeeds.shielded);
	}

	// --- unshielded (always fresh; fast address-filtered sync) ---
	const keystore = createKeystore(walletSeeds.unshielded, networkId);
	const unshieldedWallet = WalletFactory.createUnshieldedWallet(config as never, keystore);

	// --- dust ---
	let dustWallet: ReturnType<typeof WalletFactory.createDustWallet>;
	if (existsSync(dustPath)) {
		try {
			const { dir, base } = dirAndBase(dustPath);
			const ser = await new WalletSaveStateProvider(logger, "", dir, base).load();
			const dustClass = DustWallet(buildDustConfig(config, dustOptions) as never);
			dustWallet = (dustClass as { restore: (s: string) => unknown }).restore(ser) as never;
			restored.dust = true;
			logger.info(`Restored DUST sub-wallet from ${dustPath}`);
		} catch (e) {
			logger.warn(
				{ err: (e as Error).message },
				"Dust cache restore failed; building fresh (slow preprod resync)",
			);
			dustWallet = WalletFactory.createDustWallet(config as never, walletSeeds.dust, dustOptions);
		}
	} else {
		dustWallet = WalletFactory.createDustWallet(config as never, walletSeeds.dust, dustOptions);
	}

	const wallet = await WalletFactory.createWalletFacade(
		config as never,
		shieldedWallet,
		unshieldedWallet,
		dustWallet,
	);

	return {
		wallet,
		zswapSecretKeys: ZswapSecretKeys.fromSeed(walletSeeds.shielded),
		dustSecretKey: DustSecretKey.fromSeed(walletSeeds.dust),
		restored,
	};
}
