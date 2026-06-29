#!/usr/bin/env bash
# Privacy experiment — Phase 2: mint + send (to a user and to a contract) via the
# shielded-token CLI, reusing the deployer's synced wallet cache (WALLET_STATES_DIR
# -> no fresh resync). Captures each tx's raw bytes + decode for the report.
set -uo pipefail

ROOT=/home/iskander-work/projects/midnight-ecosystem/midnight-apps
# Run from a fresh, isolated working dir so the level private-state store
# (created at <cwd>/midnight-level-db) starts EMPTY. The repo-root
# midnight-level-db holds stale entries from prior deployer/CLI runs encrypted
# with a different password, which makes findDeployedContract fail with an AES
# OperationError. The token's private state is just {}, so a fresh DB is fine.
WORK="$ROOT/privacy-experiment/work"
mkdir -p "$WORK"
cd "$WORK" || exit 1

TS=$(date +%Y%m%dT%H%M%S)
LOGDIR="$ROOT/privacy-experiment/logs"
PRETTY="$LOGDIR/03-experiment-$TS.log"
ln -sf "$PRETTY" "$LOGDIR/_latest-experiment.log"

export TEST_RECOVERY_PHRASE="rib six position fit there position intact cinnamon average dwarf save link between pulp furnace cattle detail autumn mail junior maze cabin menu maze"
export TOKEN_ADDRESS="5c06114f3dda0c9ab2798c19e0514b0392ca72904acedbed5da2266974dc3ebd"
# Recipient contract for the contract-send: the deployed Lunarswap contract.
export RECIPIENT_CONTRACT="4049e0df7ad3446fdd6f34e60e3ffbe900b90d7e04143dac29f8901d67472358"
export MINT_AMOUNT="1000"
export WALLET_STATES_DIR="$ROOT/.states"
export PROOF_SERVER_PORT="6300"
export WALLET_SYNC_TIMEOUT_MS="900000"   # 15 min ceiling for the (fast) tail sync
export EXP_OUT="$ROOT/privacy-experiment/out"
export EXP_LOG="$LOGDIR/03-experiment-$TS.ndjson"
export NODE_OPTIONS="--max-old-space-size=8192"

echo "[exp] token=$TOKEN_ADDRESS recipientContract=$RECIPIENT_CONTRACT" | tee "$PRETTY"
echo "[exp] WALLET_STATES_DIR=$WALLET_STATES_DIR (restore, no resync)" | tee -a "$PRETTY"
echo "[exp] pretty log: $PRETTY | ndjson: $EXP_LOG | artifacts: $EXP_OUT" | tee -a "$PRETTY"

# Run via the CLI's loader (resolves the @src/* alias used inside contracts/dist
# and transpiles TS); tsx can't resolve @src. Transpile-only skips type-checking.
export TS_NODE_TRANSPILE_ONLY=1
export TS_NODE_PROJECT="$ROOT/packages/shielded-token-cli/tsconfig.json"
node --no-deprecation --experimental-specifier-resolution=node \
	--import "$ROOT/packages/shielded-token-cli/src/register-loader.mjs" \
	"$ROOT/packages/shielded-token-cli/src/scripts/run-privacy-experiment.ts" 2>&1 | tee -a "$PRETTY"
rc=${PIPESTATUS[0]}
echo "[exp] run-privacy-experiment exit=$rc" | tee -a "$PRETTY"
exit "$rc"
