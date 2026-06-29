import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { DustSecretKey, ZswapSecretKeys } from '@midnight-ntwrk/ledger-v8';
import { DEFAULT_DUST_OPTIONS, DEFAULT_WALLET_STATE_DIRECTORY, FluentWalletBuilder, MidnightWalletProvider, WalletFactory, WalletSaveStateProvider, WalletSeeds, } from '@midnight-ntwrk/testkit-js';
import { DustWallet, } from '@midnight-ntwrk/wallet-sdk-dust-wallet';
import { createKeystore, } from '@midnight-ntwrk/wallet-sdk-unshielded-wallet';
/**
 * Owned deployer wallet handle: a built `MidnightWalletProvider` paired
 * with the lifecycle needed to release it and the metadata needed to
 * snapshot it to disk on success.
 *
 * Always acquired via {@link WalletHandler.build} and handed to
 * `AsyncDisposableStack.use()` (or `await using`) — the dispose hook
 * stops the wallet and warn-logs any error so a failed teardown doesn't
 * mask the deploy's primary failure.
 *
 * The handler also owns the wallet's on-disk state cache. {@link saveCache}
 * is called by the deployer after a successful sync to persist the
 * shielded sub-wallet so the next run resumes from the checkpoint instead
 * of re-syncing the chain from genesis. The cache only stores the
 * shielded sub-wallet because that's the only slow one on real
 * networks; unshielded + dust are fast enough to rebuild fresh every
 * run.
 *
 * Mirrors the {@link ProofServer} pattern in `providers/proof-server.ts`.
 * The underlying testkit provider is exposed via {@link provider}; pass
 * that to anything that wants a plain `MidnightWalletProvider`.
 */
