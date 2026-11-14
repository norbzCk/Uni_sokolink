-- CreateEnum
CREATE TYPE "PaymentMethodKind" AS ENUM ('CASH', 'MOBILE_MONEY', 'BANK_TRANSFER', 'CARD');

-- CreateEnum
CREATE TYPE "PaymentRecordStatus" AS ENUM ('PENDING', 'PENDING_CONFIRMATION', 'PAID', 'FAILED', 'REFUNDED');

-- CreateTable
CREATE TABLE "PaymentMethod" (
    "code" VARCHAR(40) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "description" VARCHAR(300) NOT NULL,
    "kind" "PaymentMethodKind" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "instructions" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "PaymentMethod_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "buyerId" UUID NOT NULL,
    "amountTzs" INTEGER NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'TZS',
    "methodCode" VARCHAR(40) NOT NULL,
    "methodName" VARCHAR(120) NOT NULL,
    "status" "PaymentRecordStatus" NOT NULL DEFAULT 'PENDING',
    "instructions" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Payment_orderId_key" ON "Payment"("orderId");

-- CreateIndex
CREATE INDEX "Payment_buyerId_createdAt_idx" ON "Payment"("buyerId", "createdAt");

-- CreateIndex
CREATE INDEX "Payment_status_createdAt_idx" ON "Payment"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_methodCode_fkey" FOREIGN KEY ("methodCode") REFERENCES "PaymentMethod"("code") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Payment methods genuinely supported by the current manual settlement flow.
INSERT INTO "PaymentMethod" ("code", "name", "description", "kind", "enabled", "instructions", "sortOrder", "updatedAt") VALUES
  ('CASH_ON_DELIVERY', 'Cash on delivery', 'Pay the seller in cash when your order is delivered.', 'CASH', true, 'Keep the exact amount ready. The seller will confirm delivery details before handover.', 10, CURRENT_TIMESTAMP),
  ('PAY_ON_PICKUP', 'Pay on pickup', 'Reserve now and pay in cash or mobile money when you collect your order.', 'CASH', true, 'The seller will share the pickup location after confirming your order.', 20, CURRENT_TIMESTAMP),
  ('MPESA', 'Vodacom M-Pesa', 'Mobile money through Vodacom M-Pesa.', 'MOBILE_MONEY', false, 'M-Pesa online payments are not enabled yet.', 30, CURRENT_TIMESTAMP),
  ('AIRTEL_MONEY', 'Airtel Money', 'Mobile money through Airtel Money.', 'MOBILE_MONEY', false, 'Airtel Money online payments are not enabled yet.', 40, CURRENT_TIMESTAMP),
  ('MIXX_BY_YAS', 'Mixx by Yas', 'Mobile money through Mixx by Yas.', 'MOBILE_MONEY', false, 'Mixx by Yas online payments are not enabled yet.', 50, CURRENT_TIMESTAMP),
  ('BANK_TRANSFER', 'Bank transfer', 'Pay by bank transfer using details confirmed by the seller.', 'BANK_TRANSFER', false, 'Bank transfer details must be confirmed by the seller before this method can be enabled.', 60, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;
