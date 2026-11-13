# Security architecture

Security controls are designed into every service; a gateway check never replaces domain authorization.

## Identity and access

- Hash passwords with Argon2id using reviewed production parameters, unique salts and library-managed encoding. Never log credentials. Password reset tokens are random, short-lived, single-use and stored hashed.
- Use short-lived signed access tokens with strict issuer, audience, algorithm and expiry validation. Keep signing keys in a secret manager and support key rotation. Refresh tokens are opaque, high entropy, stored hashed, rotated on use, and revoked on logout, compromise or password reset; detect reuse and revoke the token family.
- Use secure, HttpOnly, SameSite cookies for browser refresh/session credentials; protect state-changing cookie-authenticated requests against CSRF. Avoid browser local storage for long-lived bearer credentials.
- Default-deny authorization. Define granular permissions and resource scope, such as seller ownership and admin review capability. CUSTOMER access can coexist with a seller application. SELLER permissions activate only after an audited approval event. DELIVERY_PARTNER sees assigned deliveries only. SUPER_ADMIN is tightly controlled and audited.

## Application/API controls

Validate and transform all request DTOs; reject unknown fields where practical. Apply output encoding, parameterized queries, safe file upload handling, request/body limits, pagination limits, and secure error responses. Rate-limit registration, login, verification, checkout, password recovery and webhooks by suitable identity/network keys. Set explicit CORS origins, methods and headers per environment. Use TLS externally and service-to-service identity/network controls in production. Maintain OpenAPI contracts without exposing internal fields.

Protect against OWASP web/API risks: broken object-level and function-level authorization, injection, SSRF, insecure configuration, resource exhaustion, authentication failures and unsafe third-party dependencies. Review each new endpoint and provider integration for abuse cases.

## Payments and webhooks

Payment credentials are server-side secrets, never frontend configuration. Authenticate callbacks using provider-supported signatures/credentials, constant-time comparisons where applicable, replay protection and allow-listing only when provider guidance supports it. Persist callback receipt and deduplication key before responding. Validate merchant reference, amount, currency and terminal state; query provider status when callback semantics require it. Only a verified server-side result transitions payment. Restrict webhook routes and rate limits; redact payloads from logs.

## Privacy, audit and secrets

Collect only fields needed for stated workflows. Restrict student evidence to designated reviewers and record access. Define retention and deletion schedules before production. Audit seller decisions, role changes, payment/refund adjustments, moderation and privileged access with actor, action, target, timestamp, correlation ID and reason; prevent ordinary users from altering audit history. Avoid storing secrets in source control or `.env.example`; production secrets belong in managed secret storage. Local credentials are disposable and documented as development-only.

## Reliability and secure operations

Enforce database uniqueness/check constraints, least-privilege credentials, encrypted backups, dependency/image scanning, patching, migrations review, and tested restoration. Use structured logs with request IDs while excluding passwords, tokens, verification documents and payment secrets. Keep liveness/readiness separate. Alert on auth abuse, privilege changes, failed signature validation, payment reconciliation drift and dead-letter growth. Establish incident response, key rotation and breach handling before launch.
