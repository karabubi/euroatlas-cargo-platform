#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(
  cd "$(dirname "${BASH_SOURCE[0]}")/../.." &&
  pwd
)"

cd "$ROOT_DIR"

TARGET_TAG="${1:-}"
ENV_FILE="${ENV_FILE:-deploy/production.env.local}"

if [[ -z "$TARGET_TAG" ]]; then
  echo "Usage:"
  echo "  $0 v<major>.<minor>.<patch>"
  exit 1
fi

echo "======================================"
echo " EuroAtlas Cargo Application Rollback"
echo "======================================"

if [[ "$(uname -s)" != "Linux" ]]; then
  echo "❌ Rollback must run on Linux."
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "❌ Repository working tree is not clean."
  git status --short
  exit 1
fi

deploy/scripts/validate-production-env.sh \
  "$ENV_FILE"

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
  echo "❌ Rollback tag does not exist:"
  echo "$TARGET_TAG"
  exit 1
fi

echo
echo "===== IMPORTANT ====="
echo
echo "This rollback changes application code and containers."
echo "It does NOT restore PostgreSQL automatically."
echo
echo "Target release: $TARGET_TAG"

echo
echo "===== CHECKOUT ROLLBACK RELEASE ====="

git checkout \
  --detach \
  "$TARGET_TAG"

echo
echo "===== BUILD ROLLBACK IMAGES ====="

docker compose \
  --env-file "$ENV_FILE" \
  -f docker-compose.production.yml \
  -f deploy/docker-compose.proxy.yml \
  build \
  api \
  web

echo
echo "===== START ROLLBACK RELEASE ====="

docker compose \
  --env-file "$ENV_FILE" \
  -f docker-compose.production.yml \
  -f deploy/docker-compose.proxy.yml \
  up \
  -d \
  api \
  web \
  caddy

echo
echo "===== HEALTH CHECK ====="

FAILED=0

for service in \
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
    echo "❌ $service failed rollback health check"
    FAILED=1
  fi
done

if (( FAILED != 0 )); then
  echo
  echo "❌ Application rollback failed."
  exit 1
fi

echo
echo "======================================"
echo " APPLICATION ROLLBACK SUCCESS"
echo "======================================"

echo
echo "Running release: $TARGET_TAG"

echo
echo "Database was NOT restored."
echo "Only restore a database backup after explicit review."
