#!/usr/bin/env bash

set -euo pipefail

ENV_FILE="${ENV_FILE:-deploy/production.env.local}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "❌ Environment file not found:"
  echo "$ENV_FILE"
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

deploy/scripts/validate-production-env.sh \
  "$ENV_FILE"

BASE_URL="https://${DOMAIN}"
API_HEALTH="${BASE_URL}/api/health"

PASS_COUNT=0

pass() {
  echo "✅ $1"
  PASS_COUNT=$((PASS_COUNT + 1))
}

fail() {
  echo "❌ $1"
  exit 1
}

echo "======================================"
echo " EuroAtlas Production Smoke Test"
echo "======================================"

echo
echo "===== DNS ====="

if getent hosts "$DOMAIN" >/dev/null 2>&1; then
  pass "Domain resolves: $DOMAIN"
else
  fail "Domain does not resolve: $DOMAIN"
fi

echo
echo "===== HTTPS WEB ====="

WEB_CODE="$(
  curl \
    --silent \
    --show-error \
    --output /dev/null \
    --write-out '%{http_code}' \
    "$BASE_URL/"
)"

if [[ "$WEB_CODE" == "200" ]]; then
  pass "Web returned HTTP 200"
else
  fail "Web returned HTTP $WEB_CODE"
fi

echo
echo "===== API HEALTH ====="

API_CODE="$(
  curl \
    --silent \
    --show-error \
    --output /tmp/euroatlas-health.json \
    --write-out '%{http_code}' \
    "$API_HEALTH"
)"

if [[ "$API_CODE" != "200" ]]; then
  fail "API health returned HTTP $API_CODE"
fi

pass "API health returned HTTP 200"

if grep -q '"status":"ok"' \
  /tmp/euroatlas-health.json
then
  pass "API health payload reports ok"
else
  fail "API health payload is unexpected"
fi

echo
echo "===== HTTP REDIRECT ====="

HTTP_RESULT="$(
  curl \
    --silent \
    --show-error \
    --output /dev/null \
    --write-out '%{http_code} %{redirect_url}' \
    "http://${DOMAIN}/"
)"

echo "$HTTP_RESULT"

HTTP_CODE="${HTTP_RESULT%% *}"
REDIRECT_URL="${HTTP_RESULT#* }"

case "$HTTP_CODE" in
  301|302|307|308)
    ;;
  *)
    fail "HTTP did not return a redirect"
    ;;
esac

if [[ "$REDIRECT_URL" == https://* ]]; then
  pass "HTTP redirects to HTTPS"
else
  fail "HTTP redirect target is not HTTPS"
fi

echo
echo "===== TLS CERTIFICATE ====="

TLS_OUTPUT="$(
  echo \
    | openssl s_client \
      -connect "${DOMAIN}:443" \
      -servername "$DOMAIN" \
      2>/dev/null \
    | openssl x509 \
      -noout \
      -subject \
      -issuer \
      -dates
)"

echo "$TLS_OUTPUT"

if [[ -n "$TLS_OUTPUT" ]]; then
  pass "TLS certificate available"
else
  fail "TLS certificate unavailable"
fi

echo
echo "===== CONTAINERS ====="

for container in \
  euroatlas-production-db \
  euroatlas-production-api \
  euroatlas-production-web
do
  HEALTH="$(
    docker inspect \
      "$container" \
      --format '{{.State.Health.Status}}' \
      2>/dev/null || true
  )"

  if [[ "$HEALTH" == "healthy" ]]; then
    pass "$container is healthy"
  else
    fail "$container health is: ${HEALTH:-missing}"
  fi
done

echo
echo "===== CONTAINER USERS ====="

for container in \
  euroatlas-production-api \
  euroatlas-production-web
do
  USER_NAME="$(
    docker inspect \
      "$container" \
      --format '{{.Config.User}}'
  )"

  echo "$container user: ${USER_NAME:-root}"

  if [[ -z "$USER_NAME" || "$USER_NAME" == "0" || "$USER_NAME" == "root" ]]; then
    fail "$container is running as root"
  else
    pass "$container uses non-root user"
  fi
done

echo
echo "===== DATABASE EXPOSURE ====="

DB_PORTS="$(
  docker inspect \
    euroatlas-production-db \
    --format '{{json .NetworkSettings.Ports}}'
)"

echo "$DB_PORTS"

if [[ "$DB_PORTS" == "null" || "$DB_PORTS" == "{}" ]]; then
  pass "PostgreSQL is not published to the host"
else
  fail "PostgreSQL has host port bindings"
fi

echo
echo "===== LOGIN ENDPOINT ====="

LOGIN_CODE="$(
  curl \
    --silent \
    --show-error \
    --output /tmp/euroatlas-login-response.json \
    --write-out '%{http_code}' \
    -X POST \
    -H 'Content-Type: application/json' \
    --data '{
      "email":"smoke-test@example.invalid",
      "password":"invalid-smoke-test-password"
    }' \
    "${BASE_URL}/api/auth/login"
)"

if [[ "$LOGIN_CODE" == "401" ]]; then
  pass "Login endpoint reachable and rejected invalid credentials"
else
  echo "Response:"
  cat /tmp/euroatlas-login-response.json || true
  fail "Unexpected login response HTTP $LOGIN_CODE"
fi

echo
echo "======================================"
echo " PRODUCTION SMOKE TEST SUCCESS"
echo "======================================"

echo
echo "Passed checks: $PASS_COUNT"
