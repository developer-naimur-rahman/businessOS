-- CreateEnum
CREATE TYPE "AccessTier" AS ENUM ('PUBLIC', 'PRIVATE_CUSTOMER', 'INTERNAL');

-- CreateEnum
CREATE TYPE "ServiceFulfillmentStatus" AS ENUM ('PENDING_FILES', 'QUEUED', 'PROCESSING', 'READY_FOR_PICKUP', 'COMPLETED', 'CANCELLED');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "serviceConfigSchema" JSONB;

-- AlterTable
ALTER TABLE "SaleLine" ADD COLUMN     "configurationSnapshot" JSONB,
ADD COLUMN     "fulfillmentStatus" "ServiceFulfillmentStatus";

-- CreateTable
CREATE TABLE "StorageObject" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "customerId" TEXT,
    "saleLineId" TEXT,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "storageKey" TEXT NOT NULL,
    "accessType" "AccessTier" NOT NULL DEFAULT 'PRIVATE_CUSTOMER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StorageObject_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StorageObject_organizationId_saleLineId_idx" ON "StorageObject"("organizationId", "saleLineId");

-- CreateIndex
CREATE INDEX "StorageObject_organizationId_customerId_idx" ON "StorageObject"("organizationId", "customerId");

-- AddForeignKey
ALTER TABLE "StorageObject" ADD CONSTRAINT "StorageObject_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorageObject" ADD CONSTRAINT "StorageObject_organizationId_customerId_fkey" FOREIGN KEY ("organizationId", "customerId") REFERENCES "Customer"("organizationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorageObject" ADD CONSTRAINT "StorageObject_saleLineId_fkey" FOREIGN KEY ("saleLineId") REFERENCES "SaleLine"("id") ON DELETE SET NULL ON UPDATE CASCADE;
