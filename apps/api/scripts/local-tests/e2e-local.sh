#!/usr/bin/env bash

set -u

cd "$(dirname "$0")/../.." || exit 1

API="${API_URL:-http://localhost:4000/api}"

RUN_ID="$(date +%Y%m%d%H%M%S)"
CUSTOMER_NO="E2E-CUST-$RUN_ID"
SHIPMENT_NO="E2E-$RUN_ID"
VIN="E2E$(date +%s)"

TMP_DIR="/tmp/euroatlas-e2e-$RUN_ID"
mkdir -p "$TMP_DIR"

CUSTOMER_ID=""
SHIPMENT_ID=""
VEHICLE_ID=""
INSPECTION_ID=""
DOCUMENT_ID=""
JWT=""
AUTH=""

TEST_DOCUMENT="$TMP_DIR/e2e-document.png"

CLEANUP_ENABLED=true

echo "======================================================"
echo " EUROATLAS CARGO - PERMANENT LOCAL E2E TEST"
echo "======================================================"
echo
echo "Run ID      : $RUN_ID"
echo "Shipment No : $SHIPMENT_NO"
echo "API         : $API"
echo

# ------------------------------------------------------
# Helpers
# ------------------------------------------------------

print_json() {
  node -e '
let data = "";

process.stdin.on("data", chunk => data += chunk);

process.stdin.on("end", () => {
  try {
    console.log(JSON.stringify(JSON.parse(data), null, 2));
  } catch {
    console.log(data);
  }
});
'
}

json_field() {
  local field="$1"

  node -e '
const field = process.argv[1];

let data = "";

process.stdin.on("data", chunk => data += chunk);

process.stdin.on("end", () => {
  try {
    const value = JSON.parse(data)?.[field];

    if (value !== undefined && value !== null) {
      process.stdout.write(String(value));
    }
  } catch {}
});
' "$field"
}

tracking_count() {
  node -e '
let data = "";

process.stdin.on("data", chunk => data += chunk);

process.stdin.on("end", () => {
  try {
    const value = JSON.parse(data);

    const events =
      value.tracking ??
      value.trackingEvents ??
      value.events ??
      value.history ??
      [];

    process.stdout.write(
      String(Array.isArray(events) ? events.length : 0)
    );
  } catch {
    process.stdout.write("0");
  }
});
'
}

request_json() {
  local method="$1"
  local url="$2"
  local body="${3:-}"

  if [ -n "$body" ]; then
    curl -sS \
      --connect-timeout 5 \
      --max-time 30 \
      -X "$method" \
      -H "$AUTH" \
      -H "Content-Type: application/json" \
      --data "$body" \
      "$url"
  else
    curl -sS \
      --connect-timeout 5 \
      --max-time 30 \
      -X "$method" \
      -H "$AUTH" \
      "$url"
  fi
}

fail_response() {
  local message="$1"
  local response="${2:-}"

  echo
  echo "❌ $message"

  if [ -n "$response" ]; then
    echo
    printf '%s' "$response" | print_json
  fi

  exit 1
}

get_shipment_status() {
  node -e '
let data = "";

process.stdin.on("data", chunk => data += chunk);

process.stdin.on("end", () => {
  try {
    const json = JSON.parse(data);

    const status =
      json.status ??
      json.shipment?.status ??
      "";

    process.stdout.write(String(status));
  } catch {
    process.stdout.write("");
  }
});
'
}

assert_status() {
  local expected="$1"
  local response="$2"

  local actual

  actual="$(printf '%s' "$response" | get_shipment_status)"

  echo "Expected: $expected"
  echo "Actual  : $actual"

  if [ "$actual" != "$expected" ]; then
    fail_response \
      "Expected shipment status $expected, got $actual." \
      "$response"
  fi

  echo "✅ Status is $expected."
}

# ------------------------------------------------------
# Automatic cleanup
# ------------------------------------------------------

