#!/usr/bin/env bash
# Cross-token, send-only: deploy A + B, then A.send(to=A, coinB) and B.send(to=B, coinA).
set -uo pipefail
ROOT=/home/iskander-work/projects/midnight-ecosystem/midnight-apps
WORK="$ROOT/privacy-experiment/work"
mkdir -p "$WORK"; cd "$WORK" || exit 1

TS=$(date +%Y%m%dT%H%M%S)
LOGDIR="$ROOT/privacy-experiment/logs"
PRETTY="$LOGDIR/10-cross-send-$TS.log"
ln -sf "$PRETTY" "$LOGDIR/_latest-cross-send.log"

export TEST_RECOVERY_PHRASE="rib six position fit there position intact cinnamon average dwarf save link between pulp furnace cattle detail autumn mail junior maze cabin menu maze"
export MINT_AMOUNT="1000"
export WALLET_STATES_DIR="$ROOT/.states"
export PROOF_SERVER_PORT="6300"
export WALLET_SYNC_TIMEOUT_MS="900000"
export EXP_OUT="$ROOT/privacy-experiment/out"
export EXP_LOG="$LOGDIR/10-cross-send-$TS.ndjson"
export NODE_OPTIONS="--max-old-space-size=8192"
export TS_NODE_TRANSPILE_ONLY=1
export TS_NODE_PROJECT="$ROOT/packages/shielded-token-cli/tsconfig.json"

echo "[cross] send-only A/B cross-token | log: $PRETTY" | tee "$PRETTY"
node --no-deprecation --experimental-specifier-resolution=node \
	--import "$ROOT/packages/shielded-token-cli/src/register-loader.mjs" \
	"$ROOT/packages/shielded-token-cli/src/scripts/run-cross-send.ts" 2>&1 | tee -a "$PRETTY"
echo "[cross] exit=${PIPESTATUS[0]}" | tee -a "$PRETTY"
