# Database ownership

## Rule

Every service is the only writer and reader of its owned operational data. Other services use its REST contract for synchronous decisions or consume events into local projections. There are no shared application tables, cross-service joins, or credentials that can read another service's database.

## Ownership map

| Owner | Initial database | Example owned records | Cross-service access |
|---|---|---|---|
| Identity | `identity_db` | accounts, password hashes, contact verification, sessions, grants | Subject ID and minimal account facts via API/events |
| Seller | `seller_db` | student profile/evidence references, verification cases, applications, review history, storefront | Approval status events; evidence access only through authorized seller API |
| Catalogue | `catalogue_db` | categories, product/variant data, image metadata, listing projection | Seller IDs and approval projection; no seller DB reads |
| Inventory | `inventory_db` | stock balance, reservation, movements, reconciliation | Product and seller IDs; catalogue contract for validation when needed |
| Commerce | `commerce_db` | cart, orders, suborders, saga, status history | Owns order lifecycle; references customer/product/seller IDs |
| Payment | `payment_db` | intents, transactions, provider callback receipts, refunds, reconciliation | Order/payment reference; no order DB reads |
| Fulfilment | `fulfilment_db` | delivery/pickup jobs, status, external tracking reference | Order and seller references, minimum delivery details |
| Notifications | `notification_db` | inbox, preferences, attempts, template metadata | Consumes events with recipient references and minimal render data |
| Administration | `admin_db` | reporting projections, moderation queues, admin action references | Event-fed read models; canonical audit action recorded by owning service |

## PostgreSQL deployment

Development may run one PostgreSQL container, but provision a database and least-privilege role per service. Production may use separate managed instances or clusters based on recovery and load needs; shared hosting does not change ownership. Each service runs its own forward-only migration workflow and controls schema changes. Backups and restore drills are scoped and tested per owned database.

## Constraints and sensitive data

Use database constraints for local invariants: unique normalized email/phone, unique provider transaction identifiers, foreign keys within the service, nonnegative stock, and unique idempotency/deduplication keys. Cross-service references are opaque IDs and validated by contract. Keep student evidence in restricted object storage in a later phase; store references and retention metadata, not documents in broad event payloads. Define deletion, retention, export and access policies before collecting real student IDs.

## Reporting

Analytics consumes event streams into materialized projections owned by Administration & Analytics. Projections are eventually consistent, carry source event time/sequence and freshness, and never become authoritative for checkout, payment or stock decisions. Financial reconciliation uses the payment service's canonical transaction records and provider statements.
