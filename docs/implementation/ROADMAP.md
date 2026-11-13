# Implementation roadmap

## Stage 1 — Environment inspection (complete)

Confirmed the workspace is empty apart from environment-provided hidden directories; it is not a usable Git worktree.

## Stage 2 — Architecture and product documents (complete)

Product requirements, service and data ownership, communications, security, roles, ADRs and environment-variable placeholders were created.

## Stage 3 — Architecture review (approved in principle)

Architecture direction approved in principle. Commissions/payouts, cancellations/refunds, student evidence/retention, delivery financial responsibility and production payment provider remain pending until their implementation phases.

## Stage 4 — Foundation implementation (complete)

Created an npm/Nx workspace, project tags and ESLint boundary policy, nine NestJS deployables, React/Tailwind app shell, shared wire contracts/platform utilities, health/readiness, structured logging/correlation, service-owned PostgreSQL databases and Prisma migration directories, RabbitMQ connectivity readiness, Dockerfiles and Compose volumes/health checks, and local environment initialization.

## Stage 5 — Verification

Dependency installation, source builds, lint and unit tests now run. The PostgreSQL migration and Compose/browser checks remain blocked because this execution environment has no PostgreSQL server, Docker Engine or Compose plugin. See [Phase One](PHASE_ONE_IDENTITY.md) for the command-level record.

## Stage 6 — Identity vertical slice (complete in source)

Implemented customer registration, email and phone verification, login, refresh rotation, logout, password recovery, RBAC enforcement, explicit SUPER_ADMIN seeding, gateway forwarding and the React authentication/account flows. Database migration execution and end-to-end gateway/browser verification require the environment checks listed above. Next vertical slice: seller application and explicit administrator approval, then a minimal storefront/product publish and browse workflow.

## Later delivery phases

1. Catalogue discovery, search and image storage.
2. Inventory movements and reservations.
3. Cart, multi-seller checkout and order saga.
4. Provider sandbox integration, callback validation, reconciliation, refunds and settlement decisions.
5. Fulfilment options, notifications and order tracking.
6. Seller analytics, expense capabilities after requirements, moderation and operational reporting.

Each phase requires acceptance criteria, threat review, migration/rollback plan, dashboards and tested failure cases. Production release also requires provider contracts, privacy/retention decisions, backup/recovery validation and operational ownership.