cleanup() {
  local original_exit="$?"

  trap - EXIT INT TERM

  if [ "$CLEANUP_ENABLED" != "true" ]; then
    exit "$original_exit"
  fi

  echo
  echo "======================================================"
  echo " AUTOMATIC E2E CLEANUP"
  echo "======================================================"

  if [ -z "$JWT" ]; then
    echo "ℹ️ No JWT available. Nothing authenticated to clean."
    rm -rf "$TMP_DIR"
    exit "$original_exit"
  fi

  if [ -n "$DOCUMENT_ID" ]; then
    echo "Removing document: $DOCUMENT_ID"

    curl -sS \
      --connect-timeout 5 \
      --max-time 20 \
      -X DELETE \
      -H "$AUTH" \
      "$API/documents/$DOCUMENT_ID" \
      >/dev/null || true
  fi

  if [ -n "$VEHICLE_ID" ]; then
    echo "Removing vehicle: $VEHICLE_ID"

    curl -sS \
      --connect-timeout 5 \
      --max-time 20 \
      -X DELETE \
      -H "$AUTH" \
      "$API/vehicles/$VEHICLE_ID" \
      >/dev/null || true
  fi

  if [ -n "$SHIPMENT_ID" ]; then
    echo "Removing shipment: $SHIPMENT_ID"

    curl -sS \
      --connect-timeout 5 \
      --max-time 20 \
      -X DELETE \
      -H "$AUTH" \
      "$API/shipments/$SHIPMENT_ID" \
      >/dev/null || true
  fi

  if [ -n "$CUSTOMER_ID" ]; then
    echo "Removing customer: $CUSTOMER_ID"

    curl -sS \
      --connect-timeout 5 \
      --max-time 20 \
      -X DELETE \
      -H "$AUTH" \
      "$API/customers/$CUSTOMER_ID" \
      >/dev/null || true
  fi

  rm -rf "$TMP_DIR"

  echo "✅ Automatic cleanup finished."

  exit "$original_exit"
}

trap cleanup EXIT INT TERM

# ------------------------------------------------------
# 1. Health
# ------------------------------------------------------

echo "===== 1. API HEALTH ====="

HEALTH="$(
  curl -sS \
    --connect-timeout 5 \
    --max-time 20 \
    "$API/health"
)" || fail_response "API is not reachable."

printf '%s' "$HEALTH" | print_json

HEALTH_STATUS="$(printf '%s' "$HEALTH" | json_field status)"

if [ "$HEALTH_STATUS" != "ok" ]; then
  fail_response "API health check failed." "$HEALTH"
fi

echo "✅ API is healthy."

# ------------------------------------------------------
# 2. Login
# ------------------------------------------------------

echo
echo "===== 2. ADMIN LOGIN ====="

ADMIN_EMAIL="${ADMIN_EMAIL:-admin@euroatlascargo.com}"

if [ -z "${ADMIN_PASSWORD:-}" ]; then
  read -s -p "Enter LOCAL admin password: " ADMIN_PASSWORD
  echo
fi

LOGIN_BODY="$(
  ADMIN_EMAIL="$ADMIN_EMAIL" \
  ADMIN_PASSWORD="$ADMIN_PASSWORD" \
  node - <<'NODE'
console.log(JSON.stringify({
  email: process.env.ADMIN_EMAIL,
  password: process.env.ADMIN_PASSWORD,
}));
NODE
)"

LOGIN_RESPONSE="$(
  curl -sS \
    --connect-timeout 5 \
    --max-time 30 \
    -X POST \
    -H "Content-Type: application/json" \
    --data "$LOGIN_BODY" \
    "$API/auth/login"
)"

JWT="$(printf '%s' "$LOGIN_RESPONSE" | json_field accessToken)"

if [ -z "$JWT" ]; then
  fail_response "Admin login failed." "$LOGIN_RESPONSE"
fi

AUTH="Authorization: Bearer $JWT"

echo "✅ Admin login successful."

unset ADMIN_PASSWORD

# ------------------------------------------------------
# 3. Detect Prisma enum values from schema
# ------------------------------------------------------

echo
echo "===== 3. DETECT INSPECTION ENUM VALUES ====="

