-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ProductCondition" AS ENUM ('NEW', 'USED', 'REFURBISHED');

-- CreateTable
CREATE TABLE "Category" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(80) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "imageUrl" VARCHAR(500),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" UUID NOT NULL,
    "sellerId" UUID NOT NULL,
    "sellerName" VARCHAR(160) NOT NULL,
    "categoryId" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "slug" VARCHAR(240) NOT NULL,
    "description" TEXT NOT NULL,
    "condition" "ProductCondition" NOT NULL DEFAULT 'NEW',
    "brand" VARCHAR(120),
    "model" VARCHAR(120),
    "unit" VARCHAR(30) NOT NULL DEFAULT 'piece',
    "priceTzs" INTEGER NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'TZS',
    "status" "ProductStatus" NOT NULL DEFAULT 'DRAFT',
    "rejectionReason" TEXT,
    "submittedAt" TIMESTAMPTZ(3),
    "approvedAt" TIMESTAMPTZ(3),
    "approvedBy" UUID,
    "archivedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductImage" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "data" BYTEA NOT NULL,
    "contentType" VARCHAR(60) NOT NULL,
    "alt" VARCHAR(200),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductSpecification" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "value" VARCHAR(300) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProductSpecification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE INDEX "Category_sortOrder_idx" ON "Category"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE INDEX "Product_status_createdAt_idx" ON "Product"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Product_categoryId_status_idx" ON "Product"("categoryId", "status");

-- CreateIndex
CREATE INDEX "Product_sellerId_status_idx" ON "Product"("sellerId", "status");

-- CreateIndex
CREATE INDEX "Product_priceTzs_idx" ON "Product"("priceTzs");

-- CreateIndex
CREATE INDEX "ProductImage_productId_sortOrder_idx" ON "ProductImage"("productId", "sortOrder");

-- CreateIndex
CREATE INDEX "ProductSpecification_productId_sortOrder_idx" ON "ProductSpecification"("productId", "sortOrder");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSpecification" ADD CONSTRAINT "ProductSpecification_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Initial marketplace categories
INSERT INTO "Category" ("id", "slug", "name", "description", "sortOrder", "updatedAt") VALUES
  (gen_random_uuid(), 'phones-electronics', 'Phones & Electronics', 'Smartphones, accessories, computing and consumer electronics.', 10, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'fashion-clothing', 'Fashion & Clothing', 'Clothing, footwear, bags and accessories for everyday style.', 20, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'home-kitchen', 'Home & Kitchen', 'Durable everyday items for homes, kitchens and shared spaces.', 30, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'beauty-personal-care', 'Beauty & Personal Care', 'Skincare, grooming and personal care essentials.', 40, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'food-groceries', 'Food & Groceries', 'Local food, fresh produce, snacks and household groceries.', 50, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'books-stationery', 'Books & Stationery', 'Textbooks, study materials, office supplies and stationery.', 60, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'sports-outdoors', 'Sports & Outdoors', 'Fitness, sportswear and outdoor equipment.', 70, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'baby-kids', 'Baby & Kids', 'Products for infants, children and young families.', 80, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'agriculture-farming', 'Agriculture & Farming', 'Seeds, tools, inputs and produce from local growers.', 90, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'services', 'Services & Skills', 'Professional, creative and student-run services.', 100, CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO NOTHING;
