#!/usr/bin/env bash

set -euo pipefail

PASS_COUNT=0
WARN_COUNT=0

pass() {
  echo "✅ $1"
  PASS_COUNT=$((PASS_COUNT + 1))
}

warn() {
  echo "⚠️  $1"
  WARN_COUNT=$((WARN_COUNT + 1))
}

fail() {
  echo "❌ $1"
  exit 1
}

echo "======================================"
echo " EuroAtlas Server Deployment Preflight"
echo "======================================"

echo
echo "===== OPERATING SYSTEM ====="

OS="$(uname -s)"

if [[ "$OS" != "Linux" ]]; then
  fail "Production server must run Linux. Detected: $OS"
fi

pass "Linux operating system detected"

echo
echo "===== ARCHITECTURE ====="

ARCH="$(uname -m)"

case "$ARCH" in
  x86_64|amd64|aarch64|arm64)
    pass "Supported architecture: $ARCH"
    ;;
  *)
    fail "Unsupported architecture: $ARCH"
    ;;
esac

echo
echo "===== USER ====="

CURRENT_USER="$(id -un)"

echo "Current user: $CURRENT_USER"

if [[ "$CURRENT_USER" == "root" ]]; then
  warn "Running deployment directly as root is not recommended"
else
  pass "Non-root deployment user detected"
fi

echo
echo "===== REQUIRED COMMANDS ====="

REQUIRED_COMMANDS=(
  docker
  git
  curl
  openssl
  gzip
  tar
)

for command in "${REQUIRED_COMMANDS[@]}"; do
  if command -v "$command" >/dev/null 2>&1; then
    pass "$command available"
  else
    fail "$command is required but not installed"
  fi
done

echo
echo "===== DOCKER ====="

docker --version

if docker info >/dev/null 2>&1; then
  pass "Docker daemon reachable"
else
  fail "Docker daemon is not reachable"
fi

if docker compose version >/dev/null 2>&1; then
  docker compose version
  pass "Docker Compose available"
else
  fail "Docker Compose plugin is not available"
fi

echo
echo "===== DISK ====="

AVAILABLE_KB="$(
  df -Pk / \
    | awk 'NR==2 {print $4}'
)"

AVAILABLE_GB=$((AVAILABLE_KB / 1024 / 1024))

echo "Available disk: ${AVAILABLE_GB} GB"

if (( AVAILABLE_GB >= 10 )); then
  pass "Disk capacity is sufficient"
else
  warn "Less than 10 GB free disk space"
fi

echo
echo "===== MEMORY ====="

if command -v free >/dev/null 2>&1; then
  MEMORY_MB="$(
    free -m \
      | awk '/^Mem:/ {print $2}'
  )"

  echo "Memory: ${MEMORY_MB} MB"

  if (( MEMORY_MB >= 2048 )); then
    pass "Memory capacity is sufficient"
  else
    warn "Less than 2048 MB RAM detected"
  fi
else
  warn "Unable to determine RAM using free"
fi

echo
echo "===== NETWORK PORTS ====="

check_port() {
  local port="$1"

  if command -v ss >/dev/null 2>&1; then
    if ss -ltn \
      | awk '{print $4}' \
      | grep -Eq "[:.]${port}$"
    then
      warn "Port ${port} is already in use"
    else
      pass "Port ${port} is available"
    fi
  else
    warn "ss command unavailable; port ${port} not checked"
  fi
}

check_port 80
check_port 443

echo
echo "===== GIT CONNECTIVITY ====="

if git ls-remote \
  https://github.com/karabubi/euroatlas-cargo-platform.git \
  HEAD \
  >/dev/null 2>&1
then
  pass "GitHub repository reachable"
else
  fail "Cannot reach GitHub repository"
fi

echo
echo "===== RELEASE TAG ====="

if git ls-remote \
  --tags \
  https://github.com/karabubi/euroatlas-cargo-platform.git \
  refs/tags/v1.0.0 \
  | grep -q .
then
  pass "Release tag v1.0.0 exists remotely"
else
  fail "Release tag v1.0.0 not found"
fi

echo
echo "======================================"
echo " SERVER PREFLIGHT COMPLETE"
echo "======================================"

echo
echo "Passed checks: $PASS_COUNT"
echo "Warnings:      $WARN_COUNT"

if (( WARN_COUNT > 0 )); then
  echo
  echo "⚠️  Server is usable but warnings should be reviewed."
else
  echo
  echo "✅ Server is ready for EuroAtlas deployment."
fi
