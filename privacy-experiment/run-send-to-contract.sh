#!/usr/bin/env bash
# send(to: ContractAddress) via the send circuit -> try to land on preprod.
set -uo pipefail
ROOT=/home/iskander-work/projects/midnight-ecosystem/midnight-apps
WORK="$ROOT/privacy-experiment/work"
mkdir -p "$WORK"; cd "$WORK" || exit 1

TOKEN=$(node -e "console.log(require('$ROOT/deployments/compact/preprod.json').ShieldedFungibleToken.address)")

TS=$(date +%Y%m%dT%H%M%S)
LOGDIR="$ROOT/privacy-experiment/logs"
PRETTY="$LOGDIR/07-send2c-$TS.log"
ln -sf "$PRETTY" "$LOGDIR/_latest-send2c.log"

export TEST_RECOVERY_PHRASE="rib six position fit there position intact cinnamon average dwarf save link between pulp furnace cattle detail autumn mail junior maze cabin menu maze"
export TOKEN_ADDRESS="$TOKEN"
export RECIPIENT_CONTRACT="${RECIPIENT_CONTRACT:-$TOKEN}"   # default: the token's own address (claimable)
export MINT_AMOUNT="1000"
export WALLET_STATES_DIR="$ROOT/.states"
export PROOF_SERVER_PORT="6300"
export WALLET_SYNC_TIMEOUT_MS="900000"
export EXP_OUT="$ROOT/privacy-experiment/out"
export EXP_LOG="$LOGDIR/07-send2c-$TS.ndjson"
export NODE_OPTIONS="--max-old-space-size=8192"
export TS_NODE_TRANSPILE_ONLY=1
export TS_NODE_PROJECT="$ROOT/packages/shielded-token-cli/tsconfig.json"

echo "[send2c] token=$TOKEN_ADDRESS recipientContract=$RECIPIENT_CONTRACT | log: $PRETTY" | tee "$PRETTY"
node --no-deprecation --experimental-specifier-resolution=node \
	--import "$ROOT/packages/shielded-token-cli/src/register-loader.mjs" \
	"$ROOT/packages/shielded-token-cli/src/scripts/run-send-to-contract.ts" 2>&1 | tee -a "$PRETTY"
echo "[send2c] exit=${PIPESTATUS[0]}" | tee -a "$PRETTY"
