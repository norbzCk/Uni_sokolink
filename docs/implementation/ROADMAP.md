# Implementation roadmap

## Stage 1 — Environment inspection (complete)

Confirmed the workspace is empty apart from environment-provided hidden directories; it is not a usable Git worktree.

## Stage 2 — Architecture and product documents (complete)

Product requirements, service and data ownership, communications, security, roles, ADRs and environment-variable placeholders were created.

## Stage 3 — Architecture review (approved in principle)

Architecture direction approved in principle. Commissions/payouts, cancellations/refunds, student evidence/retention, delivery financial responsibility and production payment provider remain pending until their implementation phases.

## Stage 4 — Foundation implementation (created; runtime verification pending)

Created an npm/Nx workspace, project tags and ESLint boundary policy, nine NestJS deployables, React/Tailwind app shell, shared wire contracts/platform utilities, health/readiness, structured logging/correlation, service-owned PostgreSQL databases and Prisma migration directories, RabbitMQ connectivity readiness, Dockerfiles and Compose volumes/health checks, and local environment initialization. Authentication, gateway forwarding, domain events/outbox implementations and business workflows remain future work.

## Stage 5 — Verification (blocked by this execution environment)

Attempted dependency installation and container runtime discovery. npm registry DNS is unavailable and Podman cannot create its required user namespace, so dependency-based builds/tests and Compose health/database/broker/browser checks could not run. Re-run these validations in a network-enabled Docker environment before starting Phase One.

## Stage 6 — First vertical slice

Recommended: account registration/login and verification foundation, followed by seller application and explicit admin approval. Then publish a minimal storefront/product and browse it. This validates account role transitions and domain boundaries before payment or multi-vendor order complexity.

## Later delivery phases

1. Catalogue discovery, search and image storage.
2. Inventory movements and reservations.
3. Cart, multi-seller checkout and order saga.
4. Provider sandbox integration, callback validation, reconciliation, refunds and settlement decisions.
5. Fulfilment options, notifications and order tracking.
6. Seller analytics, expense capabilities after requirements, moderation and operational reporting.

Each phase requires acceptance criteria, threat review, migration/rollback plan, dashboards and tested failure cases. Production release also requires provider contracts, privacy/retention decisions, backup/recovery validation and operational ownership.
