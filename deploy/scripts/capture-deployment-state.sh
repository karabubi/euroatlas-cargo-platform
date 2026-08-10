#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(
  cd "$(dirname "${BASH_SOURCE[0]}")/../.." &&
  pwd
)"

cd "$ROOT_DIR"

STATE_DIR="${STATE_DIR:-deploy/state}"

mkdir -p "$STATE_DIR"

TIMESTAMP="$(
  date -u '+%Y%m%dT%H%M%SZ'
)"

STATE_FILE="$STATE_DIR/deployment-${TIMESTAMP}.txt"

{
  echo "timestamp=$TIMESTAMP"
  echo "commit=$(git rev-parse HEAD)"
  echo "tag=$(git describe --tags --exact-match 2>/dev/null || true)"
  echo
  echo "containers:"
  docker ps \
    --format '{{.Names}}|{{.Image}}|{{.Status}}'
} > "$STATE_FILE"

echo "✅ Deployment state captured:"
echo "$STATE_FILE"
