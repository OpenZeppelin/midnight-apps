#!/usr/bin/env bash
# Run a command with consistent, followable logging.
#
#   scripts/logged.sh <step-name> <command...>
#
# Writes logs/<YYYY-MM-DD_HH-MM-SS>_<step>.log and (re)points a stable
# logs/<step>_latest.log symlink at it, so you can always follow the
# current run with:  tail -f logs/<step>_latest.log
#
# Uses `set -o pipefail` so a failure in <command> is never masked by tee.
set -euo pipefail

step="${1:?usage: logged.sh <step-name> <command...>}"; shift

root="$(git rev-parse --show-toplevel)"
dir="$root/logs"
mkdir -p "$dir"

ts="$(date +%Y-%m-%d_%H-%M-%S)"
log="$dir/${ts}_${step}.log"
ln -sfn "${ts}_${step}.log" "$dir/${step}_latest.log"

echo "▶ ${step}  started $(date '+%Y-%m-%d %H:%M:%S')"
echo "  log:    logs/${ts}_${step}.log"
echo "  follow: tail -f logs/${step}_latest.log"
echo

set -o pipefail
"$@" 2>&1 | tee "$log"
