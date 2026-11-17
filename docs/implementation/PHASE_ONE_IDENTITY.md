# Phase One: identity and access management

## Status

Implemented in source, built, linted and unit-tested. Database migration execution and end-to-end browser verification are blocked in the current environment because no PostgreSQL server, Docker Engine or Compose plugin is available. The migration itself is reviewed SQL under `apps/identity/prisma/migrations`.

## Scope delivered

- Customer self-registration with email and phone collection.
- Email verification through a six-digit, single-use, time-limited OTP with an attempt limit.
- Phone verification through a six-digit, single-use code with an attempt limit.
- Login by normalized email address or phone number.
- Short-lived JWT access tokens and opaque refresh tokens in an HTTP-only cookie.
- Refresh-token rotation, reuse detection and family revocation.
- Logout, current-account read and resend-verification flows.
- Password reset with session revocation.
- Role and permission model with a global authentication guard and permission guard.
- Explicitly seeded `SUPER_ADMIN`; registration can only create `CUSTOMER`.
- Gateway forwarding of `/api/v1/auth/*` to the identity service.
- React account, registration, verification, sign-in, password recovery and account pages.

## API surface

All routes are under `/api/v1` through the gateway. Public routes do not require an access token.

| Method | Route | Access | Purpose |
|---|---|---|---|
| POST | `/auth/register` | Public | Create a customer account and issue verification messages |
| POST | `/auth/login` | Public | Sign in with email or phone; sets the refresh cookie |
| POST | `/auth/refresh` | Public + cookie | Rotate the refresh session and issue an access token |
| POST | `/auth/logout` | Public + cookie | Revoke the refresh-session family and clear the cookie |
| POST | `/auth/verify-email` | Public | Verify a six-digit email OTP |
| POST | `/auth/resend-email-verification` | Public | Request another email verification message |
| POST | `/auth/forgot-password` | Public | Request a password reset message |
| POST | `/auth/reset-password` | Public | Consume a reset token, change the password and revoke sessions |
| GET | `/auth/me` | Bearer + `auth.profile.read` | Read the current account summary |
| POST | `/auth/phone/request` | Bearer + `auth.sessions.manage` | Send a phone verification code |
| POST | `/auth/phone/verify` | Bearer + `auth.sessions.manage` | Verify the account phone number |

Account enumeration is reduced by returning the same accepted response for unknown, unverified or ineligible addresses on resend and forgot-password routes. Login still uses a generic error but deliberately performs a dummy password verification for unknown accounts.

## Security decisions

- Passwords are hashed with Argon2id (`m=19456`, `t=2`, `p=1`, 32-byte hash) and checked against a 12–128 character policy that rejects names and email local parts.
- Refresh tokens are 48 random bytes, stored only as SHA-256 hashes. Rotation is atomic and a reused token revokes the whole session family. Revocation is committed before the reuse error is returned.
- Access tokens are HS256 JWTs with issuer, audience, expiry, JWT ID and a dedicated `type=access` claim. A previous signing key is supported for rotation.
- The global authentication guard reloads the account and roles on every request, rejects non-`ACTIVE` accounts and computes permissions from the current role assignments.
- Login lockout and rate limiting are persisted in the identity database. Verification resend has per-account cooldown and hourly limits.
- Email OTPs are record-bound with HMAC, single-use, limited to five attempts, and invalidated when reissued. Password-reset tokens are opaque and single-use; reset completion revokes all active refresh sessions.
- Refresh cookies are `HttpOnly`, `SameSite=Lax`, path-scoped to `/api/v1/auth`, and `Secure` when configured for production.
- Sensitive values are not returned in registration or login responses. Audit records contain hashes or identifiers rather than raw verification secrets.

## Email and SMS delivery

- With SMTP configured, verification and reset messages are sent through `nodemailer`.
- Without SMTP in development or test, messages are written to `MAIL_OUTBOX_DIR` (default `/tmp/sokolink-mail`).
- The development SMS adapter writes codes to `SMS_OUTBOX_DIR` (default `/tmp/sokolink-sms`).
- Production environment validation requires `SMTP_HOST` and `SMS_PROVIDER`; the development-file SMS adapter refuses to run in production.

## Roles and permissions

The role-to-permission map lives in `apps/identity/src/common/permissions.ts`. `SUPER_ADMIN` receives every platform permission. Administrators and sellers receive only the permissions listed for their roles. `admin.users.manage`, `admin.settings.manage` and `platform.roles.manage` are restricted to `SUPER_ADMIN`.

No endpoint currently grants a role after registration. Seller application and administrator approval are the next vertical slice.

## Frontend routes

| Route | Behaviour |
|---|---|
| `/sign-up` | Customer registration; shows verification follow-up after success |
| `/verify-email` | Accepts the six-digit OTP from the email; query string prefills the address |
| `/sign-in` | Email/phone sign-in with resend option for unverified accounts |
| `/forgot-password` | Requests a reset message without disclosing account state |
| `/reset-password` | Consumes the reset token and confirms session revocation |
| `/account` | Protected account summary, verification state, phone verification and sign-out |
| `/seller`, `/admin` | Protected entry points; later phases will replace the placeholders |

The access token is held in memory. On reload the browser calls `/auth/refresh` using the cookie, and a refresh is scheduled shortly before access-token expiry.

## Database and seed commands

```sh
npm run build --workspace=@sokolink/identity
npm run db:migrate:identity
npm run auth:seed-super-admin
```

`auth:seed-super-admin` requires `SUPER_ADMIN_FULL_NAME`, `SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_PHONE` and `SUPER_ADMIN_PASSWORD` in the ignored `.env`. In production it also requires `ALLOW_SUPER_ADMIN_SEED=true`. It refuses to reuse an existing email address or phone number.

The initial migration is `apps/identity/prisma/migrations/20261113090000_identity_phase_one`.

## Verification record

Executed on 2026-11-13:

- `npm run build`: passed for all 12 projects.
- `npm test`: passed for all 10 test projects. Identity contributes 7 files / 26 tests covering registration, login, lockout, refresh rotation and reuse, password policy, token handling, validation and permissions.
- `npm run test:di --workspace=@sokolink/identity`: compiled `AppModule` against the built output with a stubbed database and resolved `AuthService`, `SessionService`, `VerificationService` and the global guards. Vitest uses esbuild, which does not emit `emitDecoratorMetadata`, so this check runs against the `tsc` build through `scripts/check-di.cjs` instead of a Vitest spec.
- Gateway proxy integration: with a stub identity listener on `:3101`, `GET /api/v1/auth/hello?x=1` through the gateway reached the upstream with the path, `Authorization` header and `sokolink_refresh` cookie intact.
- `npm run lint`: passed for all 12 projects.
- `npm run db:migrate:identity`: failed with Prisma `P1001` because nothing is listening on `localhost:5432`; no database was available to apply the migration.
- Docker/Compose, container health and browser workflows were not executed because this environment has no Docker Engine, Compose plugin or PostgreSQL server.

## Deliberate limitations

- Account profile editing, email address change, authenticated password change and session listing/revocation are not part of this slice.
- The unauthenticated marketplace remains a landing shell until the catalogue slice.
- Seller, catalogue, inventory, order, payment, fulfilment and notification workflows remain placeholders.
- The administration interface is a protected placeholder; user management and seller review interfaces are not built.
- Phone verification is offered after registration but is not required for login. Email verification is required.
