# ADR-002: Domain services with selective initial deployment

- Status: Proposed for approval
- Date: 2026-11-12

## Context

The product spans identity, seller verification, catalogue, inventory, commerce, payments, fulfilment, notifications and administration. Deploying every capability as a separate process on day one increases operational cost; placing all backend logic in one application violates the required service independence.

## Decision

Define ownership for all ten domains. Keep gateway, identity, seller, catalogue, inventory, commerce, payment, fulfilment and notification as separately runnable deployables. Start administration as protected APIs and event-fed projections, promoting it to a service when its operational/team needs justify it. Preserve a separately owned fulfilment boundary even if it initially shares release automation with commerce.

## Consequences

The initial system is still distributed and requires tracing, retries, contract testing and local orchestration. Selective deployment avoids a premature analytics runtime while keeping data and module boundaries clear. Deployment co-location must never permit shared tables or bypass contracts.
