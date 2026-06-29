#!/usr/bin/env bash
# Privacy experiment — Phase 1: deploy the recompiled ShieldedFungibleToken
# (now with the `send` circuit) on preprod via compact-deployer.
#
# Runs from the repo root so the deployer restores the wallet from repo-root
# ./.states/*.gz (the cached, already-synced dust state) instead of a full
# ~44-min resync. Streams to a dated live log + _latest symlink.
set -uo pipefail

ROOT=/home/iskander-work/projects/midnight-ecosystem/midnight-apps
cd "$ROOT" || exit 1

TS=$(date +%Y%m%dT%H%M%S)
LOGDIR="$ROOT/privacy-experiment/logs"
LOG="$LOGDIR/02-deploy-$TS.log"
ln -sf "$LOG" "$LOGDIR/_latest-deploy.log"

export NODE_OPTIONS="--max-old-space-size=8192"

echo "[deploy] cwd=$(pwd)" | tee "$LOG"
echo "[deploy] .states present:" | tee -a "$LOG"
ls -la "$ROOT/.states" | tee -a "$LOG"
echo "[deploy] starting compact-deploy ShieldedFungibleToken @ preprod (log: $LOG)" | tee -a "$LOG"

"$ROOT/node_modules/.bin/compact-deploy" ShieldedFungibleToken \
	--network preprod \
	--config "$ROOT/compact.toml" \
	--seed-file "$ROOT/deploy/preprod.seed" \
	--proof-server http://127.0.0.1:6300 \
	--sync-timeout 5400 \
	--verbose 2>&1 | tee -a "$LOG"

rc=${PIPESTATUS[0]}
echo "[deploy] compact-deploy exit=$rc" | tee -a "$LOG"
exit "$rc"
