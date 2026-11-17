# ADR-006: Retain the current microservice topology for the MVP

- Status: Accepted
- Date: 2026-11-17
- Supersedes: SRS section 6 recommendation of a modular monolith
- Related: [SDD](../SDD.md), [ERD](../ERD.md), ADR-002, ADR-003

## Context

The SokoLink SRS recommends a modular monolith for the MVP to reduce operational overhead. The repository already contains nine independently runnable NestJS deployables with service-owned PostgreSQL databases, REST contracts and RabbitMQ wiring. The domain boundaries are explicit and the core marketplace slices, including identity, seller, catalogue, inventory, commerce and payment, are implemented as separate services.

The engineering decision for the current baseline is to retain the existing microservice topology rather than rewrite or collapse it into a monolith.

## Decision

Keep the current service-oriented architecture for the MVP:

- API gateway plus independently runnable domain services.
- One PostgreSQL database per service and no shared application tables.
- Synchronous REST for decisions needed in the current request.
- RabbitMQ events for asynchronous facts and projections.
- Administration and analytics remain logical boundaries using owning-service APIs and event-fed projections.

The service boundaries and data ownership rules in the SRS remain authoritative. The modular-monolith recommendation is not adopted for this baseline.

## Rationale

- The existing implementation and deployment assets already follow service boundaries.
- Collapsing services would add migration risk without improving MVP functionality.
- Domain ownership is easier to enforce when each service owns its database and API.
- The team can scale catalogue reads, checkout writes and payment callbacks independently.
- The cost of the current topology is manageable for the MVP if service count is not expanded further.

## Consequences

- The team must invest in correlation IDs, contract tests, migrations, queue monitoring, reconciliation and failure-path testing.
- Cross-service consistency relies on sagas, outbox/inbox patterns and reconciliation rather than database transactions.
- Local development requires Compose and multiple service processes.
- New domains should not become services unless they have a distinct data/lifecycle/operational need.
- The SRS must be read as recommending a monolith while this ADR records the approved deviation.
- Revisit this decision if operational overhead or consistency incidents outweigh the ownership benefits.

## Rejected alternative

**Rewrite as a modular monolith.** Rejected for the MVP because it would discard working service boundaries and increase delivery risk. A future consolidation remains possible if service operations become disproportionate to product scale.

## Follow-up actions

- Use the [SDD](../SDD.md) and [ERD](../ERD.md) as the implementation baseline.
- Add outbox/inbox and reconciliation coverage to services that do not yet have it.
- Keep cross-service references logical and documented.
- Do not introduce cross-database joins or shared application tables.
