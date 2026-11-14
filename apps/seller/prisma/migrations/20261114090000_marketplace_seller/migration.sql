-- CreateEnum
CREATE TYPE "SellerApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "StorefrontStatus" AS ENUM ('ACTIVE', 'PAUSED');

-- CreateTable
CREATE TABLE "SellerApplication" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "businessName" VARCHAR(160) NOT NULL,
    "businessCategory" VARCHAR(120) NOT NULL,
    "region" VARCHAR(80) NOT NULL,
    "district" VARCHAR(80) NOT NULL,
    "phone" VARCHAR(32) NOT NULL,
    "description" TEXT NOT NULL,
    "status" "SellerApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "submittedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMPTZ(3),
    "reviewedBy" UUID,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "SellerApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SellerProfile" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "businessName" VARCHAR(160) NOT NULL,
    "slug" VARCHAR(180) NOT NULL,
    "businessCategory" VARCHAR(120) NOT NULL,
    "region" VARCHAR(80) NOT NULL,
    "district" VARCHAR(80) NOT NULL,
    "phone" VARCHAR(32) NOT NULL,
    "email" VARCHAR(254),
    "description" TEXT NOT NULL,
    "logoData" BYTEA,
    "logoContentType" VARCHAR(60),
    "status" "StorefrontStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "SellerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SellerApplication_userId_key" ON "SellerApplication"("userId");

-- CreateIndex
CREATE INDEX "SellerApplication_status_submittedAt_idx" ON "SellerApplication"("status", "submittedAt");

-- CreateIndex
CREATE UNIQUE INDEX "SellerProfile_userId_key" ON "SellerProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SellerProfile_slug_key" ON "SellerProfile"("slug");

-- CreateIndex
CREATE INDEX "SellerProfile_status_businessName_idx" ON "SellerProfile"("status", "businessName");

