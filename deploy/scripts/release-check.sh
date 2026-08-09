#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(
  cd "$(dirname "${BASH_SOURCE[0]}")/../.." &&
  pwd
)"

cd "$ROOT_DIR"

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
echo " EuroAtlas Release Verification "
echo "======================================"

echo
echo "===== GIT ====="

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Working tree contains changes:"
  git status --short
  fail "Working tree is not clean"
fi

pass "Working tree clean"

echo
echo "===== SHELL SCRIPTS ====="

scripts=(
  deploy/scripts/backup-postgres.sh
  deploy/scripts/restore-postgres.sh
  deploy/scripts/test-restore-postgres.sh
  deploy/scripts/security-check.sh
  deploy/scripts/production-preflight.sh
  deploy/scripts/release-check.sh
)

for script in "${scripts[@]}"; do
  bash -n "$script" || \
    fail "Shell syntax failed: $script"
done

pass "Deployment shell scripts have valid syntax"

echo
echo "===== SECRET SAFETY ====="

if git ls-files \
  | grep -Eq \
    '^deploy/production\.env(\.local)?$'
then
  fail "Production secret environment file is tracked"
fi

pass "Production secret files are not tracked"

if git grep -nE \
  'phase43d_local_db_password|phase43d_local_jwt_secret' \
  -- \
  ':!deploy/production.env.example' \
  ':!deploy/scripts/release-check.sh'
then
  fail "Local deployment test secrets found in tracked files"
fi

pass "Local deployment test secrets not found"

echo
echo "===== PRODUCTION ENV TEMPLATE ====="

required_vars=(
  POSTGRES_USER
  POSTGRES_PASSWORD
  POSTGRES_DB
  API_PORT
  JWT_SECRET
  CORS_ORIGIN
  WEB_PORT
  NEXT_PUBLIC_API_URL
  DOMAIN
  ACME_EMAIL
)

for variable in "${required_vars[@]}"; do
  grep -Eq "^${variable}=" \
    deploy/production.env.example \
    || fail \
      "Missing production environment variable: $variable"
done

pass "Production environment template complete"

echo
echo "===== DOCKER COMPOSE STATIC CHECK ====="

docker compose \
  --env-file deploy/production.env.example \
  -f docker-compose.production.yml \
  config \
  >/dev/null \
  || fail "Production Compose validation failed"

pass "Production Compose configuration valid"

docker compose \
  --env-file deploy/production.env.example \
  -f docker-compose.production.yml \
  -f deploy/docker-compose.proxy.yml \
  config \
  >/dev/null \
  || fail "Proxy Compose validation failed"

pass "Proxy Compose configuration valid"

echo
echo "===== CADDY CONFIGURATION ====="

docker run \
  --rm \
  -e DOMAIN=cargo.example.com \
  -e ACME_EMAIL=ci@example.com \
  -v "$ROOT_DIR/deploy/Caddyfile:/etc/caddy/Caddyfile:ro" \
  caddy:2-alpine \
  caddy validate \
  --config /etc/caddy/Caddyfile \
  >/dev/null \
  || fail "Caddy configuration validation failed"

pass "Caddy configuration valid"

if [[ "${RELEASE_CHECK_STATIC_ONLY:-0}" == "1" ]]; then
  echo
  echo "===== APPLICATION VERIFICATION ====="
  echo "ℹ️ Skipped in static release-gate mode."
  echo "   API CI and Web CI provide application verification."
else
  echo
  echo "===== APPLICATION VERIFICATION ====="

  pnpm verify \
    || fail "Repository verification failed"

  pass "API and Web verification passed"
fi

echo
echo "======================================"
echo " RELEASE CHECK SUCCESS "
echo "======================================"

echo
echo "Passed checks: $PASS_COUNT"
echo
echo "✅ Repository is release-ready."