INSPECTION_TYPE="$(
  awk '
    /^enum InspectionType[[:space:]]*\{/ {inside=1; next}
    inside && /^[[:space:]]*\}/ {exit}
    inside {
      gsub(/^[[:space:]]+|[[:space:]]+$/, "")
      if ($0 != "" && $0 !~ /^\/\//) {
        print $1
        exit
      }
    }
  ' prisma/schema.prisma
)"

INSPECTION_CONDITION="$(
  awk '
    /^enum InspectionCondition[[:space:]]*\{/ {inside=1; next}
    inside && /^[[:space:]]*\}/ {exit}
    inside {
      gsub(/^[[:space:]]+|[[:space:]]+$/, "")
      if ($0 != "" && $0 !~ /^\/\//) {
        print $1
        exit
      }
    }
  ' prisma/schema.prisma
)"

if [ -z "$INSPECTION_TYPE" ]; then
  fail_response "Could not detect InspectionType."
fi

if [ -z "$INSPECTION_CONDITION" ]; then
  fail_response "Could not detect InspectionCondition."
fi

echo "Inspection type      : $INSPECTION_TYPE"
echo "Inspection condition : $INSPECTION_CONDITION"

# ------------------------------------------------------
# 4. Create customer
# ------------------------------------------------------

echo
echo "===== 4. CREATE CUSTOMER ====="

CUSTOMER_BODY="$(
  RUN_ID="$RUN_ID" \
  CUSTOMER_NO="$CUSTOMER_NO" \
  node - <<'NODE'
console.log(JSON.stringify({
  customerNo: process.env.CUSTOMER_NO,
  companyName: "EuroAtlas E2E Test Customer",
  firstName: "EuroAtlas",
  lastName: "Tester",
  email: "e2e@example.com",
  phone: "+4910000000000",
  city: "Bonn",
  country: "Germany",
  notes: `Automatic local E2E test ${process.env.RUN_ID}`,
}));
NODE
)"

CUSTOMER_RESPONSE="$(
  request_json POST "$API/customers" "$CUSTOMER_BODY"
)"

CUSTOMER_ID="$(
  printf '%s' "$CUSTOMER_RESPONSE" |
  json_field id
)"

if [ -z "$CUSTOMER_ID" ]; then
  fail_response "Customer creation failed." "$CUSTOMER_RESPONSE"
fi

echo "✅ Customer created: $CUSTOMER_ID"

# ------------------------------------------------------
# 5. Create shipment
# ------------------------------------------------------

echo
echo "===== 5. CREATE SHIPMENT ====="

SHIPMENT_BODY="$(
  RUN_ID="$RUN_ID" \
  SHIPMENT_NO="$SHIPMENT_NO" \
  CUSTOMER_ID="$CUSTOMER_ID" \
  node - <<'NODE'
console.log(JSON.stringify({
  shipmentNo: process.env.SHIPMENT_NO,
  customerId: process.env.CUSTOMER_ID,
  originCountry: "Germany",
  originCity: "Hamburg",
  originPort: "Hamburg",
  destinationCountry: "Libya",
  destinationCity: "Tripoli",
  destinationPort: "Tripoli",
  bookingReference: `BOOK-${process.env.RUN_ID}`,
  shippingLine: "EuroAtlas E2E Shipping",
  description: "Permanent local EuroAtlas E2E workflow",
  notes: "Synthetic automated E2E shipment",
}));
NODE
)"

SHIPMENT_RESPONSE="$(
  request_json POST "$API/shipments" "$SHIPMENT_BODY"
)"

SHIPMENT_ID="$(
  printf '%s' "$SHIPMENT_RESPONSE" |
  json_field id
)"

if [ -z "$SHIPMENT_ID" ]; then
  fail_response "Shipment creation failed." "$SHIPMENT_RESPONSE"
fi

echo "✅ Shipment created: $SHIPMENT_ID"

# ------------------------------------------------------
# 6. Create vehicle
# ------------------------------------------------------

echo
echo "===== 6. CREATE VEHICLE ====="

VEHICLE_BODY="$(
  SHIPMENT_ID="$SHIPMENT_ID" \
  VIN="$VIN" \
  node - <<'NODE'
