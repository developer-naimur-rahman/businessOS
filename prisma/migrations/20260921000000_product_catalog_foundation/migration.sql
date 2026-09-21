-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "TrackingType" AS ENUM ('NONE', 'SERIAL');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO', 'PDF');

-- DropForeignKey
ALTER TABLE "Branch" DROP CONSTRAINT "Branch_businessUnitId_fkey";

-- DropForeignKey
ALTER TABLE "Category" DROP CONSTRAINT "Category_parentId_fkey";

-- DropForeignKey
ALTER TABLE "InventoryMovement" DROP CONSTRAINT "InventoryMovement_productId_fkey";

-- DropForeignKey
ALTER TABLE "InventoryMovement" DROP CONSTRAINT "InventoryMovement_warehouseId_fkey";

-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_unitId_fkey";

-- DropForeignKey
ALTER TABLE "Sale" DROP CONSTRAINT "Sale_branchId_fkey";

-- DropForeignKey
ALTER TABLE "Sale" DROP CONSTRAINT "Sale_customerId_fkey";

-- DropForeignKey
ALTER TABLE "Sale" DROP CONSTRAINT "Sale_warehouseId_fkey";

-- DropForeignKey
ALTER TABLE "SaleLine" DROP CONSTRAINT "SaleLine_productId_fkey";

-- DropForeignKey
ALTER TABLE "SaleLine" DROP CONSTRAINT "SaleLine_saleId_fkey";

-- DropForeignKey
ALTER TABLE "StockBalance" DROP CONSTRAINT "StockBalance_productId_fkey";

-- DropForeignKey
ALTER TABLE "StockBalance" DROP CONSTRAINT "StockBalance_warehouseId_fkey";

-- DropForeignKey
ALTER TABLE "Warehouse" DROP CONSTRAINT "Warehouse_branchId_fkey";

-- DropIndex
DROP INDEX "InventoryMovement_organizationId_warehouseId_productId_idx";

-- DropIndex
DROP INDEX "Product_organizationId_categoryId_idx";

-- DropIndex
DROP INDEX "Product_organizationId_isActive_idx";

-- DropIndex
DROP INDEX "StockBalance_organizationId_warehouseId_productId_key";

-- AlterTable
ALTER TABLE "InventoryMovement" ADD COLUMN "serialNumber" TEXT, ADD COLUMN "variantId" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "isOnlineVisible" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isPosVisible" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "status" "ProductStatus" NOT NULL DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "SaleLine" 
    ADD COLUMN "organizationId" TEXT,
    ADD COLUMN "productNameSnapshot" TEXT NOT NULL DEFAULT '',
    ADD COLUMN "skuSnapshot" TEXT NOT NULL DEFAULT '',
    ADD COLUMN "variantId" TEXT;
  
  -- Update organizationId safely
  UPDATE "SaleLine" sl 
  SET "organizationId" = s."organizationId" 
  FROM "Sale" s 
  WHERE sl."saleId" = s.id;
  
  ALTER TABLE "SaleLine" ALTER COLUMN "organizationId" SET NOT NULL;
  

-- AlterTable
ALTER TABLE "StockBalance" ADD COLUMN "variantId" TEXT;

-- CreateTable
CREATE TABLE "ProductVariant" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "costPrice" DECIMAL(19,4),
    "retailPrice" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "posPrice" DECIMAL(19,4),
    "trackingType" "TrackingType" NOT NULL DEFAULT 'NONE',
    "status" "ProductStatus" NOT NULL DEFAULT 'ACTIVE',
    "attributeHash" TEXT NOT NULL DEFAULT '',
    "isOnlineVisible" BOOLEAN,
    "isPosVisible" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductVariantBarcode" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "barcode" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ProductVariantBarcode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attribute" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Attribute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttributeValue" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "attributeId" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "AttributeValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VariantAttribute" (
    "organizationId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "attributeValueId" TEXT NOT NULL,

    CONSTRAINT "VariantAttribute_pkey" PRIMARY KEY ("variantId","attributeValueId")
);

-- CreateTable
CREATE TABLE "ProductMedia" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "url" TEXT NOT NULL,
    "type" "MediaType" NOT NULL DEFAULT 'IMAGE',
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ProductMedia_pkey" PRIMARY KEY ("id")
);


-- =====================================================================
-- BEGIN MANUAL BACKFILL
-- =====================================================================

