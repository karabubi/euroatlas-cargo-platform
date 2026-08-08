# EuroAtlas Cargo Platform

EuroAtlas Cargo Platform is a full-stack cargo and vehicle shipping management system.

The platform manages customers, vehicles, shipments, inspections, documents, invoices, tracking events, and controlled shipment workflow transitions.

## Technology Stack

### Web

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS

### API

- NestJS
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT authentication

### Infrastructure

- pnpm workspaces
- Docker Compose
- GitHub Actions
- PostgreSQL 18

## Project Structure

```text
euroatlas-cargo-platform/
├── apps/
│   ├── api/
│   └── web/
├── packages/
├── .github/
│   └── workflows/
├── docker-compose.yml
├── package.json
└── pnpm-workspace.yaml
```

## Requirements

- Node.js 20.19.x
- pnpm 10.34.x
- Docker

## Installation

Install dependencies:

```bash
pnpm install
```

## Environment Configuration

Copy the example configuration:

```bash
cp .env.example .env
```

Application-specific local environment files may also be required.

Never commit real passwords, API keys, JWT secrets, or production credentials.

## Database

Start PostgreSQL:

```bash
docker compose up -d
```

Generate the Prisma client:

```bash
pnpm --dir apps/api exec prisma generate
```

Apply migrations:

```bash
pnpm --dir apps/api exec prisma migrate deploy
```

## Development

Run the API:

```bash
pnpm dev:api
```

Run the web application:

```bash
pnpm dev:web
```

Run both:

```bash
pnpm dev
```

Default local URLs:

```text
Web: http://localhost:3000
API: http://localhost:4000/api
```

## Verification

Run the complete monorepo verification:

```bash
pnpm verify
```

The verification process covers:

- API unit tests
- API HTTP E2E tests
- database-backed workflow integration tests
- API TypeScript
- API ESLint
- API production build
- Web TypeScript
- Web ESLint
- Web production build

## Shipment Workflow

The controlled shipment workflow includes:

```text
DRAFT
→ QUOTED
→ BOOKED
→ RECEIVED
→ LOADED
→ IN_TRANSIT
→ ARRIVED
→ CUSTOMS_CLEARANCE
→ READY_FOR_DELIVERY
→ DELIVERED
```

A shipment can also transition to:

```text
CANCELLED
```

according to the workflow state machine.

Generic shipment and tracking APIs are protected against bypassing controlled workflow transitions.

## Continuous Integration

GitHub Actions workflows:

```text
.github/workflows/api-ci.yml
.github/workflows/web-ci.yml
```

The API CI workflow uses an isolated PostgreSQL test database:

```text
euroatlas_cargo_test
```

## Database Integration Safety

The database integration test runner refuses to execute unless the selected database is exactly:

```text
euroatlas_cargo_test
```

Run database integration tests with:

```bash
pnpm --dir apps/api run test:db
```

## License

A license has not yet been selected.
