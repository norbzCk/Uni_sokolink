# ADR-003: Service-owned PostgreSQL and RabbitMQ events

- Status: Proposed for approval
- Date: 2026-11-12

## Context

Domain workflows need independent persistence and reliable asynchronous notifications, while local development and initial operations must remain affordable.

## Decision

Each service owns an isolated PostgreSQL database and migration history; development can host them in one PostgreSQL container with separate credentials. Use RabbitMQ for asynchronous task/event delivery, with transactional outbox/inbox, publisher confirms, manual acknowledgements, idempotent consumers and dead-letter handling.

## Consequences

Operational costs include more databases/migrations and eventual consistency. RabbitMQ is not the canonical event archive and is not intended as an analytics store. Reassess broker choice if requirements shift toward durable replay, large event retention or stream analytics.
