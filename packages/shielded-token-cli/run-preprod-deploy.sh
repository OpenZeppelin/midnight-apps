#!/usr/bin/env bash
# Drive the interactive shielded-token-cli preprod launcher non-interactively.
# Inputs are fed through a FIFO (kept open by a holder process so the reader
# never hits EOF between feeds). Output is teed to a dated log + _latest symlink.
set -uo pipefail

ROOT=/home/iskander-work/projects/midnight-ecosystem/midnight-apps
CLI="$ROOT/packages/shielded-token-cli"
FIFO=/tmp/pp_stdin
TS=$(date +%Y%m%dT%H%M%S)
LOG="$CLI/logs/preprod-remote/run-$TS.out"
ln -sf "$LOG" "$CLI/logs/preprod-remote/_latest.out"

rm -f "$FIFO"
mkfifo "$FIFO"
# Hold the FIFO open for writing so the CLI's stdin never closes between feeds.
sleep 100000 > "$FIFO" &
HOLDER=$!
trap 'kill "$HOLDER" 2>/dev/null' EXIT

# Funded preprod seed + expected addresses live in the repo-root .envrc (gitignored).
set -a
# shellcheck disable=SC1091
source "$ROOT/.envrc"
set +a
export PROOF_SERVER_PORT=6300
# Dust sync replays ~1M preprod events and only reaches the "within maxGap of
# tip" gate near the end of the replay (~44 min on this box at ~400 events/sec).
# The sync gate (Rx.filter before Rx.timeout) emits nothing until ready, so this
# acts as a total budget — give generous margin over the observed ~44 min.
export WALLET_SYNC_TIMEOUT_MS=5400000

echo "[launcher] log: $LOG"
echo "[launcher] proof server: localhost:$PROOF_SERVER_PORT"
pnpm --dir "$CLI" preprod < "$FIFO" 2>&1 | tee "$LOG"
