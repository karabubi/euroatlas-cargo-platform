#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(
  cd "$(dirname "${BASH_SOURCE[0]}")/../.." &&
  pwd
)"

cd "$ROOT_DIR"

TARGET_TAG="${1:-}"
ENV_FILE="${ENV_FILE:-deploy/production.env.local}"
STATE_DIR="${STATE_DIR:-deploy/state}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/euroatlas-cargo}"

if [[ -z "$TARGET_TAG" ]]; then
  echo "Usage:"
  echo "  $0 v<major>.<minor>.<patch>"
  exit 1
fi

echo "======================================"
echo " EuroAtlas Cargo Release Upgrade"
echo "======================================"

echo
echo "===== SAFETY ====="

if [[ "$(uname -s)" != "Linux" ]]; then
  echo "❌ Upgrade must run on Linux."
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "❌ Repository working tree is not clean."
  git status --short
  exit 1
fi

deploy/scripts/validate-production-env.sh \
  "$ENV_FILE"

CURRENT_TAG="$(
  git describe \
    --tags \
    --exact-match \
    2>/dev/null || true
)"

if [[ -z "$CURRENT_TAG" ]]; then
  echo "❌ Current deployment is not on an exact release tag."
  exit 1
fi

if [[ "$CURRENT_TAG" == "$TARGET_TAG" ]]; then
  echo "❌ Target release is already deployed."
  exit 1
fi

echo "Current release: $CURRENT_TAG"
echo "Target release:  $TARGET_TAG"

echo
echo "===== FETCH RELEASE TAGS ====="

git fetch \
  origin \
  --tags \
  --prune

if ! git rev-parse \
  -q \
  --verify \
  "refs/tags/${TARGET_TAG}" \
  >/dev/null
then
  echo "❌ Release tag does not exist:"
  echo "$TARGET_TAG"
  exit 1
fi

echo "✅ Target release exists"

mkdir -p "$STATE_DIR"

TIMESTAMP="$(
  date -u '+%Y%m%dT%H%M%SZ'
)"

STATE_FILE="$STATE_DIR/upgrade-${TIMESTAMP}.env"

{
  echo "UPGRADE_TIMESTAMP=$TIMESTAMP"
  echo "PREVIOUS_TAG=$CURRENT_TAG"
  echo "TARGET_TAG=$TARGET_TAG"
  echo "PREVIOUS_COMMIT=$(git rev-parse HEAD)"
  echo "TARGET_COMMIT=$(git rev-list -n 1 "$TARGET_TAG")"
} > "$STATE_FILE"

echo
echo "===== CAPTURE CURRENT STATE ====="

deploy/scripts/capture-deployment-state.sh

echo
echo "===== DATABASE BACKUP ====="

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
  echo "❌ Database backup was not created."
  exit 1
fi

gzip -t "$LATEST_BACKUP"

echo "✅ Backup verified:"
echo "$LATEST_BACKUP"

echo
echo "DATABASE_BACKUP=$LATEST_BACKUP" \
  >> "$STATE_FILE"

echo
echo "===== CHECKOUT TARGET RELEASE ====="

git checkout \
  --detach \
  "$TARGET_TAG"

echo "✅ Checked out $TARGET_TAG"

echo
echo "===== VALIDATE TARGET ====="

deploy/scripts/validate-production-env.sh \
  "$ENV_FILE"

docker compose \
  --env-file "$ENV_FILE" \
  -f docker-compose.production.yml \
  -f deploy/docker-compose.proxy.yml \
  config \
  >/dev/null

echo "✅ Target Compose configuration valid"

echo
echo "===== BUILD TARGET IMAGES ====="

docker compose \
  --env-file "$ENV_FILE" \
  -f docker-compose.production.yml \
  -f deploy/docker-compose.proxy.yml \
  build \
  api \
  web

echo
echo "===== APPLY DATABASE MIGRATIONS ====="

docker compose \
  --env-file "$ENV_FILE" \
  -f docker-compose.production.yml \
  -f deploy/docker-compose.proxy.yml \
  run \
  --rm \
  api \
  pnpm \
  --dir apps/api \
  exec prisma migrate deploy

echo "✅ Migrations applied"

echo
echo "===== START TARGET RELEASE ====="

docker compose \
  --env-file "$ENV_FILE" \
  -f docker-compose.production.yml \
  -f deploy/docker-compose.proxy.yml \
  up \
  -d \
  db \
  api \
  web \
  caddy

echo
echo "===== HEALTH CHECK ====="

FAILED=0

for service in \
  euroatlas-production-db \
  euroatlas-production-api \
  euroatlas-production-web
do
  HEALTHY=0

  for attempt in {1..30}; do
    STATUS="$(
      docker inspect \
        "$service" \
        --format '{{.State.Health.Status}}' \
        2>/dev/null || true
    )"

    if [[ "$STATUS" == "healthy" ]]; then
      echo "✅ $service healthy"
      HEALTHY=1
      break
    fi

    sleep 2
  done

  if (( HEALTHY == 0 )); then
    echo "❌ $service failed health check"
    FAILED=1
  fi
done

if (( FAILED != 0 )); then
  echo
  echo "❌ Upgrade health verification failed."
  echo
  echo "Rollback information:"
  echo "  Previous tag: $CURRENT_TAG"
  echo "  Backup:       $LATEST_BACKUP"
  echo "  State file:   $STATE_FILE"
  echo
  echo "Run:"
  echo "  deploy/scripts/rollback-release.sh $CURRENT_TAG"
  exit 1
fi

echo
echo "===== SAVE ACTIVE RELEASE ====="

cat > "$STATE_DIR/current-release.env" <<STATE
CURRENT_TAG=$TARGET_TAG
CURRENT_COMMIT=$(git rev-parse HEAD)
PREVIOUS_TAG=$CURRENT_TAG
DATABASE_BACKUP=$LATEST_BACKUP
DEPLOYED_AT=$TIMESTAMP
STATE

echo
echo "======================================"
echo " UPGRADE SUCCESS"
echo "======================================"

echo
echo "Previous: $CURRENT_TAG"
echo "Current:  $TARGET_TAG"
echo "Backup:   $LATEST_BACKUP"
