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

TEST_DB="euroatlas_restore_test_$(date '+%Y%m%d_%H%M%S')"

if [[ ! "$TEST_DB" =~ ^[a-zA-Z0-9_]+$ ]]; then
  echo "ERROR: Unsafe temporary database name."
  exit 1
fi

cleanup() {
  echo
  echo "Cleaning disposable restore database..."

  docker compose \
    --env-file "$ENV_FILE" \
    -f "$COMPOSE_FILE" \
    exec -T db \
    psql \
    -U "$POSTGRES_USER" \
    -d postgres \
    -v ON_ERROR_STOP=1 \
    -c "
      SELECT pg_terminate_backend(pid)
      FROM pg_stat_activity
      WHERE datname = '$TEST_DB'
        AND pid <> pg_backend_pid();
    " \
    >/dev/null 2>&1 || true

  docker compose \
    --env-file "$ENV_FILE" \
    -f "$COMPOSE_FILE" \
    exec -T db \
    psql \
    -U "$POSTGRES_USER" \
    -d postgres \
    -v ON_ERROR_STOP=1 \
    -c "DROP DATABASE IF EXISTS \"$TEST_DB\";" \
    >/dev/null 2>&1 || true
}

trap cleanup EXIT

echo "===== CREATE DISPOSABLE DATABASE ====="
echo "$TEST_DB"

docker compose \
  --env-file "$ENV_FILE" \
  -f "$COMPOSE_FILE" \
  exec -T db \
  psql \
  -U "$POSTGRES_USER" \
  -d postgres \
  -v ON_ERROR_STOP=1 \
  -c "CREATE DATABASE \"$TEST_DB\";"

echo
echo "===== RESTORE BACKUP ====="

gzip -dc "$BACKUP_FILE" \
  | docker compose \
      --env-file "$ENV_FILE" \
      -f "$COMPOSE_FILE" \
      exec -T db \
      psql \
      -U "$POSTGRES_USER" \
      -d "$TEST_DB" \
      -v ON_ERROR_STOP=1

echo
echo "===== VERIFY RESTORED DATABASE ====="

docker compose \
  --env-file "$ENV_FILE" \
  -f "$COMPOSE_FILE" \
  exec -T db \
  psql \
  -U "$POSTGRES_USER" \
  -d "$TEST_DB" \
  -v ON_ERROR_STOP=1 \
  -c '
    SELECT COUNT(*) AS migrations
    FROM "_prisma_migrations";
  '

docker compose \
  --env-file "$ENV_FILE" \
  -f "$COMPOSE_FILE" \
  exec -T db \
  psql \
  -U "$POSTGRES_USER" \
  -d "$TEST_DB" \
  -v ON_ERROR_STOP=1 \
  -c "
    SELECT COUNT(*) AS application_tables
    FROM information_schema.tables
    WHERE table_schema = 'public';
  "

echo
echo "✅ Backup restored successfully into disposable database."
