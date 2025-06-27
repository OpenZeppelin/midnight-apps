#!/bin/bash
rm -rf dist
tsc --project tsconfig.build.json
mkdir -p ./dist/artifacts
cp -Rf ./src/artifacts/* ./dist/artifacts/ 2>/dev/null || true
rm -rf ./dist/artifacts/Mock* 2>/dev/null || true
cp ./src/*.compact ./dist/ 2>/dev/null || true
rm ./dist/Mock*.compact 2>/dev/null || true
