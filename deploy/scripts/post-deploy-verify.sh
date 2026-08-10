#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(
  cd "$(dirname "${BASH_SOURCE[0]}")/../.." &&
  pwd
)"

cd "$ROOT_DIR"

ENV_FILE="${ENV_FILE:-deploy/production.env.local}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/euroatlas-cargo}"

echo "======================================"
echo " EuroAtlas Post-Deployment Verification"
echo "======================================"

echo
echo "===== SMOKE TEST ====="

ENV_FILE="$ENV_FILE" \
deploy/scripts/production-smoke-test.sh

echo
echo "===== SECURITY CHECK ====="

ENV_FILE="$ENV_FILE" \
deploy/scripts/security-check.sh

echo
echo "===== BACKUP TEST ====="

mkdir -p "$BACKUP_DIR"

ENV_FILE="$ENV_FILE" \
BACKUP_DIR="$BACKUP_DIR" \
deploy/scripts/backup-postgres.sh

LATEST_BACKUP="$(
  find "$BACKUP_DIR" \
    -maxdepth 1 \
    -type f \
    -name '*.sql.gz' \
    -print \
    | sort \
    | tail -1
)"

if [[ -z "$LATEST_BACKUP" ]]; then
  echo "❌ No post-deployment backup created"
  exit 1
fi

gzip -t "$LATEST_BACKUP"

echo "✅ Backup integrity valid:"
echo "$LATEST_BACKUP"

echo
echo "===== DEPLOYMENT STATE ====="

deploy/scripts/capture-deployment-state.sh

echo
echo "======================================"
echo " POST-DEPLOYMENT VERIFICATION SUCCESS"
echo "======================================"
