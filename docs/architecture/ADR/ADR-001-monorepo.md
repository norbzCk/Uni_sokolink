# ADR-001: Use Nx for the TypeScript monorepo

- Status: Proposed for approval
- Date: 2026-11-12

## Context

SokoLink requires multiple independently deployable NestJS services and a React application in one repository, with service ownership boundaries enforced despite shared TypeScript tooling.

## Decision

Use Nx as the monorepo orchestrator. Tag projects by type and domain, enforce allowed dependency directions with module-boundary lint rules, and use affected task execution for CI. Applications remain deployable units; shared libraries contain only stable contracts or platform utilities.

## Alternatives

- Plain pnpm workspaces: simpler and suitable initially, but task graph and boundary enforcement need more bespoke maintenance.
- Nest CLI monorepo: good for Nest applications/libraries but does not manage the React workspace as uniformly.
- Turborepo: strong task orchestration, with boundary policy requiring additional conventions/tooling.

## Consequences

Nx adds plugins, configuration and learning cost. Keep versions aligned and avoid depending on remote caching initially. In return, it gives a coherent project graph, task caching/affected execution and enforceable boundaries suited to the proposed service count. Reassess if repository scale remains small enough that the overhead is not justified.
