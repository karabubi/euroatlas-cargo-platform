#!/usr/bin/env bash

set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage:"
  echo "  $0 <backup.sql.gz>"
  exit 1
fi

BACKUP_FILE="$1"

if [[ ! -f "$BACKUP_FILE" ]]; then
  echo "ERROR: Backup file not found:"
  echo "$BACKUP_FILE"
  exit 1
fi

ROOT_DIR="$(
  cd "$(dirname "${BASH_SOURCE[0]}")/../.." &&
  pwd
)"

ENV_FILE="${ENV_FILE:-$ROOT_DIR/deploy/production.env}"
COMPOSE_FILE="$ROOT_DIR/docker-compose.production.yml"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: Environment file not found:"
  echo "$ENV_FILE"
  exit 1
fi

set -a
source "$ENV_FILE"
set +a

echo "WARNING:"
echo "This restores data into:"
echo "  database: $POSTGRES_DB"
echo
echo "Press Ctrl+C now if this is not intended."
sleep 5

gzip -dc "$BACKUP_FILE" \
  | docker compose \
      --env-file "$ENV_FILE" \
      -f "$COMPOSE_FILE" \
      exec -T db \
      psql \
      -v ON_ERROR_STOP=1 \
      -U "$POSTGRES_USER" \
      -d "$POSTGRES_DB"

echo "✅ Database restore completed."
