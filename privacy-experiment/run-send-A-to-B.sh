#!/usr/bin/env bash
# user holds token A; calls contract A's send(to = contract B, coinA) — B is a
# DIFFERENT contract (not the one running send). Expected: node rejects (B never
# claims the output). Run it for real and capture the result.
set -uo pipefail
ROOT=/home/iskander-work/projects/midnight-ecosystem/midnight-apps
WORK="$ROOT/privacy-experiment/work"
mkdir -p "$WORK"; cd "$WORK" || exit 1

TS=$(date +%Y%m%dT%H%M%S)
LOGDIR="$ROOT/privacy-experiment/logs"
PRETTY="$LOGDIR/11-send-A-to-B-$TS.log"
ln -sf "$PRETTY" "$LOGDIR/_latest-send-A-to-B.log"

export TEST_RECOVERY_PHRASE="rib six position fit there position intact cinnamon average dwarf save link between pulp furnace cattle detail autumn mail junior maze cabin menu maze"
# Token A (mint from + run send on) and Token B (the OTHER contract = recipient).
export TOKEN_ADDRESS="8cad28d931ebaf50c735394ff4d1604b1472cf741febc09e58d3106c847c190d"
export RECIPIENT_CONTRACT="8ddc869eef82e7215722472e3494705030339df5cff1b875d3ec0bf74c086509"
export MINT_AMOUNT="1000"
export WALLET_STATES_DIR="$ROOT/.states"
export PROOF_SERVER_PORT="6300"
export WALLET_SYNC_TIMEOUT_MS="900000"
export EXP_OUT="$ROOT/privacy-experiment/out"
export EXP_LOG="$LOGDIR/11-send-A-to-B-$TS.ndjson"
export NODE_OPTIONS="--max-old-space-size=8192"
export TS_NODE_TRANSPILE_ONLY=1
export TS_NODE_PROJECT="$ROOT/packages/shielded-token-cli/tsconfig.json"

echo "[A->B] token A=$TOKEN_ADDRESS  -> recipient contract B=$RECIPIENT_CONTRACT" | tee "$PRETTY"
node --no-deprecation --experimental-specifier-resolution=node \
	--import "$ROOT/packages/shielded-token-cli/src/register-loader.mjs" \
	"$ROOT/packages/shielded-token-cli/src/scripts/run-send-to-contract.ts" 2>&1 | tee -a "$PRETTY"
echo "[A->B] exit=${PIPESTATUS[0]}" | tee -a "$PRETTY"
