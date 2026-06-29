import {
	type CoinPublicKey,
	DustSecretKey,
	type EncPublicKey,
	encodeCoinPublicKey,
	type FinalizedTransaction,
	LedgerParameters,
	ZswapSecretKeys,
} from "@midnight-ntwrk/ledger-v8";
import type {
	MidnightProvider,
	UnboundTransaction,
	WalletProvider,
} from "@midnight-ntwrk/midnight-js-types";
import { ttlOneHour } from "@midnight-ntwrk/midnight-js-utils";
import {
	type DustWalletOptions,
	type EnvironmentConfiguration,
	FluentWalletBuilder,
} from "@midnight-ntwrk/testkit-js";
import type { WalletFacade } from "@midnight-ntwrk/wallet-sdk";
import type { Logger } from "pino";

import { buildRestoredFacade } from "./wallet-restore.js";
import { getInitialShieldedState } from "./wallet-utils.js";

/**
 * Provider class that implements wallet functionality for the Midnight network.
 * Handles transaction balancing, submission, and wallet state management.
 */
export class MidnightWalletProvider
	implements MidnightProvider, WalletProvider
{
	logger: Logger;
	readonly env: EnvironmentConfiguration;
	readonly wallet: WalletFacade;
	readonly zswapSecretKeys: ZswapSecretKeys;
	readonly dustSecretKey: DustSecretKey;
	private txDumpCounter = 0;

	private constructor(
		logger: Logger,
		environmentConfiguration: EnvironmentConfiguration,
		wallet: WalletFacade,
		zswapSecretKeys: ZswapSecretKeys,
		dustSecretKey: DustSecretKey,
	) {
		this.logger = logger;
		this.env = environmentConfiguration;
		this.wallet = wallet;
		this.zswapSecretKeys = zswapSecretKeys;
		this.dustSecretKey = dustSecretKey;
	}

	getCoinPublicKey(): CoinPublicKey {
		return this.zswapSecretKeys.coinPublicKey;
	}

	getCoinPublicKeyBytes(): Uint8Array {
		return encodeCoinPublicKey(String(this.zswapSecretKeys.coinPublicKey));
	}

	getEncryptionPublicKey(): EncPublicKey {
		return this.zswapSecretKeys.encryptionPublicKey;
	}

	async balanceTx(
		tx: UnboundTransaction,
		ttl: Date = ttlOneHour(),
	): Promise<FinalizedTransaction> {
		const recipe = await this.wallet.balanceUnboundTransaction(
			tx,
			{
				shieldedSecretKeys: this.zswapSecretKeys,
				dustSecretKey: this.dustSecretKey,
			},
			{ ttl },
		);
		return await this.wallet.finalizeRecipe(recipe);
	}

	async submitTx(tx: FinalizedTransaction): Promise<string> {
		// Dump the exact on-chain content the node/indexer receives, so a shielded
		// mint can be decoded and inspected. Fully guarded: never blocks submission.
		this.dumpTransaction(tx);
		const txId = await this.wallet.submitTransaction(tx);
		this.logger.info(`Submitted tx, wallet returned id: ${txId}`);
		return txId;
	}

	/** Hex-encode bytes/branded ledger values for logging; never throws. */
	private static hx(v: unknown): string {
		try {
			if (v === null || v === undefined) return String(v);
			if (v instanceof Uint8Array) return Buffer.from(v).toString("hex");
			return String(v);
		} catch {
			return "<unprintable>";
		}
	}

	/**
	 * Logs the raw serialized transaction plus a decoded, indexer's-eye view:
	 * contract calls (address + entry point), and Zswap offer commitments
	 * (outputs) / nullifiers (inputs) — the public data an indexer can observe
	 * for an otherwise-shielded mint. Best-effort: all access is guarded.
	 */
	private dumpTransaction(tx: FinalizedTransaction): void {
		const n = ++this.txDumpCounter;
		const log = this.logger;
		const hx = MidnightWalletProvider.hx;
		try {
			const raw = tx.serialize();
			let txHash: string | undefined;
			let ids: string[] | undefined;
			try {
				txHash = hx(tx.transactionHash());
			} catch {}
			try {
				ids = tx.identifiers().map(hx);
			} catch {}

			log.info(
				{
					tx: {
						index: n,
						byteLength: raw.length,
						transactionHash: txHash,
						identifiers: ids,
					},
				},
				`=== SUBMIT TX #${n}: on-chain content the node/indexer receives ===`,
			);
			log.info(
				`RAW_TX_HEX[#${n}] (${raw.length} bytes): ${Buffer.from(raw).toString("hex")}`,
			);

			// Intents -> contract actions (calls / deploys) visible to the indexer.
			try {
				const intents = tx.intents;
				if (intents) {
					for (const [seg, intent] of intents) {
						const actions =
							(intent as { actions?: unknown[] }).actions ?? [];
						log.info(
							`TX[#${n}] intent segment=${seg}: ${actions.length} action(s)`,
						);
						actions.forEach((a, i) => {
							const action = a as {
								address?: unknown;
								entryPoint?: unknown;
							};
							const ep = action.entryPoint;
							const kind = ep !== undefined ? "ContractCall" : "ContractDeploy/Action";
							log.info(
								`TX[#${n}]   action[${i}] ${kind} address=${hx(action.address)}` +
									(ep !== undefined
										? ` entryPoint=${typeof ep === "string" ? ep : hx(ep)}`
										: ""),
							);
						});
					}
				}
			} catch (e) {
				log.warn({ err: String(e) }, `TX[#${n}] intent walk failed`);
			}

			// Zswap offers -> coin commitments (outputs) and nullifiers (inputs).
			const dumpOffer = (label: string, offer: unknown): void => {
				if (!offer) return;
				try {
					const o = offer as {
						deltas?: Map<unknown, bigint>;
						inputs?: Array<{ nullifier?: unknown; contractAddress?: unknown }>;
						outputs?: Array<{ commitment?: unknown; contractAddress?: unknown }>;
						transients?: unknown[];
					};
					const deltas = o.deltas
						? Array.from(o.deltas.entries()).map(([t, v]) => `${hx(t)}=${v}`)
						: [];
					log.info(
						`TX[#${n}] ${label} offer: inputs=${o.inputs?.length ?? 0} outputs=${o.outputs?.length ?? 0} transients=${o.transients?.length ?? 0} deltas=[${deltas.join(", ")}]`,
					);
					o.inputs?.forEach((inp, i) =>
						log.info(
							`TX[#${n}]   ${label} input[${i}] nullifier=${hx(inp.nullifier)} contract=${hx(inp.contractAddress)}`,
						),
					);
					o.outputs?.forEach((out, i) =>
						log.info(
							`TX[#${n}]   ${label} output[${i}] commitment=${hx(out.commitment)} contract=${hx(out.contractAddress)}`,
						),
					);
				} catch (e) {
					log.warn({ err: String(e) }, `TX[#${n}] ${label} offer dump failed`);
				}
			};
			try {
				dumpOffer("guaranteed", tx.guaranteedOffer);
			} catch {}
			try {
				const fo = tx.fallibleOffer;
				if (fo) for (const [seg, offer] of fo) dumpOffer(`fallible[seg=${seg}]`, offer);
			} catch {}

			// Full ledger decode (compact summary then full structure).
			try {
				log.info(`DECODED_TX[#${n}] (compact):\n${tx.toString(true)}`);
			} catch {}
			try {
				log.info(`DECODED_TX[#${n}] (full):\n${tx.toString(false)}`);
			} catch {}
		} catch (e) {
			log.warn(
				{ err: e instanceof Error ? e.message : String(e) },
				`Failed to dump tx #${n}`,
			);
		}
	}

	async start(): Promise<void> {
		this.logger.info("Starting wallet...");
		await this.wallet.start(this.zswapSecretKeys, this.dustSecretKey);
	}

	async stop(): Promise<void> {
		return this.wallet.stop();
	}

	static async build(
		logger: Logger,
		env: EnvironmentConfiguration,
		seed: string,
	): Promise<MidnightWalletProvider> {
		// When WALLET_STATES_DIR is set, restore the shielded + dust sub-wallets
		// from the compact-deployer's on-disk snapshot cache instead of doing a
		// fresh (~44 min) preprod dust resync. The CLI derives the same sub-wallet
		// seeds as the deployer, so the cache (keyed by sha256(seed)[:16]) applies.
		if (process.env.WALLET_STATES_DIR) {
			const r = await buildRestoredFacade(logger, env, seed);
			logger.info(
				`Wallet built from deployer cache: shielded=${r.restored.shielded} dust=${r.restored.dust} (no fresh resync)`,
			);
			const initialState = await getInitialShieldedState(logger, r.wallet.shielded);
			logger.info(
				`Wallet address: ${initialState.address.coinPublicKeyString()}`,
			);
			return new MidnightWalletProvider(
				logger,
				env,
				r.wallet,
				r.zswapSecretKeys,
				r.dustSecretKey,
			);
		}

		const DEFAULT_DUST_OPTIONS: DustWalletOptions = {
			ledgerParams: LedgerParameters.initialParameters(),
			additionalFeeOverhead: 1_000n,
			feeBlocksMargin: 5,
		};
		const dustOptions = {
			...DEFAULT_DUST_OPTIONS,
		};
		if (env.walletNetworkId === "undeployed") {
			dustOptions.additionalFeeOverhead = 500_000_000_000_000_000n;
		}
		const builder =
			FluentWalletBuilder.forEnvironment(env).withDustOptions(dustOptions);
		// midnight-wallet#425: the testkit FluentWalletBuilder does not surface the
		// wallet-sdk `batchUpdates` knob, so set it on the underlying configuration
		// directly (it is spread into the shielded + dust wallet sync streams via
		// `Stream.groupedWithin`). On preprod the dust event history is ~1M events;
		// the default batch size of 10 makes the WASM apply loop run out of memory
		// (the #425 crash) and, even when it survives, syncs at ~50 events/sec.
		// size: 5000 is the value the maintainer recommended and Ura labs validated
		// (~1000 events/sec, peak heap ~146 MB, no OOM); timeout/spacing keep the
		// stream responsive between batches.
		(
			builder as unknown as {
				config: {
					batchUpdates?: { size: number; timeout: number; spacing: number };
				};
			}
		).config.batchUpdates = { size: 5000, timeout: 1, spacing: 4 };
		const buildResult = await builder.withSeed(seed).buildWithoutStarting();
		const { wallet, seeds } = buildResult as unknown as {
			wallet: WalletFacade;
			seeds: { masterSeed: string; shielded: Uint8Array; dust: Uint8Array };
		};

		const initialState = await getInitialShieldedState(logger, wallet.shielded);
		logger.info(
			`Your wallet seed is: ${seeds.masterSeed} and your address is: ${initialState.address.coinPublicKeyString()}`,
		);

		return new MidnightWalletProvider(
			logger,
			env,
			wallet,
			ZswapSecretKeys.fromSeed(seeds.shielded),
			DustSecretKey.fromSeed(seeds.dust),
		);
	}
}
