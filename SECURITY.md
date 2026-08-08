# Security Policy

## Supported Version

EuroAtlas Cargo Platform is currently under active development.

Security fixes are applied to the current development version.

## Reporting a Vulnerability

Do not publish sensitive security vulnerabilities in a public issue.

When private security reporting is available, use it.

Until then, report security findings directly to the project maintainer through
a private communication channel.

Please include:

- affected component
- reproduction steps
- expected behavior
- observed behavior
- potential impact

Do not include real passwords, API keys, access tokens, customer information,
or production database credentials.

## Secrets

Production credentials must never be committed to Git.

Local `.env` files are intentionally ignored.

`.env.example` contains placeholder values only.

Credentials embedded in CI service definitions are disposable test-only values
used exclusively with the isolated `euroatlas_cargo_test` database.

## Database Test Safety

Database-backed integration tests are allowed to run only against:

euroatlas_cargo_test

The test runner refuses other database names to reduce the risk of modifying
development or production data.
