# syntax=docker/dockerfile:1

FROM node:20.19.0-bookworm-slim AS base

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    ca-certificates \
    openssl \
  && rm -rf /var/lib/apt/lists/*

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable \
  && corepack prepare pnpm@10.34.5 --activate

WORKDIR /workspace


# ------------------------------------------------------------
# Dependencies
# ------------------------------------------------------------

FROM base AS dependencies

COPY package.json \
     pnpm-lock.yaml \
     pnpm-workspace.yaml \
     ./

COPY apps/api/package.json \
     ./apps/api/package.json

COPY apps/web/package.json \
     ./apps/web/package.json

COPY packages \
     ./packages

RUN pnpm install \
  --frozen-lockfile


# ------------------------------------------------------------
# Build
# ------------------------------------------------------------

FROM dependencies AS builder

COPY apps/api \
     ./apps/api

RUN pnpm --dir apps/api build


# ------------------------------------------------------------
# Runtime
# ------------------------------------------------------------

FROM node:20.19.0-bookworm-slim AS runner

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    ca-certificates \
    openssl \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV PORT=4000

WORKDIR /app/apps/api

COPY --from=builder \
  --chown=node:node \
  /workspace/node_modules \
  /app/node_modules

COPY --from=builder \
  --chown=node:node \
  /workspace/apps/api/node_modules \
  /app/apps/api/node_modules

COPY --from=builder \
  --chown=node:node \
  /workspace/apps/api/package.json \
  /app/apps/api/package.json

COPY --from=builder \
  --chown=node:node \
  /workspace/apps/api/dist \
  /app/apps/api/dist

RUN mkdir -p \
      /app/apps/api/uploads/documents \
      /app/apps/api/uploads/vehicle-photos \
  && chown -R node:node \
      /app/apps/api/uploads

USER node

EXPOSE 4000

HEALTHCHECK \
  --interval=30s \
  --timeout=5s \
  --start-period=20s \
  --retries=3 \
  CMD node -e \
  "fetch('http://127.0.0.1:4000/api/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

CMD ["node", "dist/src/main.js"]
