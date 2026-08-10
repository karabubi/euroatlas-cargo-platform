#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(
  cd "$(dirname "${BASH_SOURCE[0]}")/../.." &&
  pwd
)"

cd "$ROOT_DIR"

BACKUP_FILE="${1:-}"
ENV_FILE="${ENV_FILE:-deploy/production.env.local}"

if [[ -z "$BACKUP_FILE" ]]; then
  echo "Usage:"
  echo "  $0 /path/to/backup.sql.gz"
  exit 1
fi

if [[ ! -f "$BACKUP_FILE" ]]; then
  echo "❌ Backup file does not exist:"
  echo "$BACKUP_FILE"
  exit 1
fi

gzip -t "$BACKUP_FILE"

deploy/scripts/validate-production-env.sh \
  "$ENV_FILE"

echo
echo "======================================"
echo " DESTRUCTIVE DATABASE RESTORE"
echo "======================================"

echo
echo "Backup:"
echo "$BACKUP_FILE"

echo
echo "This can overwrite current production data."
echo
printf 'Type RESTORE to continue: '

read -r CONFIRMATION

if [[ "$CONFIRMATION" != "RESTORE" ]]; then
  echo "❌ Restore cancelled."
  exit 1
fi

ENV_FILE="$ENV_FILE" \
deploy/scripts/restore-postgres.sh \
  "$BACKUP_FILE"

echo
echo "✅ Production database restore completed."
