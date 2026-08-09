# EuroAtlas Cargo Platform
## Production Deployment Checklist

### Secrets

- [ ] `deploy/production.env` exists only on the production server.
- [ ] `POSTGRES_PASSWORD` is strong and unique.
- [ ] `JWT_SECRET` is long, random, and unique.
- [ ] No `.env` secret file is committed to Git.
- [ ] GitHub repository contains no production credentials.

### Networking

- [ ] PostgreSQL is not exposed publicly.
- [ ] API is accessible only through the intended network path.
- [ ] CORS allows only the real production frontend domain.
- [ ] Public traffic uses HTTPS.

### Containers

- [ ] API runs as the non-root `node` user.
- [ ] Web runs as the non-root `node` user.
- [ ] API health check reports healthy.
- [ ] Web health check reports healthy.
- [ ] Migration container exits with status 0.
- [ ] Upload initialization exits with status 0.

### Database

- [ ] Prisma migrations complete successfully.
- [ ] Database backup has been created.
- [ ] Backup restore procedure has been tested.
- [ ] PostgreSQL volume is persistent.

### Upload storage

- [ ] Upload volume exists.
- [ ] `uploads/documents` is writable by the API user.
- [ ] `uploads/vehicle-photos` is writable by the API user.
- [ ] Upload data survives API container recreation.

### Deployment

- [ ] Production images build successfully.
- [ ] Web page returns HTTP 200.
- [ ] `/api/health` returns HTTP 200.
- [ ] Production logs contain no critical warnings.
- [ ] `pnpm verify` is green before release.

### TLS / reverse proxy

- [ ] Production domain points to the server.
- [ ] HTTPS certificate is installed.
- [ ] HTTP redirects to HTTPS.
- [ ] Reverse proxy forwards Web traffic correctly.
- [ ] Reverse proxy forwards API traffic correctly.
