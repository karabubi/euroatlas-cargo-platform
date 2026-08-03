#!/bin/bash

set -u

echo
echo "================================================"
echo " EUROATLAS CARGO — PHASE 14 DOCUMENTS AUDIT"
echo "================================================"

echo
echo "1. DOCUMENTS DIRECTORY"
echo "------------------------------------------------"
find apps/api/src/documents \
  -maxdepth 3 \
  -type f \
  -print 2>/dev/null \
  | sort

echo
echo "2. PRISMA DOCUMENT MODEL"
echo "------------------------------------------------"
awk '
  /^model Document/ {show=1}
  show {print}
  show && /^}/ {exit}
' apps/api/prisma/schema.prisma

echo
echo "3. DOCUMENT ENUMS"
echo "------------------------------------------------"
grep -n -A30 -B2 \
  -E "^enum .*Document|^enum Document" \
  apps/api/prisma/schema.prisma \
  || true

echo
echo "4. DOCUMENTS CONTROLLER"
echo "------------------------------------------------"
sed -n '1,260p' \
  apps/api/src/documents/documents.controller.ts \
  2>/dev/null \
  || echo "Controller not found"

echo
echo "5. DOCUMENTS SERVICE"
echo "------------------------------------------------"
sed -n '1,360p' \
  apps/api/src/documents/documents.service.ts \
  2>/dev/null \
  || echo "Service not found"

echo
echo "6. CREATE DOCUMENT DTO"
echo "------------------------------------------------"
find apps/api/src/documents \
  -type f \
  \( -iname '*create*dto*.ts' -o -iname 'create-*.dto.ts' \) \
  -print \
  -exec sed -n '1,220p' {} \;

echo
echo "7. UPDATE DOCUMENT DTO"
echo "------------------------------------------------"
find apps/api/src/documents \
  -type f \
  \( -iname '*update*dto*.ts' -o -iname 'update-*.dto.ts' \) \
  -print \
  -exec sed -n '1,220p' {} \;

echo
echo "8. MULTER / FILE STORAGE CONFIGURATION"
echo "------------------------------------------------"
grep -RniE \
  "FileInterceptor|FilesInterceptor|Multer|diskStorage|memoryStorage|destination|filename|UploadedFile|Express.Multer" \
  apps/api/src/documents \
  apps/api/src \
  2>/dev/null \
  | head -200 \
  || true

echo
echo "9. FRONTEND DOCUMENT FILES"
echo "------------------------------------------------"
find apps/web/src \
  -type f \
  \( \
    -iname '*document*.ts' \
    -o -iname '*document*.tsx' \
    -o -path '*/documents/*' \
  \) \
  -print \
  2>/dev/null \
  | sort

echo
echo "10. SIDEBAR / DASHBOARD LAYOUT FILES"
echo "------------------------------------------------"
find apps/web/src/app/dashboard \
  -maxdepth 2 \
  -type f \
  \( -name 'layout.tsx' -o -name '*sidebar*.tsx' \) \
  -print

grep -RniE \
  "Dashboard|Customers|Shipments|Vehicles|Invoices" \
  apps/web/src/app/dashboard \
  apps/web/src/components \
  2>/dev/null \
  | head -150

echo
echo "11. API FETCH IMPLEMENTATION"
echo "------------------------------------------------"
find apps/web/src/lib \
  -maxdepth 1 \
  -type f \
  -print \
  | sort

grep -RniE \
  "export.*apiFetch|function apiFetch|Authorization|localStorage|getAccessToken" \
  apps/web/src/lib \
  apps/web/src \
  2>/dev/null \
  | head -200

echo
echo "12. SHIPMENT FRONTEND TYPES"
echo "------------------------------------------------"
sed -n '1,260p' \
  apps/web/src/types/shipment.ts \
  2>/dev/null \
  || true

echo
echo "13. CURRENT DATABASE DOCUMENT RECORDS"
echo "------------------------------------------------"

if docker info >/dev/null 2>&1; then
  docker compose exec -T postgres sh -lc \
    'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"' <<'SQL' || true
SELECT *
FROM "Document"
ORDER BY "createdAt" DESC
LIMIT 5;
SQL
else
  echo "Docker is not running."
fi

echo
echo "14. SERVER STATUS"
echo "------------------------------------------------"

echo "Frontend port 3000:"
lsof -nP -iTCP:3000 -sTCP:LISTEN \
  || echo "Frontend is not running"

echo
echo "Backend port 4000:"
lsof -nP -iTCP:4000 -sTCP:LISTEN \
  || echo "Backend is not running"

echo
echo "PostgreSQL port 55432:"
lsof -nP -iTCP:55432 -sTCP:LISTEN \
  || echo "PostgreSQL is not running"

echo
echo "15. TYPESCRIPT STATUS"
echo "------------------------------------------------"

echo "Backend:"
pnpm --dir=apps/api exec tsc --noEmit \
  || true

echo
echo "Frontend:"
pnpm --dir=apps/web exec tsc --noEmit \
  || true

echo
echo "================================================"
echo " PHASE 14 DOCUMENTS AUDIT FINISHED"
echo "================================================"