console.log(JSON.stringify({
  shipmentId: process.env.SHIPMENT_ID,
  vin: process.env.VIN,
  make: "Toyota",
  model: "Land Cruiser",
  year: 2024,
  color: "White",
  vehicleType: "SUV",
  fuelType: "Petrol",
  transmission: "Automatic",
  hasKeys: true,
  isRunning: true,
  hasDamage: false,
}));
NODE
)"

VEHICLE_RESPONSE="$(
  request_json POST "$API/vehicles" "$VEHICLE_BODY"
)"

VEHICLE_ID="$(
  printf '%s' "$VEHICLE_RESPONSE" |
  json_field id
)"

if [ -z "$VEHICLE_ID" ]; then
  fail_response "Vehicle creation failed." "$VEHICLE_RESPONSE"
fi

echo "✅ Vehicle created: $VEHICLE_ID"

# ------------------------------------------------------
# 7. Create completed inspection
# ------------------------------------------------------

echo
echo "===== 7. CREATE COMPLETED INSPECTION ====="

INSPECTION_BODY="$(
  VEHICLE_ID="$VEHICLE_ID" \
  INSPECTION_TYPE="$INSPECTION_TYPE" \
  INSPECTION_CONDITION="$INSPECTION_CONDITION" \
  node - <<'NODE'
console.log(JSON.stringify({
  vehicleId: process.env.VEHICLE_ID,
  type: process.env.INSPECTION_TYPE,
  status: "COMPLETED",
  condition: process.env.INSPECTION_CONDITION,
  inspectionDate: new Date().toISOString(),
  location: "Hamburg Port, Germany",
  inspectorName: "EuroAtlas E2E Inspector",
  odometer: 15000,
  fuelLevel: 60,
  hasKeys: true,
  isRunning: true,
  hasVisibleDamage: false,
  summary: "Vehicle passed permanent local E2E inspection.",
}));
NODE
)"

INSPECTION_RESPONSE="$(
  request_json \
    POST \
    "$API/vehicle-inspections" \
    "$INSPECTION_BODY"
)"

INSPECTION_ID="$(
  printf '%s' "$INSPECTION_RESPONSE" |
  json_field id
)"

if [ -z "$INSPECTION_ID" ]; then
  fail_response \
    "Inspection creation failed." \
    "$INSPECTION_RESPONSE"
fi

echo "✅ Inspection created: $INSPECTION_ID"

# ------------------------------------------------------
# 8. Approve inspection
# ------------------------------------------------------

echo
echo "===== 8. APPROVE INSPECTION ====="

APPROVAL_RESPONSE="$(
  request_json \
    PATCH \
    "$API/vehicle-inspections/$INSPECTION_ID/approve" \
    '{"note":"Approved by permanent local E2E test."}'
)"

APPROVAL_STATUS="$(
  printf '%s' "$APPROVAL_RESPONSE" |
  json_field approvalStatus
)"

if [ "$APPROVAL_STATUS" != "APPROVED" ]; then
  fail_response \
    "Inspection approval failed." \
    "$APPROVAL_RESPONSE"
fi

echo "✅ Inspection approved."

# ------------------------------------------------------
# 9. Generate tiny valid PNG
# ------------------------------------------------------

echo
echo "===== 9. CREATE VALID TEST DOCUMENT ====="

printf '%s' \
'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=' \
| base64 --decode \
> "$TEST_DOCUMENT"

if [ ! -s "$TEST_DOCUMENT" ]; then
  fail_response "Could not generate PNG test document."
fi

file "$TEST_DOCUMENT"

# ------------------------------------------------------
# 10. Upload document
# ------------------------------------------------------

echo
echo "===== 10. UPLOAD DOCUMENT ====="

DOCUMENT_RESPONSE="$(
  curl -sS \
    --connect-timeout 5 \
    --max-time 30 \
    -X POST \
    -H "$AUTH" \
    -F "file=@$TEST_DOCUMENT;type=image/png" \
    -F "title=E2E Commercial Invoice" \
    -F "category=COMMERCIAL_INVOICE" \
    -F "description=Permanent local E2E test document" \
    "$API/documents/shipment/$SHIPMENT_ID"
)"

