#!/bin/bash

echo
echo "=================================================="
echo "EUROATLAS CARGO — PHASE 16 DOCUMENT UPLOAD AUDIT"
echo "=================================================="

echo
echo "1. DOCUMENT BACKEND FILES"
echo "--------------------------------------------------"
find apps/api/src/documents -maxdepth 3 -type f -print 2>/dev/null | sort

echo
echo "2. DOCUMENT CONTROLLER"
echo "--------------------------------------------------"
sed -n '1,320p' \
  apps/api/src/documents/documents.controller.ts \
  2>/dev/null || true

echo
echo "3. DOCUMENT SERVICE"
echo "--------------------------------------------------"
sed -n '1,420p' \
  apps/api/src/documents/documents.service.ts \
  2>/dev/null || true

echo
echo "4. DOCUMENT DTO FILES"
echo "--------------------------------------------------"
for file in apps/api/src/documents/dto/*.ts; do
  [ -f "$file" ] || continue
  echo
  echo "FILE: $file"
  sed -n '1,260p' "$file"
done

echo
echo "5. PRISMA DOCUMENT MODEL"
echo "--------------------------------------------------"
awk '
  /^model Document/ { show=1 }
  show { print }
  show && /^}/ { exit }
' apps/api/prisma/schema.prisma

echo
echo "6. SHIPMENT DETAILS PAGE"
echo "--------------------------------------------------"
sed -n '1,420p' \
  "apps/web/src/app/dashboard/shipments/[id]/page.tsx" \
  2>/dev/null || true

echo
echo "7. SHIPMENT API"
echo "--------------------------------------------------"
find apps/web/src/lib -maxdepth 1 -type f \
  \( -iname "*shipment*" -o -iname "*document*" \) \
  -print

for file in apps/web/src/lib/*shipment*.ts apps/web/src/lib/*document*.ts; do
  [ -f "$file" ] || continue
  echo
  echo "FILE: $file"
  sed -n '1,360p' "$file"
done

echo
echo "8. DOCUMENT TYPES"
echo "--------------------------------------------------"
find apps/web/src/types -maxdepth 1 -type f \
  \( -iname "*document*" -o -iname "*shipment*" \) \
  -print

for file in apps/web/src/types/*document*.ts apps/web/src/types/*shipment*.ts; do
  [ -f "$file" ] || continue
  echo
  echo "FILE: $file"
  sed -n '1,320p' "$file"
done

echo
echo "9. AUTH TOKEN STORAGE"
echo "--------------------------------------------------"
grep -RniE \
  "localStorage|accessToken|access_token|Authorization|Bearer" \
  apps/web/src \
  --exclude-dir=.next \
  | head -120 || true

echo
echo "10. UPLOAD DIRECTORY"
echo "--------------------------------------------------"
find apps/api/uploads -maxdepth 3 -type d -print 2>/dev/null || true

echo
echo "11. DOCUMENT ROUTES"
echo "--------------------------------------------------"
grep -RniE \
  "@Post|@Get|@Patch|@Delete|FileInterceptor|FilesInterceptor|UploadedFile|UploadedFiles" \
  apps/api/src/documents \
  2>/dev/null || true

echo
echo "12. CURRENT SERVICES"
echo "--------------------------------------------------"

echo "Frontend port 3000:"
lsof -nP -iTCP:3000 -sTCP:LISTEN || echo "Not running"

echo
echo "Backend port 4000:"
lsof -nP -iTCP:4000 -sTCP:LISTEN || echo "Not running"

echo
echo "PostgreSQL port 55432:"
lsof -nP -iTCP:55432 -sTCP:LISTEN || echo "Not running"

echo
echo "Docker:"
docker compose ps 2>/dev/null || true

echo
echo "=================================================="
echo "AUDIT COMPLETE"
echo "=================================================="
