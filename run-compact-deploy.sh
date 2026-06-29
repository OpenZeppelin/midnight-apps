#!/usr/bin/env bash
# Deploy ShieldedFungibleToken on preprod via the generic compact-deploy CLI.
# Non-interactive: contract + args come from compact.toml, seed from --seed-file.
# Requires a proof server on :6300 and the funded preprod seed (deploy/preprod.seed).
set -uo pipefail

ROOT=/home/iskander-work/projects/midnight-ecosystem/midnight-apps
TS=$(date +%Y%m%dT%H%M%S)
LOG="$ROOT/packages/shielded-token-cli/logs/preprod-remote/compact-deploy-$TS.out"
ln -sf "$LOG" "$ROOT/packages/shielded-token-cli/logs/preprod-remote/_latest-compact.out"

# Headroom over V8's default ~2GB old-space cap (machine has ~14GB free). With
# batchUpdates=5000 the dust apply loop stays small, but the restored dust tree +
# shielded trial-decryption can spike; 8GB is ample insurance against a heap OOM.
export NODE_OPTIONS="--max-old-space-size=8192"

echo "[launcher] log: $LOG (NODE_OPTIONS=$NODE_OPTIONS)"
"$ROOT/node_modules/.bin/compact-deploy" ShieldedFungibleToken \
	--network preprod \
	--config "$ROOT/compact.toml" \
	--seed-file "$ROOT/deploy/preprod.seed" \
	--proof-server http://127.0.0.1:6300 \
	--sync-timeout 5400 \
	--verbose 2>&1 | tee "$LOG"
