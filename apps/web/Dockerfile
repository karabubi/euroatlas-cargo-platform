# syntax=docker/dockerfile:1

FROM node:20.19.0-bookworm-slim AS base

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

RUN pnpm install \
  --frozen-lockfile


# ------------------------------------------------------------
# Build
# ------------------------------------------------------------

FROM dependencies AS builder

ARG NEXT_PUBLIC_API_URL=http://localhost:4000/api

ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

COPY apps/web \
     ./apps/web

RUN mkdir -p \
      apps/web/public

RUN pnpm --dir apps/web build


# ------------------------------------------------------------
# Runtime
# ------------------------------------------------------------

FROM node:20.19.0-bookworm-slim AS runner

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

WORKDIR /app

COPY --from=builder \
  --chown=node:node \
  /workspace/apps/web/.next/standalone/ \
  ./

COPY --from=builder \
  --chown=node:node \
  /workspace/apps/web/.next/static \
  ./apps/web/.next/static

COPY --from=builder \
  --chown=node:node \
  /workspace/apps/web/public \
  ./apps/web/public

USER node

EXPOSE 3000

HEALTHCHECK \
  --interval=30s \
  --timeout=5s \
  --start-period=20s \
  --retries=3 \
  CMD node -e \
  "fetch('http://127.0.0.1:3000/').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

CMD ["node", "apps/web/server.js"]
