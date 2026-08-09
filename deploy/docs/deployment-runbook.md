# EuroAtlas Cargo Platform
## Production Deployment Runbook

### 1. Requirements

Production server requirements:

- Docker Engine and Docker Compose
- DNS pointing the production domain to the server
- TCP ports 80 and 443 publicly reachable
- persistent disk storage for PostgreSQL and uploads

### 2. Production environment

Create:

    deploy/production.env

from:

    deploy/production.env.example

Never commit `deploy/production.env`.

Required production variables include:

- POSTGRES_USER
- POSTGRES_PASSWORD
- POSTGRES_DB
- JWT_SECRET
- CORS_ORIGIN
- NEXT_PUBLIC_API_URL
- DOMAIN
- ACME_EMAIL

Example production values:

    CORS_ORIGIN=https://cargo.example.com
    NEXT_PUBLIC_API_URL=https://cargo.example.com/api
    DOMAIN=cargo.example.com

Replace `cargo.example.com` with the real production domain.

### 3. Validate configuration

    docker compose \
      --env-file deploy/production.env \
      -f docker-compose.production.yml \
      -f deploy/docker-compose.proxy.yml \
      config

### 4. Build

    docker compose \
      --env-file deploy/production.env \
      -f docker-compose.production.yml \
      -f deploy/docker-compose.proxy.yml \
      build

### 5. Start

    docker compose \
      --env-file deploy/production.env \
      -f docker-compose.production.yml \
      -f deploy/docker-compose.proxy.yml \
      up -d

### 6. Status

    docker compose \
      --env-file deploy/production.env \
      -f docker-compose.production.yml \
      -f deploy/docker-compose.proxy.yml \
      ps -a

Expected state:

- PostgreSQL: healthy
- API: healthy
- Web: healthy
- Proxy: running
- migrate: exited 0
- uploads-init: exited 0

### 7. Health checks

    curl -I https://YOUR_REAL_DOMAIN

    curl -i https://YOUR_REAL_DOMAIN/api/health

### 8. Backup

    ENV_FILE=deploy/production.env \
    deploy/scripts/backup-postgres.sh

### 9. Test backup restoration

    ENV_FILE=deploy/production.env \
    deploy/scripts/test-restore-postgres.sh \
    backups/postgres/YOUR_BACKUP.sql.gz

### 10. Security audit

    ENV_FILE=deploy/production.env \
    deploy/scripts/security-check.sh

### 11. Logs

    docker compose \
      --env-file deploy/production.env \
      -f docker-compose.production.yml \
      -f deploy/docker-compose.proxy.yml \
      logs --tail=200

### 12. Stop

    docker compose \
      --env-file deploy/production.env \
      -f docker-compose.production.yml \
      -f deploy/docker-compose.proxy.yml \
      down

Do not use `--volumes` during normal shutdown.

### 13. Database safety

Never use:

    docker compose down --volumes

on production unless permanent deletion of the database
and upload volumes is explicitly intended.

Always create and verify a current PostgreSQL backup before
database maintenance.
