-- CreateEnum
CREATE TYPE "CustomerCategory" AS ENUM ('UNKNOWN', 'STUDENT', 'STAFF');

-- AlterTable
ALTER TABLE "User"
  ADD COLUMN "customerCategory" "CustomerCategory" NOT NULL DEFAULT 'UNKNOWN',
  ADD COLUMN "institution" VARCHAR(160),
  ADD COLUMN "studentRegistrationNumber" VARCHAR(64);
