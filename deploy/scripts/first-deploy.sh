#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(
  cd "$(dirname "${BASH_SOURCE[0]}")/../.." &&
  pwd
)"

cd "$ROOT_DIR"

ENV_FILE="${ENV_FILE:-deploy/production.env.local}"

echo "======================================"
echo " EuroAtlas Cargo First Deployment "
echo "======================================"

echo
echo "===== SAFETY ====="

if [[ "$(uname -s)" != "Linux" ]]; then
  echo "❌ First deployment must run on Linux."
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "❌ Repository working tree is not clean."
  git status --short
  exit 1
fi

CURRENT_TAG="$(
  git describe \
    --tags \
    --exact-match \
    2>/dev/null || true
)"

if [[ -z "$CURRENT_TAG" ]]; then
  echo "❌ Deployment must run from an exact release tag."
  exit 1
fi

echo "Release tag: $CURRENT_TAG"

echo
echo "===== ENVIRONMENT ====="

deploy/scripts/validate-production-env.sh \
  "$ENV_FILE"

echo
echo "===== COMPOSE VALIDATION ====="

docker compose \
  --env-file "$ENV_FILE" \
  -f docker-compose.production.yml \
  -f deploy/docker-compose.proxy.yml \
  config \
  >/dev/null

echo "✅ Docker Compose configuration valid"

echo
echo "===== START DATABASE ====="

docker compose \
  --env-file "$ENV_FILE" \
  -f docker-compose.production.yml \
  -f deploy/docker-compose.proxy.yml \
  up \
  -d \
  db

echo
echo "===== WAIT FOR DATABASE ====="

for attempt in {1..30}; do
  STATUS="$(
    docker inspect \
      euroatlas-production-db \
      --format '{{.State.Health.Status}}' \
      2>/dev/null || true
  )"

  if [[ "$STATUS" == "healthy" ]]; then
    echo "✅ Database healthy"
    break
  fi

  if (( attempt == 30 )); then
    echo "❌ Database did not become healthy"
    exit 1
  fi

  sleep 2
done

echo
echo "===== APPLY MIGRATIONS ====="

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

echo "✅ Prisma migrations applied"

echo
echo "===== START APPLICATION ====="

docker compose \
  --env-file "$ENV_FILE" \
  -f docker-compose.production.yml \
  -f deploy/docker-compose.proxy.yml \
  up \
  -d \
  api \
  web

echo
echo "===== WAIT FOR APPLICATION ====="

for service in \
  euroatlas-production-api \
  euroatlas-production-web
do
  for attempt in {1..30}; do
    STATUS="$(
      docker inspect \
        "$service" \
        --format '{{.State.Health.Status}}' \
        2>/dev/null || true
    )"

    if [[ "$STATUS" == "healthy" ]]; then
      echo "✅ $service healthy"
      break
    fi

    if (( attempt == 30 )); then
      echo "❌ $service did not become healthy"
      exit 1
    fi

    sleep 2
  done
done

echo
echo "===== START REVERSE PROXY ====="

docker compose \
  --env-file "$ENV_FILE" \
  -f docker-compose.production.yml \
  -f deploy/docker-compose.proxy.yml \
  up \
  -d \
  caddy

echo
echo "===== FINAL STATUS ====="

docker compose \
  --env-file "$ENV_FILE" \
  -f docker-compose.production.yml \
  -f deploy/docker-compose.proxy.yml \
  ps

echo
echo "======================================"
echo " FIRST DEPLOYMENT COMPLETE "
echo "======================================"