-- 1. Create Default Variants for all existing Products
INSERT INTO "ProductVariant" ("id", "organizationId", "productId", "sku", "costPrice", "retailPrice", "posPrice", "trackingType", "status", "attributeHash", "isOnlineVisible", "isPosVisible", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid(),
  "organizationId",
  "id",
  COALESCE(
    (SELECT "code" FROM "Product" p2 WHERE p2.id = p.id AND p2.code IS NOT NULL AND p2.code != ''), 
    'MIG-' || p.id
  ),
  "costPrice",
  "sellingPrice",
  "sellingPrice",
  'NONE',
  'ACTIVE',
  '',
  false,
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "Product" p;

-- 2. Backfill SaleLine
UPDATE "SaleLine" sl
SET "variantId" = pv.id
FROM "ProductVariant" pv
WHERE pv."organizationId" = sl."organizationId"
  AND pv."productId" = sl."productId";

-- 3. Backfill InventoryMovement
UPDATE "InventoryMovement" im
SET "variantId" = pv.id
FROM "ProductVariant" pv
WHERE pv."organizationId" = im."organizationId"
  AND pv."productId" = im."productId";

-- 4. Backfill StockBalance
UPDATE "StockBalance" sb
SET "variantId" = pv.id
FROM "ProductVariant" pv
WHERE pv."organizationId" = sb."organizationId"
  AND pv."productId" = sb."productId";

-- 5. Data Integrity Checks
DO $$ 
DECLARE
  missing_sl INT;
  missing_im INT;
  missing_sb INT;
BEGIN
  SELECT COUNT(*) INTO missing_sl FROM "SaleLine" WHERE "variantId" IS NULL;
  IF missing_sl > 0 THEN RAISE EXCEPTION 'SaleLine backfill failed: % rows missing variantId', missing_sl; END IF;

  SELECT COUNT(*) INTO missing_im FROM "InventoryMovement" WHERE "variantId" IS NULL;
  IF missing_im > 0 THEN RAISE EXCEPTION 'InventoryMovement backfill failed: % rows missing variantId', missing_im; END IF;

  SELECT COUNT(*) INTO missing_sb FROM "StockBalance" WHERE "variantId" IS NULL;
  IF missing_sb > 0 THEN RAISE EXCEPTION 'StockBalance backfill failed: % rows missing variantId', missing_sb; END IF;
END $$;

-- 6. Make VariantId Columns NOT NULL
ALTER TABLE "SaleLine" ALTER COLUMN "variantId" SET NOT NULL;
ALTER TABLE "InventoryMovement" ALTER COLUMN "variantId" SET NOT NULL;
ALTER TABLE "StockBalance" ALTER COLUMN "variantId" SET NOT NULL;

-- 7. Drop productId Columns
ALTER TABLE "SaleLine" DROP COLUMN "productId";
ALTER TABLE "InventoryMovement" DROP COLUMN "productId";
ALTER TABLE "StockBalance" DROP COLUMN "productId";

-- =====================================================================
-- END MANUAL BACKFILL
-- =====================================================================

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_organizationId_id_key" ON "ProductVariant"("organizationId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_organizationId_sku_key" ON "ProductVariant"("organizationId", "sku");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_productId_attributeHash_key" ON "ProductVariant"("productId", "attributeHash");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariantBarcode_organizationId_barcode_key" ON "ProductVariantBarcode"("organizationId", "barcode");

-- CreateIndex
CREATE UNIQUE INDEX "Attribute_organizationId_id_key" ON "Attribute"("organizationId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Attribute_organizationId_name_key" ON "Attribute"("organizationId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "AttributeValue_organizationId_id_key" ON "AttributeValue"("organizationId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "AttributeValue_organizationId_attributeId_value_key" ON "AttributeValue"("organizationId", "attributeId", "value");

-- CreateIndex
CREATE UNIQUE INDEX "Branch_organizationId_id_key" ON "Branch"("organizationId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessUnit_organizationId_id_key" ON "BusinessUnit"("organizationId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Category_organizationId_id_key" ON "Category"("organizationId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_organizationId_id_key" ON "Customer"("organizationId", "id");

-- CreateIndex
CREATE INDEX "InventoryMovement_organizationId_warehouseId_variantId_idx" ON "InventoryMovement"("organizationId", "warehouseId", "variantId");

-- CreateIndex
CREATE INDEX "Product_organizationId_status_idx" ON "Product"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Product_organizationId_id_key" ON "Product"("organizationId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Sale_organizationId_id_key" ON "Sale"("organizationId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "StockBalance_organizationId_warehouseId_variantId_key" ON "StockBalance"("organizationId", "warehouseId", "variantId");

-- CreateIndex
CREATE UNIQUE INDEX "Unit_organizationId_id_key" ON "Unit"("organizationId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Warehouse_organizationId_id_key" ON "Warehouse"("organizationId", "id");

-- AddForeignKey
ALTER TABLE "Branch" ADD CONSTRAINT "Branch_organizationId_businessUnitId_fkey" FOREIGN KEY ("organizationId", "businessUnitId") REFERENCES "BusinessUnit"("organizationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Warehouse" ADD CONSTRAINT "Warehouse_organizationId_branchId_fkey" FOREIGN KEY ("organizationId", "branchId") REFERENCES "Branch"("organizationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_organizationId_parentId_fkey" FOREIGN KEY ("organizationId", "parentId") REFERENCES "Category"("organizationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_organizationId_categoryId_fkey" FOREIGN KEY ("organizationId", "categoryId") REFERENCES "Category"("organizationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_organizationId_unitId_fkey" FOREIGN KEY ("organizationId", "unitId") REFERENCES "Unit"("organizationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_organizationId_variantId_fkey" FOREIGN KEY ("organizationId", "variantId") REFERENCES "ProductVariant"("organizationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_organizationId_warehouseId_fkey" FOREIGN KEY ("organizationId", "warehouseId") REFERENCES "Warehouse"("organizationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockBalance" ADD CONSTRAINT "StockBalance_organizationId_warehouseId_fkey" FOREIGN KEY ("organizationId", "warehouseId") REFERENCES "Warehouse"("organizationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockBalance" ADD CONSTRAINT "StockBalance_organizationId_variantId_fkey" FOREIGN KEY ("organizationId", "variantId") REFERENCES "ProductVariant"("organizationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_organizationId_branchId_fkey" FOREIGN KEY ("organizationId", "branchId") REFERENCES "Branch"("organizationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_organizationId_warehouseId_fkey" FOREIGN KEY ("organizationId", "warehouseId") REFERENCES "Warehouse"("organizationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_organizationId_customerId_fkey" FOREIGN KEY ("organizationId", "customerId") REFERENCES "Customer"("organizationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleLine" ADD CONSTRAINT "SaleLine_organizationId_saleId_fkey" FOREIGN KEY ("organizationId", "saleId") REFERENCES "Sale"("organizationId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleLine" ADD CONSTRAINT "SaleLine_organizationId_variantId_fkey" FOREIGN KEY ("organizationId", "variantId") REFERENCES "ProductVariant"("organizationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleLine" ADD CONSTRAINT "SaleLine_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_organizationId_productId_fkey" FOREIGN KEY ("organizationId", "productId") REFERENCES "Product"("organizationId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariantBarcode" ADD CONSTRAINT "ProductVariantBarcode_organizationId_variantId_fkey" FOREIGN KEY ("organizationId", "variantId") REFERENCES "ProductVariant"("organizationId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariantBarcode" ADD CONSTRAINT "ProductVariantBarcode_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attribute" ADD CONSTRAINT "Attribute_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttributeValue" ADD CONSTRAINT "AttributeValue_organizationId_attributeId_fkey" FOREIGN KEY ("organizationId", "attributeId") REFERENCES "Attribute"("organizationId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttributeValue" ADD CONSTRAINT "AttributeValue_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VariantAttribute" ADD CONSTRAINT "VariantAttribute_organizationId_variantId_fkey" FOREIGN KEY ("organizationId", "variantId") REFERENCES "ProductVariant"("organizationId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VariantAttribute" ADD CONSTRAINT "VariantAttribute_organizationId_attributeValueId_fkey" FOREIGN KEY ("organizationId", "attributeValueId") REFERENCES "AttributeValue"("organizationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VariantAttribute" ADD CONSTRAINT "VariantAttribute_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductMedia" ADD CONSTRAINT "ProductMedia_organizationId_productId_fkey" FOREIGN KEY ("organizationId", "productId") REFERENCES "Product"("organizationId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductMedia" ADD CONSTRAINT "ProductMedia_organizationId_variantId_fkey" FOREIGN KEY ("organizationId", "variantId") REFERENCES "ProductVariant"("organizationId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductMedia" ADD CONSTRAINT "ProductMedia_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Create Partial Unique Indexes for ProductMedia
CREATE UNIQUE INDEX "ProductMedia_organizationId_productId_isPrimary_key" ON "ProductMedia"("organizationId", "productId") WHERE "isPrimary" = true AND "variantId" IS NULL;
CREATE UNIQUE INDEX "ProductMedia_organizationId_variantId_isPrimary_key" ON "ProductMedia"("organizationId", "variantId") WHERE "isPrimary" = true AND "variantId" IS NOT NULL;
