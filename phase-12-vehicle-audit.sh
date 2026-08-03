#!/bin/bash

set -u

echo
echo "================================================"
echo "EUROATLAS CARGO — VEHICLE PHASE AUDIT"
echo "================================================"

echo
echo "1. PRISMA VEHICLE MODEL"
echo "------------------------------------------------"

awk '
  /^model Vehicle/ {show=1}
  show {print}
  show && /^}/ {exit}
' apps/api/prisma/schema.prisma

echo
echo "2. VEHICLE BACKEND FILES"
echo "------------------------------------------------"

find apps/api/src/vehicles \
  -maxdepth 3 \
  -type f \
  -print \
  | sort

echo
echo "3. VEHICLE CONTROLLER"
echo "------------------------------------------------"

sed -n '1,260p' \
  apps/api/src/vehicles/vehicles.controller.ts

echo
echo "4. CREATE VEHICLE DTO"
echo "------------------------------------------------"

find apps/api/src/vehicles \
  -type f \
  \( -iname '*create*vehicle*.ts' -o -iname 'create-vehicle.dto.ts' \) \
  -exec sh -c '
    echo "FILE: $1"
    sed -n "1,260p" "$1"
  ' _ {} \;

echo
echo "5. UPDATE VEHICLE DTO"
echo "------------------------------------------------"

find apps/api/src/vehicles \
  -type f \
  \( -iname '*update*vehicle*.ts' -o -iname 'update-vehicle.dto.ts' \) \
  -exec sh -c '
    echo "FILE: $1"
    sed -n "1,260p" "$1"
  ' _ {} \;

echo
echo "6. VEHICLE SERVICE"
echo "------------------------------------------------"

sed -n '1,340p' \
  apps/api/src/vehicles/vehicles.service.ts

echo
echo "7. FRONTEND VEHICLE FILES"
echo "------------------------------------------------"

find apps/web/src \
  -type f \
  \( -iname '*vehicle*' -o -path '*/vehicles/*' \) \
  -print \
  | sort

echo
echo "8. FRONTEND VEHICLE PAGE"
echo "------------------------------------------------"

sed -n '1,420p' \
  apps/web/src/app/dashboard/vehicles/page.tsx

echo
echo "9. VEHICLE TYPES"
echo "------------------------------------------------"

if [ -f apps/web/src/types/vehicle.ts ]; then
  sed -n '1,320p' apps/web/src/types/vehicle.ts
else
  echo "No vehicle type file found."
fi

echo
echo "10. VEHICLE API CLIENT"
echo "------------------------------------------------"

if [ -f apps/web/src/lib/vehicles-api.ts ]; then
  sed -n '1,320p' apps/web/src/lib/vehicles-api.ts
else
  echo "No vehicle API client found."
fi

echo
echo "11. TYPESCRIPT AND LINT STATUS"
echo "------------------------------------------------"

pnpm --dir=apps/api exec tsc --noEmit
API_TSC_STATUS=$?

pnpm --dir=apps/web exec tsc --noEmit
WEB_TSC_STATUS=$?

pnpm --dir=apps/web lint
WEB_LINT_STATUS=$?

echo
echo "API TypeScript status: $API_TSC_STATUS"
echo "Web TypeScript status: $WEB_TSC_STATUS"
echo "Web lint status: $WEB_LINT_STATUS"

echo
echo "12. RUNNING SERVICES"
echo "------------------------------------------------"

echo "Frontend port 3000:"
lsof -nP -iTCP:3000 -sTCP:LISTEN \
  || echo "Frontend is not running."

echo
echo "Backend port 4000:"
lsof -nP -iTCP:4000 -sTCP:LISTEN \
  || echo "Backend is not running."

echo
echo "PostgreSQL port 55432:"
lsof -nP -iTCP:55432 -sTCP:LISTEN \
  || echo "PostgreSQL is not running."

echo
echo "================================================"
echo "AUDIT FINISHED"
echo "================================================"
