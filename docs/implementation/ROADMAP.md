# Implementation roadmap

## Stage 1 — Environment inspection (complete)

Confirmed the workspace is empty apart from environment-provided hidden directories; it is not a usable Git worktree.

## Stage 2 — Architecture and product documents (complete)

Product requirements, service and data ownership, communications, security, roles, ADRs and environment-variable placeholders were created.

## Stage 3 — Architecture review (approved in principle)

Architecture direction approved in principle. Commissions/payouts, cancellations/refunds, student evidence/retention, delivery financial responsibility and production payment provider remain pending until their implementation phases.

## Stage 4 — Foundation implementation (complete)

Created an npm/Nx workspace, project tags and ESLint boundary policy, nine NestJS deployables, React/Tailwind app shell, shared wire contracts/platform utilities, health/readiness, structured logging/correlation, service-owned PostgreSQL databases and Prisma migration directories, RabbitMQ connectivity readiness, Dockerfiles and Compose volumes/health checks, and local environment initialization.

## Stage 5 — Verification (complete)

Dependency installation, source builds, lint, unit tests, PostgreSQL migrations and Compose runtime checks have run. The web app, gateway, catalogue images and core buyer/seller/admin routes have been verified locally. Compose healthchecks can still report `unhealthy` under rootless Podman even when service endpoints respond.

## Stage 6 — Identity vertical slice (complete)

Implemented customer registration, email and phone verification, login, refresh rotation, logout, password recovery, RBAC enforcement, explicit SUPER_ADMIN seeding, gateway forwarding and the React authentication/account flows.

## Stage 7 — Marketplace foundation (complete)

Implemented seller applications and approval, storefronts, catalogue and product moderation, inventory movements and reservations, multi-seller order creation, payment method records and COD support, product image streaming, demo data seeding, and a responsive buyer/seller/admin/delivery web experience. The approved design is recorded in the [SDD](../architecture/SDD.md) and [ERD](../architecture/ERD.md).

## Next delivery phases

1. Server cart, checkout saga record, order status history and target order states.
2. Provider sandbox integration, callback validation, transaction ledger, refunds and settlement decisions.
3. Fulfilment options, notifications and order tracking.
4. Reviews, disputes, admin moderation and operational reporting projections.
5. Seller analytics and expense capabilities after requirements.

Each phase requires acceptance criteria, threat review, migration/rollback plan, dashboards and tested failure cases. Production release also requires provider contracts, privacy/retention decisions, backup/recovery validation and operational ownership.
