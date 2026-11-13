# Service communication

## Synchronous REST

External clients use the API Gateway and versioned REST endpoints documented with OpenAPI/Swagger. Internal REST is used when the caller cannot safely continue without an immediate answer: checkout stock reservation, payment-intent creation, and fulfilment job creation. Calls have deadlines, bounded retries only for safe/idempotent operations, and correlation/trace headers. Avoid long chains; a gateway request should not fan out across many domains.

## Asynchronous events

RabbitMQ is the initial broker. Use domain events for committed facts and deferred work: account registration, seller review outcomes, catalogue changes, order lifecycle, payment callbacks, stock alerts, fulfilment updates and notifications. Events have a stable envelope (`id`, `type`, `version`, `occurredAt`, `producer`, `correlationId`, `causationId`, payload). Payloads contain identifiers and the minimum necessary fields. Consumers tolerate unknown optional fields and version explicitly breaking changes.

Use durable exchanges and queues, persistent messages, publisher confirms, manual acknowledgements, prefetch limits, bounded exponential retry and dead-letter queues. For critical domains, use quorum queues when RabbitMQ is clustered. Local Compose can use a single broker and cannot demonstrate HA. Monitor queue depth, oldest message, redeliveries and dead-letter volume. Consumers deduplicate event IDs and acknowledge only after local commit.

## Transactional outbox and inbox

For each state change whose event must not be lost, write domain state and an outbox row in the same local database transaction. A publisher worker claims rows, publishes with confirms, and marks them delivered; publication can repeat, so event IDs are stable. Consumers persist an inbox/deduplication record with their projection or effect in one local transaction. Do not attempt a distributed database/broker transaction.

## Sagas and eventual consistency

Checkout is an orchestrated saga owned by Commerce. It records each step and timeout. A typical path is: validate cart snapshot, reserve inventory, create payment intent, wait for verified provider result, mark order paid, then create fulfilment. A failed/expired payment releases reservations; cancellation after payment invokes refund workflow and records asynchronous status. Every participant uses stable operation IDs. A reconciliation worker identifies stuck sagas and payment/provider mismatches; operators can inspect and safely replay.

Seller approval is also event-driven: Seller records the explicit administrative decision, emits the outcome, and Identity updates effective seller grants according to an agreed policy. Until propagation completes, seller actions are denied by default. Seller status is also projected by Catalogue for listing controls.

## Reliability contract

Assume duplicate delivery, out-of-order events across different routing keys, process crashes between commit and acknowledgement, and provider timeouts with unknown outcomes. Make commands idempotent using caller idempotency keys plus a request hash; same key/different request is rejected. Payment callbacks validate provider authentication/signatures, timestamp/replay controls, amount/currency/reference and queried transaction status where supported. Browser redirects only display status.
