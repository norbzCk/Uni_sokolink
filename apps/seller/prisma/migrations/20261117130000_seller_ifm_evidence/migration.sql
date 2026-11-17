-- AlterTable
ALTER TABLE "SellerApplication"
  ADD COLUMN "institution" VARCHAR(160) NOT NULL DEFAULT 'UNKNOWN',
  ADD COLUMN "studentRegistrationNumber" VARCHAR(64) NOT NULL DEFAULT '',
  ADD COLUMN "evidenceReference" VARCHAR(160) NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "SellerProfile" ADD COLUMN "verified" BOOLEAN NOT NULL DEFAULT false;

-- Backfill
UPDATE "SellerProfile" AS p
SET "verified" = true
FROM "SellerApplication" AS a
WHERE p."userId" = a."userId" AND a."status" = 'APPROVED';
