#!/usr/bin/env bash
# Valid "send to a contract": mint + deposit(coin) so the contract receives the
# shielded coin (receiveShielded) and the node accepts the tx.
set -uo pipefail
ROOT=/home/iskander-work/projects/midnight-ecosystem/midnight-apps
WORK="$ROOT/privacy-experiment/work"
mkdir -p "$WORK"; cd "$WORK" || exit 1

# Pull the freshly-deployed contract address (with the deposit circuit) from the record.
TOKEN=$(node -e "console.log(require('$ROOT/deployments/compact/preprod.json').ShieldedFungibleToken.address)")

TS=$(date +%Y%m%dT%H%M%S)
LOGDIR="$ROOT/privacy-experiment/logs"
PRETTY="$LOGDIR/06-deposit-$TS.log"
ln -sf "$PRETTY" "$LOGDIR/_latest-deposit.log"

export TEST_RECOVERY_PHRASE="rib six position fit there position intact cinnamon average dwarf save link between pulp furnace cattle detail autumn mail junior maze cabin menu maze"
export TOKEN_ADDRESS="$TOKEN"
export MINT_AMOUNT="1000"
export WALLET_STATES_DIR="$ROOT/.states"
export PROOF_SERVER_PORT="6300"
export WALLET_SYNC_TIMEOUT_MS="900000"
export EXP_OUT="$ROOT/privacy-experiment/out"
export EXP_LOG="$LOGDIR/06-deposit-$TS.ndjson"
export NODE_OPTIONS="--max-old-space-size=8192"
export TS_NODE_TRANSPILE_ONLY=1
export TS_NODE_PROJECT="$ROOT/packages/shielded-token-cli/tsconfig.json"

echo "[deposit] token(with deposit)=$TOKEN_ADDRESS | log: $PRETTY" | tee "$PRETTY"
node --no-deprecation --experimental-specifier-resolution=node \
	--import "$ROOT/packages/shielded-token-cli/src/register-loader.mjs" \
	"$ROOT/packages/shielded-token-cli/src/scripts/run-deposit.ts" 2>&1 | tee -a "$PRETTY"
echo "[deposit] exit=${PIPESTATUS[0]}" | tee -a "$PRETTY"
