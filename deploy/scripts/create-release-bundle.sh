#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(
  cd "$(dirname "${BASH_SOURCE[0]}")/../.." &&
  pwd
)"

cd "$ROOT_DIR"

VERSION="$(
  node -p \
    "require('./package.json').version"
)"

SHORT_SHA="$(
  git rev-parse --short=12 HEAD
)"

OUTPUT_DIR="$ROOT_DIR/artifacts/release"

BUNDLE_NAME="euroatlas-cargo-${VERSION}-${SHORT_SHA}"
BUNDLE_DIR="$OUTPUT_DIR/$BUNDLE_NAME"
ARCHIVE="$OUTPUT_DIR/${BUNDLE_NAME}.tar.gz"
CHECKSUM="${ARCHIVE}.sha256"

if [[ -n "$(git status --porcelain)" ]]; then
  echo "❌ Working tree must be clean."
  git status --short
  exit 1
fi

rm -rf "$BUNDLE_DIR"

mkdir -p \
  "$BUNDLE_DIR"

echo "======================================"
echo " EuroAtlas Release Bundle "
echo "======================================"

echo
echo "===== RELEASE CHECK ====="

pnpm release:check

echo
echo "===== MANIFEST ====="

pnpm release:manifest

cp \
  artifacts/release/release-manifest.json \
  "$BUNDLE_DIR/"

cp \
  deploy/production.env.example \
  "$BUNDLE_DIR/production.env.example"

cp \
  docker-compose.production.yml \
  "$BUNDLE_DIR/"

cp \
  deploy/docker-compose.proxy.yml \
  "$BUNDLE_DIR/"

cp \
  deploy/Caddyfile \
  "$BUNDLE_DIR/"

cp \
  deploy/docs/deployment-runbook.md \
  "$BUNDLE_DIR/"

cp \
  deploy/docs/production-checklist.md \
  "$BUNDLE_DIR/"

echo
echo "===== ARCHIVE ====="

tar \
  -czf "$ARCHIVE" \
  -C "$OUTPUT_DIR" \
  "$BUNDLE_NAME"

shasum -a 256 \
  "$ARCHIVE" \
  > "$CHECKSUM"

echo
echo "✅ Release bundle created:"
echo "$ARCHIVE"

echo
echo "✅ SHA-256:"
cat "$CHECKSUM"
