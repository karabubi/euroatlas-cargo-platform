#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(
  cd "$(dirname "${BASH_SOURCE[0]}")/../.." &&
  pwd
)"

cd "$ROOT_DIR"

if [[ "${1:-}" == "--" ]]; then
  shift
fi

TAG="${1:-}"

if [[ -z "$TAG" ]]; then
  echo "Usage:"
  echo "  $0 v<major>.<minor>.<patch>"
  echo
  echo "Example:"
  echo "  $0 v1.0.0"
  exit 1
fi

VERSION="$(
  node -p \
    "require('./package.json').version"
)"

EXPECTED_TAG="v${VERSION}"

echo "======================================"
echo " EuroAtlas Release Tag Validation "
echo "======================================"

echo
echo "Package version: $VERSION"
echo "Requested tag:   $TAG"
echo "Expected tag:    $EXPECTED_TAG"

if [[ ! "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo
  echo "❌ package.json version is not valid SemVer."
  exit 1
fi

if [[ ! "$TAG" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo
  echo "❌ Release tag is not valid."
  echo "Expected format: v1.2.3"
  exit 1
fi

if [[ "$TAG" != "$EXPECTED_TAG" ]]; then
  echo
  echo "❌ Tag does not match package version."
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo
  echo "❌ Working tree is not clean."
  git status --short
  exit 1
fi

if git rev-parse "$TAG" >/dev/null 2>&1; then
  EXISTING_COMMIT="$(
    git rev-list -n 1 "$TAG"
  )"

  CURRENT_COMMIT="$(
    git rev-parse HEAD
  )"

  if [[ "$EXISTING_COMMIT" != "$CURRENT_COMMIT" ]]; then
    echo
    echo "❌ Tag already exists on another commit."
    echo "Existing: $EXISTING_COMMIT"
    echo "Current:  $CURRENT_COMMIT"
    exit 1
  fi

  echo
  echo "ℹ️ Tag already exists on current commit."
fi

echo
echo "✅ Release tag is valid."