export class WalletHandler {
    /** The underlying testkit-js wallet provider. */
    provider;
    /** The unshielded keystore the wallet was built with. */
    unshieldedKeystore;
    #logger;
    #shieldedCacheFilePath;
    #dustCacheFilePath;
    constructor(provider, keystore, logger, shieldedCacheFilePath, dustCacheFilePath) {
        this.provider = provider;
        this.unshieldedKeystore = keystore;
        this.#logger = logger;
        this.#shieldedCacheFilePath = shieldedCacheFilePath;
        this.#dustCacheFilePath = dustCacheFilePath;
    }
    /**
     * Build a `MidnightWalletProvider` with dust options tuned for the
     * target network, wrapped in a `WalletHandler` for safe teardown.
     *
     * Bypasses testkit-js's `FluentWalletBuilder.buildWithoutStarting()`
     * so we can branch the shielded sub-wallet between a fresh
     * `WalletFactory.createShieldedWallet(config, seed)` build and a
     * `WalletFactory.restoreShieldedWallet(config, serializedState)`
     * restore when an on-disk snapshot exists for this seed + network.
     * Unshielded + dust sub-wallets are always built fresh (cheap to
     * re-sync). The three are then combined via
     * `WalletFactory.createWalletFacade(...)` and wrapped in
     * `MidnightWalletProvider.withWallet(...)`, matching what
     * `FluentWalletBuilder` does internally.
     *
     * Three things this fixes vs. the bare `MidnightWalletProvider.build`:
     *
     *  1. **Dust overhead.** testkit-js' default `additionalFeeOverhead`
     *     is `1_000n`, which is too low for the dev-preset `undeployed`
     *     node — every deploy then fails with a generic
     *     `SubmissionError`. CMA's harness bumps to `5e17` for
     *     undeployed; we mirror that.
     *
     *  2. **Mnemonic-vs-hex routing.** `WalletSeeds.fromMnemonic(...)`
     *     and `WalletSeeds.fromMasterSeed(...)` derive *different* wallets
     *     from the same input — the mnemonic path runs BIP39 → seed →
     *     wallet derivation expected by the genesis-funded test mnemonic
     *     (`TEST_MNEMONIC`), while the master-seed path interprets the
     *     hex as already-derived entropy. Keeping the seed's `kind`
     *     explicit lets us pick the right one.
     *
     *  3. **Shielded-state cache.** testkit-js's `FluentWalletBuilder`
     *     has no restore method, so a fresh wallet on a real network
     *     re-syncs the shielded chain history every CLI invocation
     *     (30 – 60 min on preprod). We persist the shielded sub-wallet
     *     to `./.states/<network>-<seed-hash>.gz` after each successful
     *     sync and restore from it here when present.
     *
     * Caller still drives `provider.start(waitForFunds)` (and any faucet
     * hit); teardown is automatic via `await using` or
     * `stack.use(wallet)`. Call {@link saveCache} after sync completes
     * to persist the new checkpoint.
     */
    static async build(logger, env, seed, opts = {}) {
        const dustOptions = {
            ...DEFAULT_DUST_OPTIONS,
            // testkit-js's DEFAULT_DUST_OPTIONS.additionalFeeOverhead is
            // 5e20 — a fee-balance safety margin sized for production
            // wallets with very large dust reserves. Faucet-funded test
            // wallets on preview/preprod only have ~3e15 dust, so the
            // default makes every deploy fail with
            // "Insufficient Funds: could not balance dust" even when the
            // computed fee is microscopic. We override to 5e14 (~17% of a
            // typical faucet wallet's dust) for all non-mainnet networks —
            // plenty of safety margin without exceeding the balance.
            additionalFeeOverhead: env.walletNetworkId === 'mainnet'
                ? DEFAULT_DUST_OPTIONS.additionalFeeOverhead
                : 500000000000000n,
        };
        const walletSeeds = seed.kind === 'mnemonic'
            ? WalletSeeds.fromMnemonic(seed.value)
            : WalletSeeds.fromMasterSeed(seed.value);
        // testkit-js doesn't export `mapEnvironmentToConfiguration`, so we
        // build a throwaway `FluentWalletBuilder` and read its `config`
        // field. The field is declared at index.mjs:1534 as a public class
        // field but isn't on the .d.ts, so we cast through unknown.
        const builderForConfig = FluentWalletBuilder.forEnvironment(env);
        const config = builderForConfig
            .config;
        // LOCAL PATCH (midnight-wallet#425): testkit doesn't surface the
        // `batchUpdates` knob, so inject it on the shared config here. This is the
        // config used for BOTH the cache-restore path (buildDustConfig spreads it
        // into DustWallet(...).restore()) and fresh creation, for shielded + dust.
        // Default size 10 OOMs the 4.0.0 dust wallet on preprod's ~1M-event dust
        // history; 5000 is the maintainer/Ura-labs-validated value. Reverted by
        // any `pnpm install`.
        config.batchUpdates = { size: 5000, timeout: 1, spacing: 4 };
        const unshieldedKeystore = createKeystore(walletSeeds.unshielded, env.walletNetworkId);
        const shieldedCacheFilePath = computeCacheFilePath(env, walletSeeds.shielded, 'shielded');
        const dustCacheFilePath = computeCacheFilePath(env, walletSeeds.dust, 'dust');
        const shieldedWallet = await loadOrCreateShieldedWallet({
            logger,
            config,
            seed: walletSeeds.shielded,
            cacheFilePath: shieldedCacheFilePath,
            skipCache: opts.skipWalletCache === true,
        });
        const unshieldedWallet = WalletFactory.createUnshieldedWallet(config, unshieldedKeystore);
        const dustWallet = await loadOrCreateDustWallet({
            logger,
            config,
            seed: walletSeeds.dust,
            dustOptions,
            cacheFilePath: dustCacheFilePath,
            skipCache: opts.skipWalletCache === true,
        });
        const walletFacade = await WalletFactory.createWalletFacade(config, shieldedWallet, unshieldedWallet, dustWallet);
        const provider = await MidnightWalletProvider.withWallet(logger, env, walletFacade, ZswapSecretKeys.fromSeed(walletSeeds.shielded), DustSecretKey.fromSeed(walletSeeds.dust), unshieldedKeystore);
        return new WalletHandler(provider, unshieldedKeystore, logger, shieldedCacheFilePath, dustCacheFilePath);
    }
    /**
     * Snapshot both the shielded and dust sub-wallets to their respective
     * cache files on disk.
     *
     * Called by the deployer after sync completes (and periodically during
     * sync — see deployer.ts) so the next run can resume from a recent
     * checkpoint instead of re-streaming the entire chain.
     *
     * Best-effort: each sub-wallet's persist is independently try/catch'd
     * — a dust-save failure does not skip the shielded save, and neither
     * blocks the deploy.
     *
     * Why both: on real networks both sub-wallets are slow on first sync.
     * Shielded is slow because every shielded note has to be trial-decrypted
     * with the wallet's viewing key. Dust is even worse because
     * `dustLedgerEvents(id: 0)` is an unfiltered global stream — every
     * client walks the whole chain's dust history, not just its own
     * UTXOs. Caching both makes subsequent runs near-instant.
     */
    async saveCache() {
        await Promise.allSettled([
            this.#saveSubWalletCache(this.#shieldedCacheFilePath, this.provider.wallet.shielded, 'shielded'),
            this.#saveSubWalletCache(this.#dustCacheFilePath, this.provider.wallet.dust, 'dust'),
        ]);
    }
    async #saveSubWalletCache(filePath, subWallet, label) {
        try {
            const dir = pathDir(filePath);
            const filename = pathBase(filePath);
            // `WalletSaveStateProvider`'s `seed` param is only used as the
            // default-filename source; passing an explicit filename makes it
            // unused, so the empty string is fine here.
            const saver = new WalletSaveStateProvider(this.#logger, '', dir, filename);
            await saver.save(subWallet);
        }
        catch (e) {
            this.#logger.warn({ err: e.message, label, filePath }, 'Wallet sub-wallet cache save failed; continuing');
        }
    }
    /**
     * Stop the underlying wallet. Swallows the error with a `warn` log so
     * a failed dispose doesn't mask the deploy's real error.
     */
    async [Symbol.asyncDispose]() {
        try {
            await this.provider.stop();
        }
        catch (e) {
            this.#logger.warn({ err: e.message }, 'Wallet stop failed');
        }
    }
}
/**
 * Build a cache filename from the network ID + a short SHA-256 of the
 * sub-wallet seed bytes + the sub-wallet kind label.
 *
 * Per-kind suffix prevents the shielded + dust caches from colliding
 * (they keep separate state schemas; loading one as the other would
 * blow up on deserialise). We deliberately don't reuse testkit-js's
 * `getWalletStateFilename` because it (a) embeds the seed verbatim in
 * the filename and (b) gates the network name on the `MN_TEST_ENVIRONMENT`
 * env var instead of the runtime network ID.
 */
