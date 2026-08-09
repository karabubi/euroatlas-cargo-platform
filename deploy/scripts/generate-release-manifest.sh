#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(
  cd "$(dirname "${BASH_SOURCE[0]}")/../.." &&
  pwd
)"

cd "$ROOT_DIR"

OUTPUT_DIR="${OUTPUT_DIR:-$ROOT_DIR/artifacts/release}"
OUTPUT_FILE="${OUTPUT_FILE:-$OUTPUT_DIR/release-manifest.json}"

mkdir -p "$OUTPUT_DIR"

echo "======================================"
echo " EuroAtlas Release Manifest Generator "
echo "======================================"

echo
echo "===== REPOSITORY ====="

GIT_SHA="$(
  git rev-parse HEAD
)"

GIT_SHORT_SHA="$(
  git rev-parse --short=12 HEAD
)"

GIT_BRANCH="$(
  git branch --show-current
)"

if [[ -n "$(git status --porcelain)" ]]; then
  GIT_DIRTY=true
else
  GIT_DIRTY=false
fi

echo "Commit: $GIT_SHA"
echo "Branch: $GIT_BRANCH"
echo "Dirty:  $GIT_DIRTY"

echo
echo "===== APPLICATION ====="

APP_VERSION="$(
  node -p \
    "require('./package.json').version"
)"

echo "Version: $APP_VERSION"

echo
echo "===== TOOLCHAIN ====="

NODE_VERSION="$(
  node --version
)"

PNPM_VERSION="$(
  pnpm --version
)"

echo "Node: $NODE_VERSION"
echo "pnpm: $PNPM_VERSION"

echo
echo "===== DATABASE ====="

MIGRATION_COUNT="$(
  find apps/api/prisma/migrations \
    -mindepth 1 \
    -maxdepth 1 \
    -type d \
    | wc -l \
    | tr -d ' '
)"

echo "Prisma migrations: $MIGRATION_COUNT"

echo
echo "===== RELEASE CHECK ====="

if [[ "$GIT_DIRTY" == "true" ]]; then
  RELEASE_READY=false
  echo "⚠️ Working tree is dirty."
else
  RELEASE_READY=true
  echo "✅ Working tree is clean."
fi

if [[ -n "${SOURCE_DATE_EPOCH:-}" ]]; then
  if date -u \
    -r "$SOURCE_DATE_EPOCH" \
    '+%Y-%m-%dT%H:%M:%SZ' \
    >/dev/null 2>&1
  then
    BUILD_TIME="$(
      date -u \
        -r "$SOURCE_DATE_EPOCH" \
        '+%Y-%m-%dT%H:%M:%SZ'
    )"
  else
    BUILD_TIME="$(
      date -u \
        -d "@$SOURCE_DATE_EPOCH" \
        '+%Y-%m-%dT%H:%M:%SZ'
    )"
  fi
else
  BUILD_TIME="$(
    date -u '+%Y-%m-%dT%H:%M:%SZ'
  )"
fi

API_IMAGE="euroatlas-cargo-api:${APP_VERSION}-${GIT_SHORT_SHA}"
WEB_IMAGE="euroatlas-cargo-web:${APP_VERSION}-${GIT_SHORT_SHA}"

export \
  APP_VERSION \
  GIT_SHA \
  GIT_SHORT_SHA \
  GIT_BRANCH \
  GIT_DIRTY \
  NODE_VERSION \
  PNPM_VERSION \
  MIGRATION_COUNT \
  RELEASE_READY \
  BUILD_TIME \
  API_IMAGE \
  WEB_IMAGE \
  OUTPUT_FILE

node <<'NODE'
const fs = require('fs');
const path = require('path');

const manifest = {
  schemaVersion: 1,

  application: {
    name: 'euroatlas-cargo-platform',
    version: process.env.APP_VERSION,
  },

  source: {
    commit: process.env.GIT_SHA,
    shortCommit: process.env.GIT_SHORT_SHA,
    branch: process.env.GIT_BRANCH,
    dirty: process.env.GIT_DIRTY === 'true',
  },

  build: {
    createdAt: process.env.BUILD_TIME,

    toolchain: {
      node: process.env.NODE_VERSION,
      pnpm: process.env.PNPM_VERSION,
    },
  },

  database: {
    prismaMigrationCount:
      Number(process.env.MIGRATION_COUNT),
  },

  images: {
    api: process.env.API_IMAGE,
    web: process.env.WEB_IMAGE,
  },

  verification: {
    workingTreeClean:
      process.env.GIT_DIRTY !== 'true',

    releaseReady:
      process.env.RELEASE_READY === 'true',
  },
};

const output = process.env.OUTPUT_FILE;

fs.mkdirSync(
  path.dirname(output),
  {
    recursive: true,
  },
);

fs.writeFileSync(
  output,
  JSON.stringify(manifest, null, 2) + '\n',
);

console.log();
console.log('✅ Release manifest generated:');
console.log(output);
NODE
