#!/usr/bin/env bash

set -euo pipefail

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

echo "======================================"
echo " EuroAtlas Production Security Audit "
echo "======================================"

echo
echo "===== CONTAINER USERS ====="

docker inspect \
  euroatlas-production-api \
  --format 'API user: {{.Config.User}}'

docker inspect \
  euroatlas-production-web \
  --format 'WEB user: {{.Config.User}}'

echo
echo "===== PRIVILEGED MODE ====="

docker inspect \
  euroatlas-production-api \
  --format 'API privileged: {{.HostConfig.Privileged}}'

docker inspect \
  euroatlas-production-web \
  --format 'WEB privileged: {{.HostConfig.Privileged}}'

echo
echo "===== DATABASE PORT EXPOSURE ====="

DB_PORTS="$(
  docker inspect \
    euroatlas-production-db \
    --format '{{json .HostConfig.PortBindings}}'
)"

echo "$DB_PORTS"

if [[ "$DB_PORTS" == "null" || "$DB_PORTS" == "{}" ]]; then
  echo "✅ PostgreSQL is not published to the host."
else
  echo "❌ PostgreSQL has host port bindings."
  exit 1
fi

echo
echo "===== HEALTH ====="

docker inspect \
  euroatlas-production-api \
  --format 'API health: {{.State.Health.Status}}'

docker inspect \
  euroatlas-production-web \
  --format 'WEB health: {{.State.Health.Status}}'

echo
echo "✅ Security checks completed."

echo
echo "===== HOST BINDINGS ====="

API_BIND="$(
  docker inspect \
    euroatlas-production-api \
    --format '{{json .HostConfig.PortBindings}}'
)"

WEB_BIND="$(
  docker inspect \
    euroatlas-production-web \
    --format '{{json .HostConfig.PortBindings}}'
)"

echo "API bindings: $API_BIND"
echo "WEB bindings: $WEB_BIND"

if [[ "$API_BIND" != *'"HostIp":"127.0.0.1"'* ]]; then
  echo "❌ API is not restricted to localhost."
  exit 1
fi

if [[ "$WEB_BIND" != *'"HostIp":"127.0.0.1"'* ]]; then
  echo "❌ Web is not restricted to localhost."
  exit 1
fi

echo "✅ API and Web host bindings are private."
