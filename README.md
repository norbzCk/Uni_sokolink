# SokoLink

SokoLink is a student-centred multi-vendor marketplace and business operations platform, initially serving IFM students in Dar es Salaam. The product is intended to help student entrepreneurs run storefronts and operations while giving customers a trusted way to discover, order and pay.

## Project status

The architecture and technical foundation are present. Phase One identity and access management is implemented: customer registration, email and phone verification, login, refresh-token rotation, password recovery, role/permission enforcement, SUPER_ADMIN seeding, gateway forwarding and account pages. The marketplace, seller application, catalogue, ordering, payment and delivery workflows are not implemented yet. Provider choice, commissions/payouts, refund policy, student evidence/retention, and delivery pricing remain pending decisions.

See [the Phase One implementation record](docs/implementation/PHASE_ONE_IDENTITY.md) for routes, security decisions, operational commands and the current verification limits.

## Architecture at a glance

The proposed backend uses independently deployable NestJS services, a React/TypeScript/Tailwind web app, PostgreSQL with one database per service, RabbitMQ for asynchronous events, REST/OpenAPI for synchronous APIs, and Nx to enforce monorepo boundaries. See [the architecture](docs/architecture/ARCHITECTURE.md), [service boundaries](docs/architecture/SERVICE_BOUNDARIES.md), and [roadmap](docs/implementation/ROADMAP.md).

## Local development

Requirements: Node.js 22, npm 10, and Docker Engine with the Compose plugin. From the repository root:

```sh
npm run env:init
npm install
docker compose up --build -d
```

The first command creates an ignored `.env` with unique, local-only secrets. It refuses to overwrite an existing `.env`. `npm install` requires access to the npm registry. Compose builds the service and frontend images and starts the complete environment.

Check state and stop the environment:

```sh
docker compose ps
docker compose logs -f
docker compose down
```

`docker compose down` keeps PostgreSQL and RabbitMQ data volumes. `docker compose down -v` removes the local data volumes. Run an individual app outside containers against Compose infrastructure with `npm run dev`; stop it with Ctrl+C. Build, lint and test with `npm run build`, `npm run lint` and `npm test`.

Database schemas are isolated by service. Add reviewed migrations under that service's `apps/<service>/prisma` directory, then apply one with `npm run db:migrate:<service>` while Compose PostgreSQL is running. The identity service has the Phase One migration. After migration and environment setup, create the first administrator explicitly with `npm run auth:seed-super-admin`; the command requires the `SUPER_ADMIN_*` values in `.env` and refuses to overwrite an existing account.

In development, verification email and SMS messages are written to `/tmp/sokolink-mail` and `/tmp/sokolink-sms` unless SMTP or an SMS provider is configured. Production requires real delivery adapters.

## Local endpoints

The web app is at `http://localhost:5173`; the gateway is at `http://localhost:3000/api/v1`, health at `/health`, readiness at `/ready`, and OpenAPI UI at `http://localhost:3000/api/docs`. Identity routes are under `/api/v1/auth` and are proxied to the identity service by the gateway. Service ports are identity 3101, seller 3102, catalogue 3103, inventory 3104, commerce 3105, payment 3106, fulfilment 3107, notifications 3108. PostgreSQL is 5432, RabbitMQ AMQP 5672 and RabbitMQ management 15672.

## Decisions and open points

ADRs are in [docs/architecture/ADR](docs/architecture/ADR/). Payment providers are behind an adapter boundary; provider onboarding, commercial terms and production approval remain prerequisites. IFM eligibility verification is initially manual and makes no assumption of an institutional API.
