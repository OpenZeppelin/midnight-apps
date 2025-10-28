#!/bin/bash
set -euo pipefail

echo "🚀 Starting build process..."

# 1) Setup Compact compiler
COMPACT_HOME="${COMPACT_HOME:-$PWD/packages/compact/compactc}"
mkdir -p "$COMPACT_HOME"
V=0.23.0
ZIP="compactc_v${V}_x86_64-unknown-linux-musl.zip"
URL="https://d3fazakqrumx6p.cloudfront.net/artifacts/compiler/compactc_${V}/${ZIP}"

if [ ! -f "$COMPACT_HOME/compactc" ]; then
  echo "⬇️ Downloading Compact compiler..."
  curl -Ls "$URL" -o "$COMPACT_HOME/compactc.zip"
  echo "📦 Extracting..."
  unzip -qo "$COMPACT_HOME/compactc.zip" -d "$COMPACT_HOME"
  chmod +x "$COMPACT_HOME"/{compactc,compactc.bin,zkir}
fi

export COMPACT_HOME
export PATH="$COMPACT_HOME:$PATH"
echo "✅ Verifying installation..."
"$COMPACT_HOME/compactc" --version

# 2) Build compact package
echo "🔨 Building compact package..."
cd packages/compact
pnpm install
pnpm run build
cd ../../

# 3) Validate build artifacts
echo "✅ Validating build artifacts..."
test -f packages/compact/dist/runCompiler.js || { echo "❌ runCompiler.js not found!"; exit 1; }
test -f packages/compact/dist/runBuilder.js || { echo "❌ runBuilder.js not found!"; exit 1; }

# 4) Install workspace dependencies
echo "📦 Installing workspace dependencies..."
pnpm install --frozen-lockfile --prefer-offline

# 5) Build everything
echo "🏗️ Building all packages..."
pnpm -w -r --workspace-concurrency=1 run build

echo "✨ Build complete!"
