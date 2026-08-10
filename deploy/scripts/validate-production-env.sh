#!/usr/bin/env bash

set -euo pipefail

ENV_FILE="${1:-deploy/production.env.local}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "❌ Production environment file not found:"
  echo "$ENV_FILE"
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

required=(
  POSTGRES_USER
  POSTGRES_PASSWORD
  POSTGRES_DB
  DATABASE_URL
  JWT_SECRET
  CORS_ORIGIN
  NEXT_PUBLIC_API_URL
  DOMAIN
  ACME_EMAIL
)

missing=0

echo "===== PRODUCTION ENV VALIDATION ====="

for key in "${required[@]}"; do
  value="${!key:-}"

  if [[ -z "$value" ]]; then
    echo "❌ Missing: $key"
    missing=1
  else
    echo "✅ Present: $key"
  fi
done

POSTGRES_PASSWORD_VALUE="${POSTGRES_PASSWORD:-}"
JWT_SECRET_VALUE="${JWT_SECRET:-}"
DOMAIN_VALUE="${DOMAIN:-}"
ACME_EMAIL_VALUE="${ACME_EMAIL:-}"

if [[ "$POSTGRES_PASSWORD_VALUE" == "change_me" ]]; then
  echo "❌ POSTGRES_PASSWORD still uses placeholder"
  missing=1
fi

if [[ "$JWT_SECRET_VALUE" == replace_with_* ]]; then
  echo "❌ JWT_SECRET still uses placeholder"
  missing=1
fi

if (( ${#JWT_SECRET_VALUE} < 32 )); then
  echo "❌ JWT_SECRET should be at least 32 characters"
  missing=1
fi

if [[ "$DOMAIN_VALUE" == "cargo.example.com" ]]; then
  echo "❌ DOMAIN still uses example value"
  missing=1
fi

if [[ "$ACME_EMAIL_VALUE" == "admin@example.com" ]]; then
  echo "❌ ACME_EMAIL still uses example value"
  missing=1
fi

if (( missing != 0 )); then
  echo
  echo "❌ Production environment validation failed."
  exit 1
fi

echo
echo "✅ Production environment validation passed."
