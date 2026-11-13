# commerce database migrations

This service owns its schema and migration history. Create reviewed, additive Prisma migrations within this service and apply with prisma migrate deploy during controlled startup/release. Never edit another service schema or run cross-database migrations. No business tables are defined in the foundation.
