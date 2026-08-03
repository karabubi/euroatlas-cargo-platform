#!/bin/bash

set -u

check_path() {
  local label="$1"
  local path="$2"

  if [ -e "$path" ]; then
    printf "✅ %-28s %s\n" "$label" "$path"
  else
    printf "❌ %-28s %s\n" "$label" "$path"
  fi
}

echo
echo "EUROATLAS CARGO — PHASE AUDIT"
echo "=============================================="

check_path "Frontend application" "apps/web"
check_path "Backend application" "apps/api"
check_path "Prisma schema" "apps/api/prisma/schema.prisma"
check_path "Authentication backend" "apps/api/src/auth"
check_path "Users backend" "apps/api/src/users"
check_path "Customers backend" "apps/api/src/customers"
check_path "Shipments backend" "apps/api/src/shipments"
check_path "Vehicles backend" "apps/api/src/vehicles"
check_path "Dashboard backend" "apps/api/src/dashboard"
check_path "Tracking backend" "apps/api/src/tracking"
check_path "Documents backend" "apps/api/src/documents"
check_path "Invoices backend" "apps/api/src/invoices"

check_path "Dashboard frontend" "apps/web/src/app/dashboard/page.tsx"
check_path "Customers frontend" "apps/web/src/app/dashboard/customers"
check_path "Shipments frontend" "apps/web/src/app/dashboard/shipments"
check_path "Vehicles frontend" "apps/web/src/app/dashboard/vehicles"
check_path "Invoices frontend" "apps/web/src/app/dashboard/invoices"
check_path "Invoice create page" "apps/web/src/app/dashboard/invoices/new/page.tsx"
check_path "Invoice details page" "apps/web/src/app/dashboard/invoices/[id]/page.tsx"

echo
echo "REGISTERED API MODULES"
echo "=============================================="

grep -Rni "Module" apps/api/src/app.module.ts || true

echo
echo "CURRENT PORTS"
echo "=============================================="

echo "Frontend port 3000:"
lsof -nP -iTCP:3000 -sTCP:LISTEN || echo "Not running"

echo
echo "Backend port 4000:"
lsof -nP -iTCP:4000 -sTCP:LISTEN || echo "Not running"

echo