DOCUMENT_ID="$(
  printf '%s' "$DOCUMENT_RESPONSE" |
  json_field id
)"

if [ -z "$DOCUMENT_ID" ]; then
  fail_response \
    "Document upload failed." \
    "$DOCUMENT_RESPONSE"
fi

echo "✅ Document uploaded: $DOCUMENT_ID"

# ------------------------------------------------------
# 11. Readiness
# ------------------------------------------------------

echo
echo "===== 11. SHIPMENT READINESS ====="

READINESS="$(
  curl -sS \
    --connect-timeout 5 \
    --max-time 20 \
    -H "$AUTH" \
    "$API/shipments/$SHIPMENT_ID/readiness"
)"

printf '%s' "$READINESS" | print_json

IS_READY="$(
  printf '%s' "$READINESS" |
  json_field isReady
)"

READINESS_PERCENT="$(
  printf '%s' "$READINESS" |
  json_field readinessPercentage
)"

if [ "$IS_READY" != "true" ]; then
  fail_response \
    "Shipment readiness did not pass." \
    "$READINESS"
fi

echo "✅ Shipment is ready."
echo "Readiness: ${READINESS_PERCENT:-unknown}%"

# ------------------------------------------------------
# 12. DRAFT -> QUOTED
# ------------------------------------------------------

echo
echo "===== 12. DRAFT -> QUOTED ====="

R="$(
  request_json \
    PATCH \
    "$API/shipments/$SHIPMENT_ID" \
    '{"status":"QUOTED"}'
)"

assert_status "QUOTED" "$R"

# ------------------------------------------------------
# 13. QUOTED -> BOOKED
# ------------------------------------------------------

echo
echo "===== 13. QUOTED -> BOOKED ====="

R="$(
  request_json \
    PATCH \
    "$API/shipments/$SHIPMENT_ID" \
    '{"status":"BOOKED"}'
)"

assert_status "BOOKED" "$R"

# ------------------------------------------------------
# 14. BOOKED -> RECEIVED
# ------------------------------------------------------

echo
echo "===== 14. BOOKED -> RECEIVED ====="

R="$(
  request_json \
    PATCH \
    "$API/shipments/$SHIPMENT_ID" \
    '{"status":"RECEIVED"}'
)"

assert_status "RECEIVED" "$R"

# ------------------------------------------------------
# 15. RECEIVED -> LOADED
# ------------------------------------------------------

echo
echo "===== 15. RECEIVED -> LOADED ====="

R="$(
  request_json \
    POST \
    "$API/shipments/$SHIPMENT_ID/dispatch" \
    '{
      "status":"LOADED",
      "location":"Hamburg Port, Germany",
      "dispatchedBy":"EuroAtlas E2E"
    }'
)"

assert_status "LOADED" "$R"

# ------------------------------------------------------
# 16. LOADED -> IN_TRANSIT
# ------------------------------------------------------

echo
echo "===== 16. LOADED -> IN_TRANSIT ====="

R="$(
  request_json \
    POST \
    "$API/shipments/$SHIPMENT_ID/dispatch" \
    '{
      "status":"IN_TRANSIT",
      "location":"Hamburg Port, Germany",
      "dispatchedBy":"EuroAtlas E2E"
    }'
)"

assert_status "IN_TRANSIT" "$R"

# ------------------------------------------------------
# 17. IN_TRANSIT -> ARRIVED
# ------------------------------------------------------

echo
echo "===== 17. IN_TRANSIT -> ARRIVED ====="

R="$(
  request_json \
    POST \
    "$API/shipments/$SHIPMENT_ID/arrival" \
    '{
      "location":"Tripoli Port, Libya",
      "receivedBy":"EuroAtlas E2E"
    }'
)"

assert_status "ARRIVED" "$R"

# ------------------------------------------------------
# 18. ARRIVED -> CUSTOMS_CLEARANCE
# ------------------------------------------------------

echo
echo "===== 18. ARRIVED -> CUSTOMS_CLEARANCE ====="

