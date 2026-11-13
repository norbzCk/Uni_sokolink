# ADR-004: Provider-neutral payment boundary

- Status: Proposed for approval
- Date: 2026-11-12

## Context

The target Tanzanian market may use Vodacom M-Pesa, Airtel Money and Mixx by Yas, but access, provider APIs, commercial terms, sandbox behavior and live eligibility are not confirmed for this business.

## Decision

Create a Payment domain with provider adapters and a stable internal intent/status contract. Do not select a first production provider until the business completes provider onboarding and validates official sandbox documentation, callbacks, transaction queries, refunds and reconciliation. No frontend redirect can confirm payment.

## Evidence and consequences

Vodacom's Tanzania business onboarding material describes organization registration, Open API signup, sandbox testing and provider go-live review. Airtel has a Tanzania developer portal, but the publicly readable material does not establish the exact required collection product or approval path. No official public Mixx API/sandbox documentation was identified in this review; merchant support/onboarding inquiry is needed. Integrations may have fees and commercial prerequisites. Adapter boundaries keep this uncertainty out of commerce and checkout contracts.
