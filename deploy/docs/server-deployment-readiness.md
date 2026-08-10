# EuroAtlas Cargo — Server Deployment Readiness

## Target release

- Release: `v1.0.0`
- Deployment platform: Linux VPS
- Runtime: Docker + Docker Compose
- Reverse proxy: Caddy
- Database: PostgreSQL
- HTTPS: Automatic TLS through Caddy

## Server requirements

- Linux server
- x86_64/amd64 or ARM64 architecture
- Docker Engine installed
- Docker Compose plugin installed
- Git installed
- curl installed
- OpenSSL installed
- Minimum 2 GB RAM recommended
- Minimum 10 GB free disk recommended

## Public networking

The server must allow inbound traffic on:

- TCP 80 — HTTP
- TCP 443 — HTTPS

PostgreSQL must NOT be exposed publicly.

## DNS

Before production HTTPS deployment:

- Create an A record for the production domain.
- Point the A record to the VPS public IPv4 address.
- If IPv6 is used, configure the AAAA record correctly.
- Confirm DNS resolves to the production server.

## Deployment user

Recommended:

- Dedicated non-root deployment user.
- User belongs to Docker group.
- SSH key authentication.
- Disable password SSH login where appropriate.
- Keep application files under `/opt/euroatlas-cargo`.

## Persistent data

The following data must survive container recreation:

- PostgreSQL database volume
- Document uploads
- Vehicle photo uploads
- Caddy TLS data
- PostgreSQL backups

## Secrets

Never commit:

- Production database password
- JWT secret
- Real production `.env`
- SSH private keys
- API credentials
- TLS private keys

## Backup

Before every production upgrade:

1. Run PostgreSQL backup.
2. Verify gzip integrity.
3. Test restore periodically.
4. Store a second backup outside the VPS.

## First deployment order

1. Provision Linux VPS.
2. Create deployment user.
3. Install Docker.
4. Configure firewall.
5. Clone EuroAtlas repository.
6. Checkout approved release tag.
7. Create production environment file.
8. Validate Docker Compose configuration.
9. Start PostgreSQL.
10. Apply Prisma migrations.
11. Start API and Web containers.
12. Start Caddy.
13. Verify HTTPS.
14. Verify API health.
15. Verify login.
16. Verify persistent uploads.
17. Create first production backup.

## Production verification

Required:

- Web returns HTTP 200.
- `/api/health` returns HTTP 200.
- HTTPS certificate is valid.
- HTTP redirects to HTTPS.
- PostgreSQL is not publicly exposed.
- API and Web containers are healthy.
- Containers run as non-root users.
- Login works.
- Upload storage is writable.
- Backup succeeds.