R="$(
  request_json \
    POST \
    "$API/shipments/$SHIPMENT_ID/customs-clearance" \
    '{
      "location":"Tripoli Customs Terminal, Libya",
      "handledBy":"EuroAtlas E2E",
      "customsReference":"CUS-E2E"
    }'
)"

assert_status "CUSTOMS_CLEARANCE" "$R"

# ------------------------------------------------------
# 19. CUSTOMS_CLEARANCE -> READY_FOR_DELIVERY
# ------------------------------------------------------

echo
echo "===== 19. CUSTOMS_CLEARANCE -> READY_FOR_DELIVERY ====="

R="$(
  request_json \
    POST \
    "$API/shipments/$SHIPMENT_ID/ready-for-delivery" \
    '{
      "location":"Tripoli Delivery Yard, Libya",
      "releasedBy":"EuroAtlas E2E",
      "releaseReference":"REL-E2E"
    }'
)"

assert_status "READY_FOR_DELIVERY" "$R"

# ------------------------------------------------------
# 20. READY_FOR_DELIVERY -> DELIVERED
# ------------------------------------------------------

echo
echo "===== 20. READY_FOR_DELIVERY -> DELIVERED ====="

R="$(
  request_json \
    POST \
    "$API/shipments/$SHIPMENT_ID/delivery" \
    '{
      "location":"Tripoli Customer Delivery Point, Libya",
      "deliveredTo":"EuroAtlas E2E Customer",
      "proofReference":"POD-E2E"
    }'
)"

assert_status "DELIVERED" "$R"

# ------------------------------------------------------
# 21. Verify authenticated shipment
# ------------------------------------------------------

echo
echo "===== 21. VERIFY FINAL AUTHENTICATED SHIPMENT ====="

FINAL="$(
  curl -sS \
    --connect-timeout 5 \
    --max-time 20 \
    -H "$AUTH" \
    "$API/shipments/$SHIPMENT_ID"
)"

FINAL_STATUS="$(
  printf '%s' "$FINAL" |
  get_shipment_status
)"

if [ "$FINAL_STATUS" != "DELIVERED" ]; then
  fail_response \
    "Final authenticated status is not DELIVERED." \
    "$FINAL"
fi

echo "✅ Authenticated shipment is DELIVERED."

# ------------------------------------------------------
# 22. Verify public tracking
# ------------------------------------------------------

echo
echo "===== 22. VERIFY PUBLIC TRACKING ====="

PUBLIC="$(
  curl -sS \
    --connect-timeout 5 \
    --max-time 20 \
    "$API/tracking/public/$SHIPMENT_NO"
)"

PUBLIC_STATUS="$(
  printf '%s' "$PUBLIC" |
  get_shipment_status
)"

TRACKING_COUNT="$(
  printf '%s' "$PUBLIC" |
  tracking_count
)"

if [ "$PUBLIC_STATUS" != "DELIVERED" ]; then
  fail_response \
    "Public tracking status is not DELIVERED." \
    "$PUBLIC"
fi

if [ "$TRACKING_COUNT" -lt 5 ]; then
  fail_response \
    "Tracking history contains too few events." \
    "$PUBLIC"
fi

echo "✅ Public tracking is DELIVERED."
echo "✅ Tracking events: $TRACKING_COUNT"

# ------------------------------------------------------
# Final result
# ------------------------------------------------------

echo
echo "======================================================"
echo " PERMANENT LOCAL E2E TEST PASSED"
echo "======================================================"
echo
echo "Shipment No    : $SHIPMENT_NO"
echo "Shipment ID    : $SHIPMENT_ID"
echo "Final status   : $FINAL_STATUS"
echo "Public status  : $PUBLIC_STATUS"
echo "Tracking events: $TRACKING_COUNT"
echo "Readiness      : ${READINESS_PERCENT:-unknown}%"
echo
echo "✅ Customer workflow passed."
echo "✅ Shipment workflow passed."
echo "✅ Vehicle workflow passed."
echo "✅ Inspection workflow passed."
echo "✅ Document workflow passed."
echo "✅ Readiness passed."
echo "✅ Cargo status lifecycle passed."
echo "✅ Public tracking passed."
echo
echo "Cleanup will now run automatically."
echo "======================================================"