function computeCacheFilePath(env, seed, kind) {
    const seedHash = createHash('sha256')
        .update(seed)
        .digest('hex')
        .slice(0, 16);
    const filename = `${env.walletNetworkId}-${seedHash}-${kind}.gz`;
    return resolve(process.cwd(), DEFAULT_WALLET_STATE_DIRECTORY, filename);
}
/**
 * Restore the dust sub-wallet from a cached serialized state when one
 * exists, or build a fresh one. Mirrors {@link loadOrCreateShieldedWallet}
 * but routes through `DustWallet(config).restore(serialized)` because
 * testkit-js doesn't expose a `WalletFactory.restoreDustWallet` static.
 *
 * Dust state caching is what makes preprod usable on second runs. First
 * run still pays the full `dustLedgerEvents(id: 0)` walk (1 h+ on
 * preprod). Once that completes and we `saveCache`, every subsequent
 * boot starts from the persisted `appliedIndex` and reaches chain tip
 * in seconds.
 */
async function loadOrCreateDustWallet(args) {
    const { logger, config, seed, dustOptions, cacheFilePath, skipCache } = args;
    if (!skipCache && existsSync(cacheFilePath)) {
        try {
            const dir = pathDir(cacheFilePath);
            const filename = pathBase(cacheFilePath);
            const loader = new WalletSaveStateProvider(logger, '', dir, filename);
            const serializedState = await loader.load();
            // `DustWallet(config)` is the V1 builder; calling `.restore(state)`
            // returns a sync-ready DustWallet seeded at the cached cursor.
            // `costParameters` is RUNTIME state on the builder, not baked
            // into the snapshot — pass `dustOptions` through here so the
            // restored wallet honours our `additionalFeeOverhead` override
            // (testkit's 5e20 default is way above a faucet wallet's
            // balance and breaks fee balance).
            const dustConfig = buildDustConfig(config, dustOptions);
            const dustClass = DustWallet(dustConfig);
            const restored = dustClass.restore(serializedState);
            logger.info(`Restored dust wallet state from ${cacheFilePath}`);
            return restored;
        }
        catch (e) {
            logger.warn({ err: e.message, cacheFilePath }, 'Dust wallet cache restore failed; falling back to fresh sync');
        }
    }
    else if (skipCache) {
        logger.info('Dust wallet cache disabled (--no-cache); doing fresh sync');
    }
    return WalletFactory.createDustWallet(config, seed, dustOptions);
}
async function loadOrCreateShieldedWallet(args) {
    const { logger, config, seed, cacheFilePath, skipCache } = args;
    if (!skipCache && existsSync(cacheFilePath)) {
        try {
            const dir = pathDir(cacheFilePath);
            const filename = pathBase(cacheFilePath);
            const loader = new WalletSaveStateProvider(logger, '', dir, filename);
            const serializedState = await loader.load();
            const restored = await WalletFactory.restoreShieldedWallet(config, serializedState);
            logger.info(`Restored wallet state from ${cacheFilePath}`);
            return restored;
        }
        catch (e) {
            logger.warn({ err: e.message, cacheFilePath }, 'Wallet cache restore failed; falling back to fresh sync');
        }
    }
    else if (skipCache) {
        logger.info('Wallet cache disabled (--no-cache); doing fresh sync');
    }
    return WalletFactory.createShieldedWallet(config, seed);
}
/**
 * Layer `costParameters` (derived from {@link DustWalletOptions}) onto
 * the base environment config so a `DustWallet(...)` builder picks up
 * our `additionalFeeOverhead` override. Mirrors what
 * `WalletFactory.createDustWallet` does internally — exposed here so
 * the cache-restore and skip-ahead paths can apply the same options
 * (otherwise the restored wallet uses testkit's 5e20 default and
 * every fee balance fails on a faucet-funded wallet).
 */
function buildDustConfig(config, dustOptions) {
    return {
        ...config,
        costParameters: {
            ledgerParams: dustOptions.ledgerParams,
            additionalFeeOverhead: dustOptions.additionalFeeOverhead,
            feeBlocksMargin: dustOptions.feeBlocksMargin,
        },
    };
}
function pathDir(p) {
    const i = p.lastIndexOf('/');
    return i === -1 ? '.' : p.slice(0, i);
}
function pathBase(p) {
    const i = p.lastIndexOf('/');
    return i === -1 ? p : p.slice(i + 1);
}
//# sourceMappingURL=handler.js.map