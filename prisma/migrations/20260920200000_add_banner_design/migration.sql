-- CreateTable
CREATE TABLE "BannerDesign" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "branchId" TEXT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "width" DECIMAL(10,2) NOT NULL,
    "height" DECIMAL(10,2) NOT NULL,
    "unit" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "settings" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BannerDesign_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BannerDesign_organizationId_idx" ON "BannerDesign"("organizationId");

-- CreateIndex
CREATE INDEX "BannerDesign_branchId_idx" ON "BannerDesign"("branchId");

-- AddForeignKey
ALTER TABLE "BannerDesign" ADD CONSTRAINT "BannerDesign_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BannerDesign" ADD CONSTRAINT "BannerDesign_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
