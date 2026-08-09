#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(
  cd "$(dirname "${BASH_SOURCE[0]}")/../.." &&
  pwd
)"

ENV_FILE="${ENV_FILE:-$ROOT_DIR/deploy/production.env}"
COMPOSE_FILE="$ROOT_DIR/docker-compose.production.yml"
PROXY_FILE="$ROOT_DIR/deploy/docker-compose.proxy.yml"

PASS_COUNT=0

pass() {
  PASS_COUNT=$((PASS_COUNT + 1))
  echo "✅ $1"
}

fail() {
  echo "❌ $1"
  exit 1
}

echo "======================================"
echo " EuroAtlas Production Preflight Check "
echo "======================================"

echo
echo "===== ENVIRONMENT ====="

[[ -f "$ENV_FILE" ]] \
  || fail "Environment file not found: $ENV_FILE"

pass "Environment file exists"

set -a
source "$ENV_FILE"
set +a

required_vars=(
  POSTGRES_USER
  POSTGRES_PASSWORD
  POSTGRES_DB
  JWT_SECRET
  CORS_ORIGIN
  NEXT_PUBLIC_API_URL
  DOMAIN
  ACME_EMAIL
)

for variable in "${required_vars[@]}"; do
  if [[ -z "${!variable:-}" ]]; then
    fail "Required variable is empty: $variable"
  fi
done

pass "Required environment variables are present"

echo
echo "===== SECRET PLACEHOLDERS ====="

if grep -Eq \
  'replace_with_|change_me' \
  "$ENV_FILE"
then
  fail "Environment contains placeholder secrets"
fi

pass "No placeholder secrets detected"

echo
echo "===== DOCKER ====="

docker info >/dev/null 2>&1 \
  || fail "Docker daemon is unavailable"

pass "Docker daemon available"

docker compose version >/dev/null 2>&1 \
  || fail "Docker Compose is unavailable"

pass "Docker Compose available"

echo
echo "===== COMPOSE VALIDATION ====="

docker compose \
  --env-file "$ENV_FILE" \
  -f "$COMPOSE_FILE" \
  config \
  >/dev/null

pass "Production Compose valid"

docker compose \
  --env-file "$ENV_FILE" \
  -f "$COMPOSE_FILE" \
  -f "$PROXY_FILE" \
  config \
  >/dev/null

pass "Proxy Compose valid"

echo
echo "===== CADDY ====="

docker run \
  --rm \
  -e DOMAIN="$DOMAIN" \
  -e ACME_EMAIL="$ACME_EMAIL" \
  -v "$ROOT_DIR/deploy/Caddyfile:/etc/caddy/Caddyfile:ro" \
  caddy:2-alpine \
  caddy validate \
  --config /etc/caddy/Caddyfile \
  >/dev/null

pass "Caddy configuration valid"

echo
echo "===== RUNNING STACK ====="

API_STATE="$(
  docker inspect \
    euroatlas-production-api \
    --format '{{.State.Health.Status}}' \
    2>/dev/null || true
)"

WEB_STATE="$(
  docker inspect \
    euroatlas-production-web \
    --format '{{.State.Health.Status}}' \
    2>/dev/null || true
)"

DB_STATE="$(
  docker inspect \
    euroatlas-production-db \
    --format '{{.State.Health.Status}}' \
    2>/dev/null || true
)"

[[ "$API_STATE" == "healthy" ]] \
  || fail "API is not healthy"

pass "API healthy"

[[ "$WEB_STATE" == "healthy" ]] \
  || fail "Web is not healthy"

pass "Web healthy"

[[ "$DB_STATE" == "healthy" ]] \
  || fail "PostgreSQL is not healthy"

pass "PostgreSQL healthy"

echo
echo "===== SECURITY ====="

ENV_FILE="$ENV_FILE" \
  "$ROOT_DIR/deploy/scripts/security-check.sh"

pass "Container security audit passed"

echo
echo "===== MIGRATIONS ====="

MIGRATION_EXIT="$(
  docker inspect \
    euroatlas-production-migrate \
    --format '{{.State.ExitCode}}' \
    2>/dev/null || true
)"

[[ "$MIGRATION_EXIT" == "0" ]] \
  || fail "Migration container did not exit successfully"

pass "Migration container successful"

echo
echo "===== HTTP HEALTH ====="

API_PORT="${API_PORT:-4000}"
WEB_PORT="${WEB_PORT:-3000}"

curl \
  --fail \
  --silent \
  --show-error \
  "http://127.0.0.1:${API_PORT}/api/health" \
  >/dev/null

pass "Direct API health endpoint reachable"

curl \
  --fail \
  --silent \
  --show-error \
  "http://127.0.0.1:${WEB_PORT}/" \
  >/dev/null

pass "Direct Web endpoint reachable"

echo
echo "======================================"
echo " PRE-FLIGHT SUCCESS "
echo "======================================"
echo
echo "Passed checks: $PASS_COUNT"
echo
echo "✅ EuroAtlas Cargo is ready for deployment."
