var __addDisposableResource = (this && this.__addDisposableResource) || function (env, value, async) {
    if (value !== null && value !== void 0) {
        if (typeof value !== "object" && typeof value !== "function") throw new TypeError("Object expected.");
        var dispose, inner;
        if (async) {
            if (!Symbol.asyncDispose) throw new TypeError("Symbol.asyncDispose is not defined.");
            dispose = value[Symbol.asyncDispose];
        }
        if (dispose === void 0) {
            if (!Symbol.dispose) throw new TypeError("Symbol.dispose is not defined.");
            dispose = value[Symbol.dispose];
            if (async) inner = dispose;
        }
        if (typeof dispose !== "function") throw new TypeError("Object not disposable.");
        if (inner) dispose = function() { try { inner.call(this); } catch (e) { return Promise.reject(e); } };
        env.stack.push({ value: value, dispose: dispose, async: async });
    }
    else if (async) {
        env.stack.push({ async: true });
    }
    return value;
};
var __disposeResources = (this && this.__disposeResources) || (function (SuppressedError) {
    return function (env) {
        function fail(e) {
            env.error = env.hasError ? new SuppressedError(e, env.error, "An error was suppressed during disposal.") : e;
            env.hasError = true;
        }
        var r, s = 0;
        function next() {
            while (r = env.stack.pop()) {
                try {
                    if (!r.async && s === 1) return s = 0, env.stack.push(r), Promise.resolve().then(next);
                    if (r.dispose) {
                        var result = r.dispose.call(r.value);
                        if (r.async) return s |= 2, Promise.resolve(result).then(next, function(e) { fail(e); return next(); });
                    }
                    else s |= 1;
                }
                catch (e) {
                    fail(e);
                }
            }
            if (s === 1) return env.hasError ? Promise.reject(env.error) : Promise.resolve();
            if (env.hasError) throw env.error;
        }
        return next();
    };
})(typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
});
import { shieldedToken, unshieldedToken, } from '@midnight-ntwrk/ledger-v8';
import { deployContract } from '@midnight-ntwrk/midnight-js-contracts';
import { getNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import {} from '@midnight-ntwrk/testkit-js';
import { DustAddress, ShieldedAddress, UnshieldedAddress, } from '@midnight-ntwrk/wallet-sdk-address-format';
import * as Rx from 'rxjs';
import { CompactConfig } from "./config/compact-config.js";
import { Deployments } from "./deployments.js";
import { ConfigError, DeployTxFailedError, UnfundedWalletError, } from "./errors.js";
/**
 * Upper bound on the wallet's sync wait when the deployer owns the wallet.
 *
 * testkit-js's `wallet.start(true)` chains through `waitForFunds → syncWallet`
 * with a **hardcoded 90 s** timeout. That's fine for local-stack deploys
 * (chain is empty, sync finishes in seconds) but blows up on real networks
 * where catching up to chain tip can take minutes for a fresh wallet.
 *
 * 10 minutes is a deliberate over-allocation: local completes long before
 * it, and real-network sync (preprod, testnet) finishes well within it as
 * long as memory holds. Override with {@link DeployerOptions.syncTimeoutMs}
 * when you have a faster ceiling in mind.
 */
const DEFAULT_SYNC_TIMEOUT_MS = 10 * 60 * 1000;
import { ConstructorArgs } from "./loaders/args.js";
import { Artifact } from "./loaders/artifact.js";
import { InitialPrivateState } from "./loaders/init-state.js";
import { SigningKey } from "./loaders/signing-key.js";
import { buildProviders } from "./providers/build.js";
import { applyNetwork } from "./providers/network.js";
import { ProofServer } from "./providers/proof-server.js";
import { WalletHandler } from "./wallet/handler.js";
import { resolveSeed } from "./wallet/seeds.js";
/**
 * Stateful handle for a single contract's deploy lifecycle.
 *
 * `Deployer.prepare(opts)` loads config + artifact + signing key,
 * starts the proof server, builds or adopts a wallet (started, optional
 * faucet), and returns an instance ready to {@link deploy} or
 * {@link dryRun}.
 *
 * Always acquired with `await using` — `[Symbol.asyncDispose]` stops
 * the wallet (only if built here) and the proof-server container
 * (only if `"auto"`).
 *
 * Resource handling: {@link prepare} accumulates owned resources into
 * a local {@link AsyncDisposableStack}. On failure mid-prepare,
 * `await using` disposes everything it acquired so far; on success,
 * ownership transfers to the returned instance via `stack.move()` and
 * `[Symbol.asyncDispose]` disposes it later.
 */
export class Deployer {
    /** Contract name as specified in opts. */
    contractName;
    /** Resolved network name (`opts.network` or `[profile].default_network`). */
    networkName;
    /** Hex of the deployer's coin public key. */
    deployer;
    /** Loaded artifact: zk config path + compiled-contract handle. */
    artifact;
    /** Per-contract signing key loaded from disk. */
    signingKey;
    #state;
    constructor(state) {
        this.#state = state;
        this.contractName = state.opts.contract;
        this.networkName = state.networkName;
        this.deployer = state.deployer;
        this.artifact = state.artifact;
        this.signingKey = state.signingKey;
    }
    /**
     * Load + validate everything needed to deploy, in order:
     *
     *  1. Parse `compact.toml`, pick network + contract.
     *  2. Load signing key from `contract.signing_key_file`.
     *  3. Resolve seed (unless `opts.walletProvider` was injected).
     *  4. Start the proof server (CLI > TOML URL > `"auto"` > env > default).
     *  5. Load the artifact (compiled contract, zk config).
     *  6. Build the wallet (or adopt the injected one), faucet + start
     *     when owned.
     *  7. Load constructor args and initial private state.
     *
     * Throws typed errors ({@link ConfigError}, {@link WalletError}, etc.)
     * that map to the CLI's exit codes via `DeployError.exitCode`.
     */
    static async prepare(opts) {
        const env_1 = { stack: [], error: void 0, hasError: false };
        try {
            const { logger } = opts;
            const config = await CompactConfig.load(opts.configPath);
            const { rootDir } = config;
            const { networkName, network, contract } = resolveTargets(opts, config);
            const signingKey = await SigningKey.load(rootDir, contract.signing_key_file);
            const seedResolution = opts.walletProvider
                ? undefined
                : await resolveSeed({
                    config,
                    networkName,
                    network,
                    seedFile: opts.seedFile,
                    promptPassphrase: opts.promptPassphrase,
                });
            if (seedResolution) {
                logger.debug(`Resolved deployer seed from: ${seedResolution.origin}`);
            }
            // Stack owns every resource acquired below. On any throw before
            // the final `stack.move()`, `await using` disposes them in reverse
            // order; on success, ownership transfers to the returned Deployer
            // and the local `await using` becomes a no-op.
            const stack = __addDisposableResource(env_1, new AsyncDisposableStack(), true);
            const proofServer = await ProofServer.start({
                cliOverride: opts.proofServer,
                network,
                logger,
            });
            stack.use(proofServer);
            const { env } = applyNetwork(network, proofServer.url);
            logger.debug(`Network ID: ${env.networkId}; proof server: ${env.proofServer}`);
            const artifact = await Artifact.load({
                rootDir,
                artifactsDir: config.artifactsDir,
                artifact: contract.artifact,
                contractName: opts.contract,
                witnesses: contract.witnesses,
            });
            logger.debug(`Artifact: ${artifact.artifactPath} (${artifact.circuitNames.length} circuits)`);
            let wallet;
            if (opts.walletProvider) {
                wallet = opts.walletProvider;
            }
            else {
                if (!seedResolution) {
                    throw new Error('internal: seedResolution missing for owned wallet');
                }
                const owned = await WalletHandler.build(logger, env, seedResolution.seed, {
                    skipWalletCache: opts.skipWalletCache,
                });
                stack.use(owned);
                wallet = owned.provider;
                // Kick off the wallet's internal indexer subscription without
                // blocking on testkit-js's 90 s `waitForFunds` gate (which is too
                // short for real networks). Then drive sync ourselves with a
                // configurable ceiling and surface a clear `UnfundedWalletError`
                // if we reach chain tip and still have no shielded balance.
                await wallet.start(false);
                // Surface the wallet's derived bech32m addresses right away so
                // the user can sanity-check they match the seed they intended
                // *before* settling in for a long shielded sync.
                await logWalletAddresses(wallet, logger);
                await syncAndVerifyFunds({
                    wallet,
                    timeoutMs: opts.syncTimeoutMs ?? DEFAULT_SYNC_TIMEOUT_MS,
                    logger,
                    // Periodic checkpoint: every 5 min during sync, snapshot both
                    // sub-wallet caches. If the user interrupts a long first-run,
                    // the next attempt resumes from the most recent checkpoint.
                    onCheckpoint: () => owned.saveCache(),
                });
                // Snapshot the shielded + dust sub-wallets now that sync is
                // complete. Best-effort: failures are warn-logged in
                // `saveCache`'s caller; never block the deploy on a cache write.
                try {
                    await owned.saveCache();
                }
                catch (e) {
                    logger.warn({ err: e.message }, 'Wallet cache save failed; next run will re-sync');
                }
            }
            const args = await ConstructorArgs.load(contract, rootDir, opts.argsOverride);
            const initialPrivateState = await InitialPrivateState.load(contract.init_private_state, rootDir);
            const deployer = wallet.getCoinPublicKey();
            return new Deployer({
                opts,
                logger,
                config,
                networkName,
                network,
                contract,
                signingKey,
                artifact,
                args,
                initialPrivateState,
                wallet,
                deployer,
                env,
                resources: stack.move(),
            });
        }
        catch (e_1) {
            env_1.error = e_1;
            env_1.hasError = true;
        }
        finally {
            const result_1 = __disposeResources(env_1);
            if (result_1)
                await result_1;
        }
    }
    /**
     * Submit the deploy transaction, persist the deployment record under
     * `deployments/<network>.json` (rotating any prior head into history),
     * and return the success result.
     */
    async deploy() {
        const s = this.#state;
        const providers = buildProviders({
            env: s.env,
            wallet: s.wallet,
            contractName: s.opts.contract,
            contract: s.contract,
            zkConfigPath: s.artifact.zkConfigPath,
            privateStateProvider: s.opts.privateStateProvider,
        });
        const txResult = await executeDeploy({
            providers,
            contractName: s.opts.contract,
            contract: s.contract,
            artifact: s.artifact,
            signingKey: s.signingKey.hex,
            args: s.args.values,
            initialPrivateState: s.initialPrivateState?.value,
        });
        const record = toDeploymentRecord({
            deployTxData: txResult.deployTxData,
            signingKey: s.signingKey.hex,
            deployer: s.deployer,
            artifact: s.contract.artifact,
        });
        const deployments = new Deployments({
            rootDir: s.config.rootDir,
            deploymentsDir: s.config.deploymentsDir,
            network: s.networkName,
        });
        const persisted = await deployments.record(s.opts.contract, record);
        return {
            contractName: s.opts.contract,
            network: s.networkName,
            address: record.address,
            txHash: record.txHash,
            txId: record.txId,
            blockHeight: record.blockHeight,
            signingKey: record.signingKey,
            deployer: record.deployer,
            artifact: record.artifact,
            deploymentsFile: persisted.head,
            dryRun: false,
            explorerUrl: buildExplorerUrl(s.network.explorer, record.address),
        };
    }
    /**
     * Log a structured "would deploy" event and return a synthetic
     * result. No transaction is submitted and no file is written.
     */
    async dryRun() {
        const s = this.#state;
        s.logger.info({
            contract: s.opts.contract,
            network: s.networkName,
            artifact: s.artifact.artifactPath,
            argCount: s.args.length,
            hasPrivateState: s.initialPrivateState !== undefined,
            deployer: s.deployer,
        }, 'dry-run: would deploy');
        return {
            contractName: s.opts.contract,
            network: s.networkName,
            address: '',
            txHash: '',
            txId: '',
            blockHeight: 0,
            signingKey: s.signingKey.hex,
            deployer: s.deployer,
            artifact: s.contract.artifact,
            deploymentsFile: '',
            dryRun: true,
            explorerUrl: '',
        };
    }
    /**
     * Release every resource `prepare` acquired: proof-server container
     * (if `"auto"`) and the wallet (if built here, not injected).
     */
    async [Symbol.asyncDispose]() {
        await this.#state.resources.disposeAsync();
    }
}
/**
 * Pick the network and contract from `compact.toml`, defaulting the
 * network to `[profile].default_network` when `opts.network` isn't
 * passed. Throws {@link ConfigError} with the available set on each
 * invalid lookup.
 */
function resolveTargets(opts, config) {
    const networkName = opts.network ?? config.defaultNetwork;
    if (!networkName) {
        throw new ConfigError('No network selected. Pass --network <name> or set [profile].default_network.');
    }
    return {
        networkName,
        network: config.network(networkName),
        contract: config.contract(opts.contract),
    };
}
/**
 * Log the wallet's three bech32m-encoded addresses (shielded /
 * unshielded / dust) so the user can verify the deployer derived the
 * wallet they intended *before* committing to a long sync.
 *
 * Addresses come from the wallet's secret keys, not chain state, so
 * we can read them off the wallet's initial state stream the instant
 * `wallet.start(false)` returns — no need to wait for sync.
 *
 * Best-effort: a missing-codec or unexpected state shape is
 * warn-logged and swallowed; we never block a deploy on the display.
 */
async function logWalletAddresses(wallet, logger) {
    try {
        const networkId = getNetworkId();
        const [shieldedState, unshieldedState, dustState] = await Promise.all([
            Rx.firstValueFrom(wallet.wallet.shielded.state),
            Rx.firstValueFrom(wallet.wallet.unshielded.state),
            Rx.firstValueFrom(wallet.wallet.dust.state),
        ]);
        const shielded = ShieldedAddress.codec
            .encode(networkId, shieldedState.address)
            .toString();
        const unshielded = UnshieldedAddress.codec
            .encode(networkId, unshieldedState.address)
            .toString();
        const dust = DustAddress.codec
            .encode(networkId, dustState.address)
            .toString();
        logger.info(`Wallet addresses (verify these match your seed):`);
        logger.info(`  shielded:   ${shielded}`);
        logger.info(`  unshielded: ${unshielded}`);
        logger.info(`  dust:       ${dust}`);
    }
    catch (e) {
        logger.warn({ err: e.message }, 'Could not derive wallet addresses for display; continuing');
    }
}
/**
 * Render a sub-wallet's sync progress as a compact human-readable
 * string for the throttled "Still syncing" log.
 *
 * The shielded + dust sub-wallets expose `appliedIndex` / `highestIndex`
 * (from `@midnight-ntwrk/wallet-sdk-abstractions`); the unshielded
 * sub-wallet uses `appliedId` / `highestTransactionId`. We accept
 * either shape and pull the numbers via property probing so the
 * helper stays one definition.
 *
 * Surfaces "applied/highest (pct%)" so the user can eyeball how close
 * sync is to chain tip. Falls back to a `complete=true|false` flag
 * if `highest` is 0 (wallet hasn't received any indexer events yet).
 */
function describeProgress(p) {
    const complete = p.isStrictlyComplete();
    const fields = p;
    const applied = fields.appliedIndex ?? fields.appliedId ?? 0n;
    const highest = fields.highestIndex ?? fields.highestTransactionId ?? 0n;
    const connected = fields.isConnected ?? false;
    // Once the indexer has told the wallet its max event id, we can
    // render a real progress percentage. Until then surface "applied,
    // highest unknown" and the subscription's connection state so the
    // user can tell "still connecting" from "connected but no events yet"
    // from "events flowing".
    if (highest === 0n) {
        return `applied=${applied} highest=? connected=${connected} complete=${complete}`;
    }
    const pct = Number((applied * 100n) / highest);
    return `${applied}/${highest} (${pct}%) connected=${connected} complete=${complete}`;
}
/**
 * Drive the deployer-owned wallet to chain tip with a configurable
 * timeout, then assert it holds spendable funds.
 *
 * Default gate is `state.isSynced` from the WalletFacade — equivalent to
 * `shielded.state.progress.isStrictlyComplete() && dust.state.progress.isStrictlyComplete() && unshielded.progress.isStrictlyComplete()`
 * (see `node_modules/@midnight-ntwrk/wallet-sdk-facade/dist/index.js:60`).
 * A previous attempt to use a lighter gate by default ("shielded balance
 * > 0 AND dust balance > 0") regressed on local: shielded balance shows
 * in the first state emission for a prefunded local seed and
 * `dust.balance(time)` is a projection that doesn't track the
 * materialised dust UTXO, so deploy tx submission failed with
 * `Invalid Transaction (custom error 170)`. Strict-complete is the only
 * reliable signal for the general case.
 *
 * Replaces testkit-js's exported `syncWallet` because that helper
 * (a) has a hardcoded 90 s ceiling reached via `wallet.start(true)`'s
 * implicit `waitForFunds` chain, and (b) logs every state emission —
 * thousands of lines on a real-network sync, which makes the run feel
 * hung. Our pipeline pulls the timeout from
 * {@link DeployerOptions.syncTimeoutMs} and throttles the "still
 * syncing" log to once per 30 s so the user sees forward progress
 * without the noise.
 *
 * Surfaces {@link UnfundedWalletError} (exit code 3) when sync
 * completes against an empty wallet.
 */
async function syncAndVerifyFunds(args) {
    const { wallet, timeoutMs, logger, onCheckpoint } = args;
    logger.info(`Syncing wallet to chain tip (timeout ${Math.round(timeoutMs / 1000)}s)…`);
    const start = Date.now();
    // Two subscriptions to the same observable: one logs throttled
    // progress lines for UX, the other waits for completion. The progress
    // tap deliberately runs through `Rx.throttleTime(30_000)` so the
    // shielded-sync flood doesn't drown the terminal; the completion gate
    // doesn't throttle, so the deploy proceeds the instant sync flips.
    const state$ = wallet.wallet.state();
    const progressSub = state$
        .pipe(Rx.throttleTime(30_000, undefined, { leading: false, trailing: true }))
        .subscribe((s) => {
        const elapsedSec = Math.round((Date.now() - start) / 1000);
        const elapsedHms = elapsedSec < 60
            ? `${elapsedSec}s`
            : `${Math.floor(elapsedSec / 60)}m ${elapsedSec % 60}s`;
        // Pull running balance projections each tick so the user can
        // see funds materialise mid-sync (NIGHT becomes visible the
        // moment unshielded completes; dust accumulates as the wallet
        // processes events even before its sync is strictly complete).
        const shieldedBal = s.shielded.balances[shieldedToken().raw] ?? 0n;
        const unshieldedBal = s.unshielded.balances[unshieldedToken().raw] ?? 0n;
        const dustBal = s.dust.balance(new Date());
        logger.info(`Still syncing — ${elapsedHms} elapsed; ` +
            `shielded ${describeProgress(s.shielded.state.progress)} balance=${shieldedBal}; ` +
            `unshielded ${describeProgress(s.unshielded.progress)} balance=${unshieldedBal}; ` +
            `dust ${describeProgress(s.dust.state.progress)} balance=${dustBal}`);
    });
    // Periodic checkpoint: snapshot the wallet caches every 5 min so a
    // user who Ctrl+C's a long preprod first-run can resume from the
    // latest snapshot instead of starting at id=0 again. Best-effort —
    // a failed save logs a warning and the sync keeps going. Skipped
    // when `onCheckpoint` is not provided (i.e. injected-wallet callers
    // where the deployer doesn't own persistence).
    let checkpointInFlight = false;
    const checkpointSub = onCheckpoint
        ? state$
            .pipe(Rx.throttleTime(5 * 60 * 1000, undefined, {
            leading: false,
            trailing: true,
        }))
            .subscribe(() => {
            if (checkpointInFlight)
                return;
            checkpointInFlight = true;
            onCheckpoint().finally(() => {
                checkpointInFlight = false;
            });
        })
        : undefined;
    // Per-sub-wallet edge-trigger: the first time each sub-wallet flips
    // to `complete=true`, log its current balance immediately. This lets
    // a user with NIGHT+dust (the typical preprod-faucet wallet shape)
    // see their unshielded balance after ~30 s instead of waiting for
    // the full shielded sync (30 – 60 min) to surface anything.
    const seenComplete = { shielded: false, unshielded: false, dust: false };
    const balanceSub = state$.subscribe((s) => {
        if (!seenComplete.unshielded && s.unshielded.progress.isStrictlyComplete()) {
            seenComplete.unshielded = true;
            const bal = s.unshielded.balances[unshieldedToken().raw] ?? 0n;
            logger.info(`Unshielded sync complete — NIGHT balance: ${bal}`);
        }
        if (!seenComplete.dust && s.dust.state.progress.isStrictlyComplete()) {
            seenComplete.dust = true;
            const bal = s.dust.balance(new Date());
            logger.info(`Dust sync complete — dust balance: ${bal}`);
        }
        if (!seenComplete.shielded && s.shielded.state.progress.isStrictlyComplete()) {
            seenComplete.shielded = true;
            const bal = s.shielded.balances[shieldedToken().raw] ?? 0n;
            logger.info(`Shielded sync complete — shielded balance: ${bal}`);
        }
    });
    let synced;
    try {
        synced = await Rx.firstValueFrom(state$.pipe(Rx.filter((s) => s.shielded.state.progress.isCompleteWithin(50n) && s.dust.state.progress.isCompleteWithin(50n) && s.unshielded.progress.isCompleteWithin(50n)), Rx.timeout({
            each: timeoutMs,
            with: () => Rx.throwError(() => new Error(`Wallet sync timeout after ${timeoutMs}ms`)),
        })));
    }
    finally {
        progressSub.unsubscribe();
        balanceSub.unsubscribe();
        checkpointSub?.unsubscribe();
    }
    const totalSec = Math.round((Date.now() - start) / 1000);
    const totalHms = totalSec < 60
        ? `${totalSec}s`
        : `${Math.floor(totalSec / 60)}m ${totalSec % 60}s`;
    logger.info(`Sync complete after ${totalHms}`);
    // Accept funds in either shielded or unshielded — preprod faucets
    // hand out unshielded NIGHT, while a freshly bridged wallet may sit
    // entirely in the shielded layer. Both are deployable: dust for
    // fees auto-generates from either NIGHT or shielded holdings.
    // Mirrors midnight-apps's `waitForUnshieldedFunds` semantics.
    const shieldedBal = synced.shielded.balances[shieldedToken().raw];
    const unshieldedBal = synced.unshielded.balances[unshieldedToken().raw];
    const hasShielded = shieldedBal !== undefined && shieldedBal > 0n;
    const hasUnshielded = unshieldedBal !== undefined && unshieldedBal > 0n;
    if (!hasShielded && !hasUnshielded) {
        throw new UnfundedWalletError(wallet.getCoinPublicKey());
    }
    logger.info(`Wallet balance: shielded=${shieldedBal ?? 0n}, unshielded=${unshieldedBal ?? 0n}`);
}
/**
 * Assemble the `deployContract` options (conditionally including the
 * private-state pair) and submit. Wraps any failure in
 * {@link DeployTxFailedError} so callers can branch on its `exitCode`
 * without parsing midnight-js error shapes.
 */
async function executeDeploy({ providers, contractName, contract, artifact, signingKey, args, initialPrivateState, }) {
    const compiled = artifact.compiledContract;
    const base = {
        compiledContract: compiled,
        signingKey,
        args,
    };
    const deployOptions = contract.private_state_id !== undefined
        ? {
            ...base,
            privateStateId: contract.private_state_id,
            initialPrivateState,
        }
        : base;
    try {
        return await deployContract(providers, deployOptions);
    }
    catch (e) {
        throw new DeployTxFailedError(`Deploy of "${contractName}" failed: ${e.message}`, { cause: e });
    }
}
/** Map the midnight-js deploy-tx result into the persisted record shape. */
/**
 * Build a `<explorer-base>/contracts/0x<address>` URL for the deployed
 * contract. Strips a trailing slash from the configured base so we
 * don't emit `//contracts/...`. Returns the empty string when no
 * explorer is configured for this network — the CLI suppresses the
 * line in that case rather than printing an empty URL.
 */
function buildExplorerUrl(base, address) {
    if (!base || !address)
        return '';
    const trimmed = base.endsWith('/') ? base.slice(0, -1) : base;
    const hex = address.startsWith('0x') ? address : `0x${address}`;
    return `${trimmed}/contracts/${hex}`;
}
function toDeploymentRecord({ deployTxData, signingKey, deployer, artifact, }) {
    return {
        address: deployTxData.public.contractAddress,
        txHash: deployTxData.public.txHash,
        txId: deployTxData.public.txId,
        blockHeight: deployTxData.public.blockHeight,
        signingKey,
        deployer,
        artifact,
        timestamp: new Date().toISOString(),
    };
}
//# sourceMappingURL=deployer.js.map