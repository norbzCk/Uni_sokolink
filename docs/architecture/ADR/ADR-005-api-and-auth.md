# ADR-005: REST contracts and backend-enforced authorization

- Status: Proposed for approval
- Date: 2026-11-12

## Context

Web and service clients need stable APIs, and users can hold customer capability while seeking seller approval.

## Decision

Use REST with OpenAPI contracts for synchronous calls. Use role assignments plus granular permissions and resource/state checks in each owning service. API Gateway performs routing and coarse token/rate checks; it is not the sole authorization boundary. Seller grants activate only following an explicit, audited approval decision.

## Consequences

Contracts need compatibility/versioning discipline and integration tests. Permission policy is more detailed than frontend role hiding, and service authorization remains necessary for internal calls.
