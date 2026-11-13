# Product requirements

## Product intent

SokoLink helps students at IFM initially establish and operate small businesses while studying. It connects storefront management and basic business operations with customer discovery, orders and payments. The product should be able to serve a broader community later without tying identity or domain rules to IFM systems.

## Audiences and outcomes

| Audience | Required outcomes |
|---|---|
| Customer | Register once, discover sellers/products, search/filter, view availability and storefront details, place and track orders, pay through supported providers, and review eligible purchases/sellers. |
| Seller applicant | Maintain a customer account, submit student and business information, see review status/reason, correct and resubmit an application. |
| Approved seller | Manage storefront, products, variants/prices/availability, inventory, incoming orders, customer interactions, sales and expense/business performance information as those features are phased in. |
| Administrator | Review eligibility and seller applications, record explicit approve/reject decisions and reasons, moderate marketplace content, inspect audit records and platform health/reporting. |
| Delivery partner | Access assigned fulfilments and update permitted statuses; only if the operational model enables partners. |

## Functional scope

1. Identity supports customer registration with full name, email, phone, password and confirmation; student details are collected in the verification/application flow. Email/phone verification and password recovery are supported.
2. A single account may have customer capabilities and submit a seller application. Submission does not grant seller rights. A named administrator action approves or rejects with a reason; rejected applicants can correct and resubmit while prior decisions remain auditable.
3. Seller storefront and catalogue management are available only to approved sellers. Product lifecycle, categories, images, variants, price and availability are represented.
4. Customers browse categories, sellers and products, search/filter, maintain a cart, checkout, see order status and submit reviews subject to eligibility/moderation policy.
5. Commerce supports orders with multiple sellers and distinct seller suborders. Stock is reserved during checkout and released/adjusted on defined saga outcomes.
6. Payment is provider-neutral. Initial candidates include Vodacom M-Pesa, Airtel Money and Mixx by Yas, subject to technical access, business approval, pricing and sandbox validation. Payment status is based on verified server-side provider evidence.
7. Fulfilment supports seller-arranged delivery, campus pickup, and optional delivery partners. External tracking reference/URL is supported; live GPS tracking is out of initial scope.
8. Notifications support in-app and email initially; SMS is added only when justified by delivery/verification needs and cost.
9. Seller business operations eventually include stock movement, sales, expenses and performance reporting; expense workflows need a product definition before implementation.

## Non-functional requirements

- Backend APIs use NestJS/TypeScript, REST and documented OpenAPI; web uses React/TypeScript/Tailwind; PostgreSQL; Docker Compose for development.
- Services own their data and can be built/deployed independently. No direct cross-service database access.
- Authorization is enforced by services with scoped permissions. Sensitive student and payment data is minimized and access-audited.
- Important commands and event consumers are idempotent. Event workflows tolerate retries and partial failure.
- Responsive mobile-first customer and seller experiences, accessible forms and explicit loading, empty, validation and error states.
- Structured logs, request correlation, health/readiness endpoints and operational metrics are part of service foundations.
- Automated unit, contract, integration and end-to-end tests are included in the engineering plan before product release.

## Exclusions from foundation

No assumed IFM API, automated institutional verification, live payment production access, proprietary live GPS, public deployment, commission/payout settlement policy, or unspecified financial/accounting compliance features. These require confirmed requirements and stakeholder/provider review.

## Open product decisions

Confirm launch geography beyond the initial IFM community; exact student evidence fields and retention; review service levels; commissions and seller payouts; refund/cancellation/dispute policy; multi-seller shipping fees and split fulfilment; review eligibility/moderation; seller expense semantics; delivery partner onboarding; and required payment methods at launch.
