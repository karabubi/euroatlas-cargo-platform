#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(
  cd "$(dirname "${BASH_SOURCE[0]}")/../.." &&
  pwd
)"

ENV_FILE="${ENV_FILE:-$ROOT_DIR/deploy/production.env}"
COMPOSE_FILE="$ROOT_DIR/docker-compose.production.yml"
BACKUP_DIR="${BACKUP_DIR:-$ROOT_DIR/backups/postgres}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: Environment file not found:"
  echo "$ENV_FILE"
  exit 1
fi

mkdir -p "$BACKUP_DIR"

set -a
source "$ENV_FILE"
set +a

TIMESTAMP="$(date '+%Y%m%d-%H%M%S')"

BACKUP_FILE="$BACKUP_DIR/euroatlas-${TIMESTAMP}.sql.gz"

echo "Creating PostgreSQL backup..."

docker compose \
  --env-file "$ENV_FILE" \
  -f "$COMPOSE_FILE" \
  exec -T db \
  pg_dump \
  -U "$POSTGRES_USER" \
  -d "$POSTGRES_DB" \
  --no-owner \
  --no-privileges \
  | gzip > "$BACKUP_FILE"

test -s "$BACKUP_FILE" || {
  echo "ERROR: Backup file is empty."
  exit 1
}

echo "✅ Backup created:"
echo "$BACKUP_FILE"
