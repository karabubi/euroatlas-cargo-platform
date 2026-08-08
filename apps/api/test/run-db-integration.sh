#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(
  cd "$(
    dirname "${BASH_SOURCE[0]}"
  )" &&
    pwd
)"

API_DIR="$(
  cd "${SCRIPT_DIR}/.." &&
    pwd
)"

ENV_FILE="${API_DIR}/.env.test.local"

cd "${API_DIR}"

if [[ -z "${DATABASE_URL:-}" ]]; then
  if [[ ! -f "${ENV_FILE}" ]]; then
    echo "❌ DATABASE_URL is not set and .env.test.local was not found."
    echo "Create apps/api/.env.test.local or provide DATABASE_URL explicitly."
    exit 1
  fi

  DATABASE_LINE="$(
    grep -E \
      '^[[:space:]]*DATABASE_URL=' \
      "${ENV_FILE}" \
      | tail -n 1 \
      || true
  )"

  if [[ -z "${DATABASE_LINE}" ]]; then
    echo "❌ DATABASE_URL was not found in .env.test.local."
    exit 1
  fi

  DATABASE_URL="${DATABASE_LINE#*=}"

  DATABASE_URL="$(
    printf '%s' "${DATABASE_URL}" \
      | sed \
        -e 's/^[[:space:]]*//' \
        -e 's/[[:space:]]*$//' \
        -e 's/^"//' \
        -e 's/"$//' \
        -e "s/^'//" \
        -e "s/'$//"
  )"

  export DATABASE_URL
fi

DATABASE_NAME="$(
  node <<'NODE'
const raw = process.env.DATABASE_URL;

if (!raw) {
  process.exit(2);
}

try {
  const url = new URL(raw);

  process.stdout.write(
    decodeURIComponent(
      url.pathname.replace(/^\/+/, ''),
    ),
  );
} catch {
  process.exit(2);
}
NODE
)" || {
  echo "❌ DATABASE_URL is invalid."
  exit 1
}

if [[ "${DATABASE_NAME}" != "euroatlas_cargo_test" ]]; then
  echo "❌ REFUSING TO RUN DATABASE INTEGRATION TESTS."
  echo "Expected database: euroatlas_cargo_test"
  echo "Detected database: ${DATABASE_NAME:-<unknown>}"
  exit 1
fi

echo "✅ Safe database selected: euroatlas_cargo_test"

echo
echo "▶ Applying test database migrations..."

pnpm exec prisma migrate deploy

echo
echo "▶ Running database integration tests..."

if [[ -n "${NODE_OPTIONS:-}" ]]; then
  export NODE_OPTIONS="${NODE_OPTIONS} --experimental-vm-modules"
else
  export NODE_OPTIONS="--experimental-vm-modules"
fi

pnpm exec jest \
  --config ./test/jest-db-integration.json \
  --runInBand

echo
echo "✅ Database integration tests completed safely."
