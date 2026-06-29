#!/usr/bin/env bash
# Privacy experiment — completed Phase A: send to ANOTHER USER (with enc-key mapping).
set -uo pipefail
ROOT=/home/iskander-work/projects/midnight-ecosystem/midnight-apps
WORK="$ROOT/privacy-experiment/work"
mkdir -p "$WORK"; cd "$WORK" || exit 1

TS=$(date +%Y%m%dT%H%M%S)
LOGDIR="$ROOT/privacy-experiment/logs"
PRETTY="$LOGDIR/04-user-send-$TS.log"
ln -sf "$PRETTY" "$LOGDIR/_latest-user-send.log"

export TEST_RECOVERY_PHRASE="rib six position fit there position intact cinnamon average dwarf save link between pulp furnace cattle detail autumn mail junior maze cabin menu maze"
export TOKEN_ADDRESS="5c06114f3dda0c9ab2798c19e0514b0392ca72904acedbed5da2266974dc3ebd"
export MINT_AMOUNT="1000"
export WALLET_STATES_DIR="$ROOT/.states"
export PROOF_SERVER_PORT="6300"
export WALLET_SYNC_TIMEOUT_MS="900000"
export EXP_OUT="$ROOT/privacy-experiment/out"
export EXP_LOG="$LOGDIR/04-user-send-$TS.ndjson"
export NODE_OPTIONS="--max-old-space-size=8192"
export TS_NODE_TRANSPILE_ONLY=1
export TS_NODE_PROJECT="$ROOT/packages/shielded-token-cli/tsconfig.json"

echo "[user-send] token=$TOKEN_ADDRESS | log: $PRETTY" | tee "$PRETTY"
node --no-deprecation --experimental-specifier-resolution=node \
	--import "$ROOT/packages/shielded-token-cli/src/register-loader.mjs" \
	"$ROOT/packages/shielded-token-cli/src/scripts/run-user-send.ts" 2>&1 | tee -a "$PRETTY"
echo "[user-send] exit=${PIPESTATUS[0]}" | tee -a "$PRETTY"
