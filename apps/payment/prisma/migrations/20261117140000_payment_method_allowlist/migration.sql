-- Disable payment methods outside the approved mobile money and cash MVP
UPDATE "PaymentMethod"
SET "enabled" = false,
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "kind" IN ('BANK_TRANSFER', 'CARD');
